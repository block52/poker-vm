package models

// TelegramAuthData represents the data received from Telegram Login Widget
type TelegramAuthData struct {
	ID        int64  `json:"id" form:"id"`
	FirstName string `json:"first_name" form:"first_name"`
	LastName  string `json:"last_name,omitempty" form:"last_name"`
	Username  string `json:"username,omitempty" form:"username"`
	PhotoURL  string `json:"photo_url,omitempty" form:"photo_url"`
	AuthDate  int64  `json:"auth_date" form:"auth_date"`
	Hash      string `json:"hash" form:"hash"`
}

// TelegramUser represents an authenticated Telegram user
type TelegramAuthUser struct {
	ID        int64  `json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName,omitempty"`
	Username  string `json:"username,omitempty"`
	PhotoURL  string `json:"photoUrl,omitempty"`
}

// SendMessageRequest represents a request to send a message
type SendMessageRequest struct {
	Text   string `json:"text" binding:"required"`
	UserID int64  `json:"userId" binding:"required"`
}

// SendMessageResponse represents the response after sending a message
type SendMessageResponse struct {
	Success   bool   `json:"success"`
	MessageID int    `json:"messageId,omitempty"`
	Error     string `json:"error,omitempty"`
}
