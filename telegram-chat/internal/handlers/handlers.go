package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/block52/poker-vm/telegram-chat/internal/config"
	"github.com/block52/poker-vm/telegram-chat/internal/models"
	"github.com/block52/poker-vm/telegram-chat/internal/storage"
	"github.com/block52/poker-vm/telegram-chat/internal/telegram"
	"github.com/block52/poker-vm/telegram-chat/internal/websocket"
	"github.com/gin-gonic/gin"
	ws "github.com/gorilla/websocket"
)

// Handler holds dependencies for HTTP handlers
type Handler struct {
	config          *config.Config
	hub             *websocket.Hub
	storage         *storage.MessageStorage
	telegramClient  *telegram.Client
	upgrader        ws.Upgrader
	authenticatedUsers map[int64]models.TelegramAuthUser
	authMu          sync.RWMutex
}

// NewHandler creates a new handler with dependencies
func NewHandler(cfg *config.Config, hub *websocket.Hub, store *storage.MessageStorage) *Handler {
	var tgClient *telegram.Client
	if cfg.TelegramBotToken != "" {
		tgClient = telegram.NewClient(cfg.TelegramBotToken)
	}

	return &Handler{
		config:          cfg,
		hub:             hub,
		storage:         store,
		telegramClient:  tgClient,
		authenticatedUsers: make(map[int64]models.TelegramAuthUser),
		upgrader: ws.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				origin := r.Header.Get("Origin")
				for _, allowed := range cfg.AllowedOrigins {
					if origin == allowed {
						return true
					}
				}
				// Allow connections with no origin (e.g., from curl or server-to-server)
				return origin == ""
			},
		},
	}
}

// HealthCheck handles health check requests
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":     "ok",
		"clients":    h.hub.ClientCount(),
		"messages":   h.storage.Count(),
		"hasBot":     h.telegramClient != nil,
	})
}

// TelegramWebhook handles incoming Telegram updates
func (h *Handler) TelegramWebhook(c *gin.Context) {
	// Validate secret token
	secretToken := c.GetHeader("X-Telegram-Bot-Api-Secret-Token")
	if h.config.TelegramSecretToken != "" && secretToken != h.config.TelegramSecretToken {
		log.Printf("Invalid secret token received")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid secret token"})
		return
	}

	var update models.TelegramUpdate
	if err := c.ShouldBindJSON(&update); err != nil {
		log.Printf("Failed to parse Telegram update: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid update format"})
		return
	}

	// Process the update
	var tgMessage *models.TelegramMessage

	// Handle different update types
	if update.Message != nil {
		tgMessage = update.Message
	} else if update.ChannelPost != nil {
		tgMessage = update.ChannelPost
	} else if update.EditedMessage != nil {
		// Could handle edited messages differently
		tgMessage = update.EditedMessage
	}

	if tgMessage != nil {
		// Convert to our message format
		chatMsg := telegram.ConvertTelegramMessage(tgMessage, h.config.TelegramBotToken)

		// Store the message
		h.storage.Add(chatMsg)

		// Broadcast to all connected clients
		h.hub.BroadcastMessage(chatMsg)

		log.Printf("Processed message from %s: %s", chatMsg.Sender.FirstName, chatMsg.Text)
	}

	// Always return OK to Telegram
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// WebSocketHandler handles WebSocket connections
func (h *Handler) WebSocketHandler(c *gin.Context) {
	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}

	// Create and register client
	clientID := c.Query("clientId")
	if clientID == "" {
		clientID = c.ClientIP()
	}

	client := websocket.NewClient(h.hub, conn, clientID)
	client.Register()

	// Send connection confirmation
	client.SendMessage(models.WebSocketMessage{
		Type:    models.WSTypeConnected,
		Payload: gin.H{"clientId": clientID},
	})

	// Send message history
	history := h.storage.GetAll()
	client.SendMessage(models.WebSocketMessage{
		Type:    models.WSTypeChatHistory,
		Payload: history,
	})

	// Start read/write pumps
	go client.WritePump()
	client.ReadPump()
}

// GetHistory returns chat message history
func (h *Handler) GetHistory(c *gin.Context) {
	messages := h.storage.GetAll()
	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"count":    len(messages),
	})
}

// SetupWebhook configures the Telegram webhook
func (h *Handler) SetupWebhook(c *gin.Context) {
	if h.telegramClient == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Telegram bot not configured"})
		return
	}

	webhookURL := h.config.TelegramWebhookURL
	if webhookURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "TELEGRAM_WEBHOOK_URL not configured"})
		return
	}

	err := h.telegramClient.SetWebhook(webhookURL, h.config.TelegramSecretToken)
	if err != nil {
		log.Printf("Failed to set webhook: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     "webhook configured",
		"webhookUrl": webhookURL,
	})
}

// GetWebhookInfo returns current webhook configuration
func (h *Handler) GetWebhookInfo(c *gin.Context) {
	if h.telegramClient == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Telegram bot not configured"})
		return
	}

	info, err := h.telegramClient.GetWebhookInfo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, info)
}

// GetBotInfo returns information about the bot
func (h *Handler) GetBotInfo(c *gin.Context) {
	if h.telegramClient == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Telegram bot not configured"})
		return
	}

	info, err := h.telegramClient.GetMe()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, info)
}

// VerifyTelegramAuth verifies Telegram Login Widget authentication
func (h *Handler) VerifyTelegramAuth(c *gin.Context) {
	if h.telegramClient == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Telegram bot not configured"})
		return
	}

	var authData models.TelegramAuthData
	if err := c.ShouldBindJSON(&authData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid auth data"})
		return
	}

	// Verify the authentication (allow auth data up to 1 day old)
	if err := telegram.VerifyTelegramAuth(authData, h.telegramClient.GetToken(), 24*time.Hour); err != nil {
		log.Printf("Auth verification failed: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Store authenticated user
	user := models.TelegramAuthUser{
		ID:        authData.ID,
		FirstName: authData.FirstName,
		LastName:  authData.LastName,
		Username:  authData.Username,
		PhotoURL:  authData.PhotoURL,
	}

	h.authMu.Lock()
	h.authenticatedUsers[authData.ID] = user
	h.authMu.Unlock()

	log.Printf("User authenticated: %s (ID: %d)", authData.FirstName, authData.ID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    user,
	})
}

// SendChatMessage sends a message to the Telegram channel/group
func (h *Handler) SendChatMessage(c *gin.Context) {
	if h.telegramClient == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Telegram bot not configured"})
		return
	}

	var req models.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	// Verify user is authenticated
	h.authMu.RLock()
	user, authenticated := h.authenticatedUsers[req.UserID]
	h.authMu.RUnlock()

	if !authenticated {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	// Get the chat ID from config
	chatID, err := strconv.ParseInt(h.config.TelegramChatID, 10, 64)
	if err != nil {
		log.Printf("Invalid chat ID: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid chat configuration"})
		return
	}

	// Build the display name
	displayName := user.FirstName
	if user.Username != "" {
		displayName = "@" + user.Username
	}

	// Send message to Telegram
	result, err := h.telegramClient.SendMessageAsUser(chatID, req.Text, displayName)
	if err != nil {
		log.Printf("Failed to send message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send message"})
		return
	}

	// Extract message ID from result
	var messageID int
	if resultData, ok := result["result"].(map[string]interface{}); ok {
		if msgID, ok := resultData["message_id"].(float64); ok {
			messageID = int(msgID)
		}
	}

	log.Printf("Message sent by %s: %s", displayName, req.Text)

	c.JSON(http.StatusOK, models.SendMessageResponse{
		Success:   true,
		MessageID: messageID,
	})
}

// GetBotName returns just the bot username for the login widget
func (h *Handler) GetBotName(c *gin.Context) {
	if h.telegramClient == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Telegram bot not configured"})
		return
	}

	info, err := h.telegramClient.GetMe()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Extract username from result
	var botUsername string
	if result, ok := info["result"].(map[string]interface{}); ok {
		if username, ok := result["username"].(string); ok {
			botUsername = username
		}
	}

	if botUsername == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not get bot username"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"botUsername": botUsername,
	})
}

// CheckAuth checks if a user is authenticated
func (h *Handler) CheckAuth(c *gin.Context) {
	userIDStr := c.Query("userId")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId required"})
		return
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid userId"})
		return
	}

	h.authMu.RLock()
	user, authenticated := h.authenticatedUsers[userID]
	h.authMu.RUnlock()

	if !authenticated {
		c.JSON(http.StatusOK, gin.H{"authenticated": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"authenticated": true,
		"user":          user,
	})
}

// Logout removes user from authenticated users
func (h *Handler) Logout(c *gin.Context) {
	userIDStr := c.Query("userId")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId required"})
		return
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid userId"})
		return
	}

	h.authMu.Lock()
	delete(h.authenticatedUsers, userID)
	h.authMu.Unlock()

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// GetChatConfig returns configuration needed by the frontend
func (h *Handler) GetChatConfig(c *gin.Context) {
	var botUsername string

	if h.telegramClient != nil {
		info, err := h.telegramClient.GetMe()
		if err == nil {
			if result, ok := info["result"].(map[string]interface{}); ok {
				if username, ok := result["username"].(string); ok {
					botUsername = username
				}
			}
		}
	}

	// Get channel URL from env or construct it
	channelURL := h.config.TelegramChannelURL
	if channelURL == "" && h.config.TelegramChatID != "" {
		// Try to construct from chat ID (works for public channels)
		channelURL = fmt.Sprintf("https://t.me/c/%s", h.config.TelegramChatID)
	}

	c.JSON(http.StatusOK, gin.H{
		"botUsername": botUsername,
		"channelUrl":  channelURL,
		"hasBot":      h.telegramClient != nil,
	})
}
