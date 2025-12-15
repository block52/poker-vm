package telegram

import (
	"fmt"
	"time"

	"github.com/block52/poker-vm/telegram-chat/internal/models"
)

// ConvertTelegramMessage converts a Telegram message to our internal ChatMessage format
func ConvertTelegramMessage(msg *models.TelegramMessage, botToken string) models.ChatMessage {
	chatMsg := models.ChatMessage{
		ID:        fmt.Sprintf("%d_%d", msg.Chat.ID, msg.MessageID),
		Text:      msg.Text,
		Timestamp: msg.Date,
		CreatedAt: time.Unix(msg.Date, 0),
	}

	// Handle caption for media messages
	if chatMsg.Text == "" && msg.Caption != "" {
		chatMsg.Text = msg.Caption
	}

	// Set sender info
	if msg.From != nil {
		chatMsg.Sender = models.Sender{
			ID:        msg.From.ID,
			FirstName: msg.From.FirstName,
		}
		if msg.From.Username != "" {
			chatMsg.Sender.Username = &msg.From.Username
		}
		if msg.From.LastName != "" {
			chatMsg.Sender.LastName = &msg.From.LastName
		}
	} else if msg.SenderChat != nil {
		// Channel posts may have sender_chat instead of from
		chatMsg.Sender = models.Sender{
			ID:        msg.SenderChat.ID,
			FirstName: msg.SenderChat.Title,
		}
		if msg.SenderChat.Username != "" {
			chatMsg.Sender.Username = &msg.SenderChat.Username
		}
	}

	// Handle reply
	if msg.ReplyToMessage != nil {
		replyID := fmt.Sprintf("%d_%d", msg.Chat.ID, msg.ReplyToMessage.MessageID)
		chatMsg.ReplyToID = &replyID
	}

	// Handle media types
	if len(msg.Photo) > 0 {
		mediaType := "photo"
		chatMsg.MediaType = &mediaType
		// Get the largest photo (last in array)
		largestPhoto := msg.Photo[len(msg.Photo)-1]
		mediaURL := getFileURL(botToken, largestPhoto.FileID)
		chatMsg.MediaURL = &mediaURL
	} else if msg.Video != nil {
		mediaType := "video"
		chatMsg.MediaType = &mediaType
		mediaURL := getFileURL(botToken, msg.Video.FileID)
		chatMsg.MediaURL = &mediaURL
	} else if msg.Document != nil {
		mediaType := "document"
		chatMsg.MediaType = &mediaType
		mediaURL := getFileURL(botToken, msg.Document.FileID)
		chatMsg.MediaURL = &mediaURL
	} else if msg.Sticker != nil {
		mediaType := "sticker"
		chatMsg.MediaType = &mediaType
		mediaURL := getFileURL(botToken, msg.Sticker.FileID)
		chatMsg.MediaURL = &mediaURL
		// Use emoji as text for stickers
		if msg.Sticker.Emoji != "" && chatMsg.Text == "" {
			chatMsg.Text = msg.Sticker.Emoji
		}
	}

	return chatMsg
}

// getFileURL returns a placeholder URL for file download
// In production, you'd call Telegram's getFile API to get the actual file path
func getFileURL(botToken, fileID string) string {
	// This returns a URL that the frontend can use to request the file
	// The actual file download would be handled by another endpoint
	return fmt.Sprintf("/api/telegram/file/%s", fileID)
}
