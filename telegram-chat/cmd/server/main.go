package main

import (
	"log"
	"os"

	"github.com/block52/poker-vm/telegram-chat/internal/config"
	"github.com/block52/poker-vm/telegram-chat/internal/handlers"
	"github.com/block52/poker-vm/telegram-chat/internal/storage"
	"github.com/block52/poker-vm/telegram-chat/internal/websocket"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load configuration
	cfg := config.Load()

	// Validate required config
	if cfg.TelegramBotToken == "" {
		log.Println("WARNING: TELEGRAM_BOT_TOKEN not set - webhook will not work")
	}

	// Initialize components
	hub := websocket.NewHub()
	store := storage.NewMessageStorage(cfg.MessageHistoryLimit)
	handler := handlers.NewHandler(cfg, hub, store)

	// Start WebSocket hub
	go hub.Run()

	// Setup Gin router
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// CORS configuration
	corsConfig := cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "X-Telegram-Bot-Api-Secret-Token"},
		AllowCredentials: true,
	}
	router.Use(cors.New(corsConfig))

	// Health check
	router.GET("/health", handler.HealthCheck)

	// API routes
	api := router.Group("/api")
	{
		// Telegram webhook endpoint
		api.POST("/telegram/webhook", handler.TelegramWebhook)

		// Chat endpoints
		api.GET("/chat/history", handler.GetHistory)
		api.GET("/chat/config", handler.GetChatConfig)
		api.POST("/chat/send", handler.SendChatMessage)

		// Auth endpoints
		api.POST("/auth/telegram", handler.VerifyTelegramAuth)
		api.GET("/auth/check", handler.CheckAuth)
		api.POST("/auth/logout", handler.Logout)

		// Admin endpoints for webhook management
		admin := api.Group("/admin")
		{
			admin.POST("/webhook/setup", handler.SetupWebhook)
			admin.GET("/webhook/info", handler.GetWebhookInfo)
			admin.GET("/bot/info", handler.GetBotInfo)
			admin.GET("/bot/name", handler.GetBotName)
		}
	}

	// WebSocket endpoint
	router.GET("/ws", handler.WebSocketHandler)

	// Start server
	addr := ":" + cfg.Port
	log.Printf("Starting Telegram Chat server on %s", addr)
	log.Printf("WebSocket endpoint: ws://localhost%s/ws", addr)
	log.Printf("Telegram webhook: POST /api/telegram/webhook", )

	if err := router.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
