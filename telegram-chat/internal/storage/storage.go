package storage

import (
	"sync"

	"github.com/block52/poker-vm/telegram-chat/internal/models"
)

// MessageStorage provides thread-safe storage for chat messages
type MessageStorage struct {
	messages []models.ChatMessage
	mu       sync.RWMutex
	limit    int
}

// NewMessageStorage creates a new message storage with the given limit
func NewMessageStorage(limit int) *MessageStorage {
	return &MessageStorage{
		messages: make([]models.ChatMessage, 0, limit),
		limit:    limit,
	}
}

// Add adds a new message to storage
func (s *MessageStorage) Add(msg models.ChatMessage) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.messages = append(s.messages, msg)

	// Keep only the last 'limit' messages
	if len(s.messages) > s.limit {
		s.messages = s.messages[len(s.messages)-s.limit:]
	}
}

// GetAll returns all stored messages
func (s *MessageStorage) GetAll() []models.ChatMessage {
	s.mu.RLock()
	defer s.mu.RUnlock()

	// Return a copy to prevent concurrent access issues
	result := make([]models.ChatMessage, len(s.messages))
	copy(result, s.messages)
	return result
}

// GetLast returns the last n messages
func (s *MessageStorage) GetLast(n int) []models.ChatMessage {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if n > len(s.messages) {
		n = len(s.messages)
	}

	start := len(s.messages) - n
	result := make([]models.ChatMessage, n)
	copy(result, s.messages[start:])
	return result
}

// Count returns the number of stored messages
func (s *MessageStorage) Count() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.messages)
}

// Clear removes all stored messages
func (s *MessageStorage) Clear() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.messages = make([]models.ChatMessage, 0, s.limit)
}
