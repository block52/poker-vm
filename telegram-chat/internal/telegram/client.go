package telegram

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const telegramAPIBase = "https://api.telegram.org/bot"

// Client handles communication with the Telegram Bot API
type Client struct {
	token      string
	httpClient *http.Client
}

// NewClient creates a new Telegram API client
func NewClient(token string) *Client {
	return &Client{
		token:      token,
		httpClient: &http.Client{},
	}
}

// SetWebhook sets the webhook URL for receiving updates
func (c *Client) SetWebhook(url, secretToken string) error {
	payload := map[string]interface{}{
		"url":          url,
		"secret_token": secretToken,
	}

	_, err := c.makeRequest("setWebhook", payload)
	return err
}

// DeleteWebhook removes the webhook
func (c *Client) DeleteWebhook() error {
	_, err := c.makeRequest("deleteWebhook", nil)
	return err
}

// GetWebhookInfo returns current webhook status
func (c *Client) GetWebhookInfo() (map[string]interface{}, error) {
	return c.makeRequest("getWebhookInfo", nil)
}

// GetMe returns basic information about the bot
func (c *Client) GetMe() (map[string]interface{}, error) {
	return c.makeRequest("getMe", nil)
}

// GetFile retrieves file info for downloading
func (c *Client) GetFile(fileID string) (map[string]interface{}, error) {
	payload := map[string]interface{}{
		"file_id": fileID,
	}
	return c.makeRequest("getFile", payload)
}

// GetFileDownloadURL returns the direct download URL for a file
func (c *Client) GetFileDownloadURL(filePath string) string {
	return fmt.Sprintf("https://api.telegram.org/file/bot%s/%s", c.token, filePath)
}

// SendMessage sends a message to a chat
func (c *Client) SendMessage(chatID int64, text string, replyToMessageID *int64) (map[string]interface{}, error) {
	payload := map[string]interface{}{
		"chat_id":    chatID,
		"text":       text,
		"parse_mode": "HTML",
	}

	if replyToMessageID != nil {
		payload["reply_to_message_id"] = *replyToMessageID
	}

	return c.makeRequest("sendMessage", payload)
}

// SendMessageAsUser sends a message to the channel/group on behalf of a user
// Note: The bot sends the message but includes the user's name
func (c *Client) SendMessageAsUser(chatID int64, text string, userName string) (map[string]interface{}, error) {
	// Format the message to show who sent it
	formattedText := fmt.Sprintf("<b>%s:</b> %s", userName, text)
	return c.SendMessage(chatID, formattedText, nil)
}

// GetToken returns the bot token (needed for auth verification)
func (c *Client) GetToken() string {
	return c.token
}

// makeRequest makes an API request to Telegram
func (c *Client) makeRequest(method string, payload interface{}) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s%s/%s", telegramAPIBase, c.token, method)

	var body io.Reader
	if payload != nil {
		jsonData, err := json.Marshal(payload)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal payload: %w", err)
		}
		body = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if ok, exists := result["ok"].(bool); !exists || !ok {
		desc, _ := result["description"].(string)
		return nil, fmt.Errorf("telegram API error: %s", desc)
	}

	return result, nil
}
