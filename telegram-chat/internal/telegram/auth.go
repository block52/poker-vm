package telegram

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/block52/poker-vm/telegram-chat/internal/models"
)

// VerifyTelegramAuth verifies the authentication data from Telegram Login Widget
func VerifyTelegramAuth(data models.TelegramAuthData, botToken string, maxAge time.Duration) error {
	// Check if auth_date is not too old
	authTime := time.Unix(data.AuthDate, 0)
	if time.Since(authTime) > maxAge {
		return fmt.Errorf("authentication data is too old")
	}

	// Build the data-check-string
	checkString := buildCheckString(data)

	// Create secret key: SHA256(bot_token)
	secretKey := sha256.Sum256([]byte(botToken))

	// Compute HMAC-SHA256
	h := hmac.New(sha256.New, secretKey[:])
	h.Write([]byte(checkString))
	computedHash := hex.EncodeToString(h.Sum(nil))

	// Compare hashes
	if computedHash != data.Hash {
		return fmt.Errorf("invalid authentication hash")
	}

	return nil
}

// buildCheckString creates the data-check-string for verification
func buildCheckString(data models.TelegramAuthData) string {
	var parts []string

	// Add all non-empty fields except hash
	parts = append(parts, fmt.Sprintf("auth_date=%d", data.AuthDate))
	parts = append(parts, fmt.Sprintf("first_name=%s", data.FirstName))
	parts = append(parts, fmt.Sprintf("id=%d", data.ID))

	if data.LastName != "" {
		parts = append(parts, fmt.Sprintf("last_name=%s", data.LastName))
	}
	if data.PhotoURL != "" {
		parts = append(parts, fmt.Sprintf("photo_url=%s", data.PhotoURL))
	}
	if data.Username != "" {
		parts = append(parts, fmt.Sprintf("username=%s", data.Username))
	}

	// Sort alphabetically
	sort.Strings(parts)

	// Join with newline
	return strings.Join(parts, "\n")
}

// ParseAuthDataFromQuery parses authentication data from URL query string
func ParseAuthDataFromQuery(query map[string]string) (models.TelegramAuthData, error) {
	var data models.TelegramAuthData

	// Parse ID
	if idStr, ok := query["id"]; ok {
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			return data, fmt.Errorf("invalid id: %w", err)
		}
		data.ID = id
	} else {
		return data, fmt.Errorf("missing id field")
	}

	// Parse auth_date
	if authDateStr, ok := query["auth_date"]; ok {
		authDate, err := strconv.ParseInt(authDateStr, 10, 64)
		if err != nil {
			return data, fmt.Errorf("invalid auth_date: %w", err)
		}
		data.AuthDate = authDate
	} else {
		return data, fmt.Errorf("missing auth_date field")
	}

	// Required string field
	if firstName, ok := query["first_name"]; ok {
		data.FirstName = firstName
	} else {
		return data, fmt.Errorf("missing first_name field")
	}

	// Hash is required
	if hash, ok := query["hash"]; ok {
		data.Hash = hash
	} else {
		return data, fmt.Errorf("missing hash field")
	}

	// Optional fields
	data.LastName = query["last_name"]
	data.Username = query["username"]
	data.PhotoURL = query["photo_url"]

	return data, nil
}
