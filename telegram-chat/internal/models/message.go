package models

import "time"

// ChatMessage represents a message in the chat system
type ChatMessage struct {
	ID        string    `json:"id"`
	Text      string    `json:"text"`
	Sender    Sender    `json:"sender"`
	Timestamp int64     `json:"timestamp"`
	ReplyToID *string   `json:"replyTo,omitempty"`
	MediaType *string   `json:"mediaType,omitempty"`
	MediaURL  *string   `json:"mediaUrl,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

// Sender represents the message sender
type Sender struct {
	ID        int64   `json:"id"`
	Username  *string `json:"username,omitempty"`
	FirstName string  `json:"firstName"`
	LastName  *string `json:"lastName,omitempty"`
}

// TelegramUpdate represents an incoming update from Telegram
type TelegramUpdate struct {
	UpdateID      int64            `json:"update_id"`
	Message       *TelegramMessage `json:"message,omitempty"`
	ChannelPost   *TelegramMessage `json:"channel_post,omitempty"`
	EditedMessage *TelegramMessage `json:"edited_message,omitempty"`
}

// TelegramMessage represents a Telegram message
type TelegramMessage struct {
	MessageID      int64              `json:"message_id"`
	From           *TelegramUser      `json:"from,omitempty"`
	SenderChat     *TelegramChat      `json:"sender_chat,omitempty"`
	Chat           TelegramChat       `json:"chat"`
	Date           int64              `json:"date"`
	Text           string             `json:"text,omitempty"`
	ReplyToMessage *TelegramMessage   `json:"reply_to_message,omitempty"`
	Photo          []TelegramPhoto    `json:"photo,omitempty"`
	Video          *TelegramVideo     `json:"video,omitempty"`
	Document       *TelegramDocument  `json:"document,omitempty"`
	Sticker        *TelegramSticker   `json:"sticker,omitempty"`
	Caption        string             `json:"caption,omitempty"`
}

// TelegramUser represents a Telegram user
type TelegramUser struct {
	ID        int64  `json:"id"`
	IsBot     bool   `json:"is_bot"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name,omitempty"`
	Username  string `json:"username,omitempty"`
}

// TelegramChat represents a Telegram chat
type TelegramChat struct {
	ID       int64  `json:"id"`
	Type     string `json:"type"`
	Title    string `json:"title,omitempty"`
	Username string `json:"username,omitempty"`
}

// TelegramPhoto represents a photo in Telegram
type TelegramPhoto struct {
	FileID       string `json:"file_id"`
	FileUniqueID string `json:"file_unique_id"`
	Width        int    `json:"width"`
	Height       int    `json:"height"`
	FileSize     int    `json:"file_size,omitempty"`
}

// TelegramVideo represents a video in Telegram
type TelegramVideo struct {
	FileID       string `json:"file_id"`
	FileUniqueID string `json:"file_unique_id"`
	Width        int    `json:"width"`
	Height       int    `json:"height"`
	Duration     int    `json:"duration"`
	FileName     string `json:"file_name,omitempty"`
	MimeType     string `json:"mime_type,omitempty"`
	FileSize     int    `json:"file_size,omitempty"`
}

// TelegramDocument represents a document in Telegram
type TelegramDocument struct {
	FileID       string `json:"file_id"`
	FileUniqueID string `json:"file_unique_id"`
	FileName     string `json:"file_name,omitempty"`
	MimeType     string `json:"mime_type,omitempty"`
	FileSize     int    `json:"file_size,omitempty"`
}

// TelegramSticker represents a sticker in Telegram
type TelegramSticker struct {
	FileID       string `json:"file_id"`
	FileUniqueID string `json:"file_unique_id"`
	Type         string `json:"type"`
	Width        int    `json:"width"`
	Height       int    `json:"height"`
	IsAnimated   bool   `json:"is_animated"`
	IsVideo      bool   `json:"is_video"`
	Emoji        string `json:"emoji,omitempty"`
}

// WebSocketMessage represents a message sent over WebSocket
type WebSocketMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// WebSocket message types
const (
	WSTypeChatMessage = "chat:message"
	WSTypeChatHistory = "chat:history"
	WSTypeConnected   = "chat:connected"
	WSTypeError       = "chat:error"
)
