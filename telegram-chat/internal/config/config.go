package config

import (
	"os"
)

type Config struct {
	// Server settings
	Port string

	// Telegram settings
	TelegramBotToken    string
	TelegramChatID      string
	TelegramWebhookURL  string
	TelegramSecretToken string
	TelegramChannelURL  string

	// WebSocket settings
	AllowedOrigins []string

	// Storage settings
	MessageHistoryLimit int
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	allowedOrigins := []string{"http://localhost:5173", "http://localhost:3000"}
	if origins := os.Getenv("ALLOWED_ORIGINS"); origins != "" {
		// In production, parse comma-separated origins
		allowedOrigins = append(allowedOrigins, origins)
	}

	return &Config{
		Port:                port,
		TelegramBotToken:    os.Getenv("TELEGRAM_BOT_TOKEN"),
		TelegramChatID:      os.Getenv("TELEGRAM_CHAT_ID"),
		TelegramWebhookURL:  os.Getenv("TELEGRAM_WEBHOOK_URL"),
		TelegramSecretToken: os.Getenv("TELEGRAM_SECRET_TOKEN"),
		TelegramChannelURL:  os.Getenv("TELEGRAM_CHANNEL_URL"),
		AllowedOrigins:      allowedOrigins,
		MessageHistoryLimit: 100,
	}
}
