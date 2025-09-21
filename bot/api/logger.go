package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/go-redis/redis/v8"
	"golang.org/x/net/context"
)

type LogLevel string

const (
	DEBUG LogLevel = "debug"
	INFO  LogLevel = "info"
	WARN  LogLevel = "warn"
	ERROR LogLevel = "error"
)

type LogEntry struct {
	Timestamp string      `json:"timestamp"`
	Level     LogLevel    `json:"level"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	Component string      `json:"component,omitempty"`
	UserID    string      `json:"userId,omitempty"`
	GameID    string      `json:"gameId,omitempty"`
}

type Logger struct {
	redis        *redis.Client
	component    string
	redisEnabled bool
}

func NewLogger(component string) *Logger {
	redisHost := os.Getenv("REDIS_HOST")
	if redisHost == "" {
		redisHost = "localhost"
	}

	redisPort := os.Getenv("REDIS_PORT")
	if redisPort == "" {
		redisPort = "6379"
	}

	rdb := redis.NewClient(&redis.Options{
		Addr: redisHost + ":" + redisPort,
		DB:   0,
	})

	// Test connection
	ctx := context.Background()
	_, err := rdb.Ping(ctx).Result()
	redisEnabled := err == nil
	if !redisEnabled {
		log.Printf("Redis connection failed, continuing without Redis logging: %v", err)
	}

	return &Logger{
		redis:        rdb,
		component:    component,
		redisEnabled: redisEnabled,
	}
}

func (l *Logger) writeLog(level LogLevel, message string, data interface{}, gameID, userID string) {
	logEntry := LogEntry{
		Timestamp: time.Now().Format(time.RFC3339),
		Level:     level,
		Message:   message,
		Data:      data,
		Component: l.component,
		UserID:    userID,
		GameID:    gameID,
	}

	// Always console log first
	fmt.Printf("[%s] %s: %s\n", string(level), l.component, message)

	// Try Redis logging if enabled
	if l.redisEnabled {
		jsonData, err := json.Marshal(logEntry)
		if err != nil {
			log.Printf("Failed to marshal log entry: %v", err)
			return
		}

		ctx := context.Background()
		key := fmt.Sprintf("logs:%s:%d", l.component, time.Now().UnixNano())

		// Store in Redis with TTL of 7 days
		err = l.redis.SetEX(ctx, key, string(jsonData), 7*24*time.Hour).Err()
		if err != nil {
			log.Printf("Redis logging disabled due to error: %v", err)
			l.redisEnabled = false
			return
		}

		// Add to sorted set for easy querying
		err = l.redis.ZAdd(ctx, fmt.Sprintf("logs:%s:index", l.component), &redis.Z{
			Score:  float64(time.Now().UnixNano()),
			Member: key,
		}).Err()
		if err != nil {
			log.Printf("Failed to add log to index: %v", err)
		}
	}
}

func (l *Logger) Debug(message string, data interface{}, gameID, userID string) {
	l.writeLog(DEBUG, message, data, gameID, userID)
}

func (l *Logger) Info(message string, data interface{}, gameID, userID string) {
	l.writeLog(INFO, message, data, gameID, userID)
}

func (l *Logger) Warn(message string, data interface{}, gameID, userID string) {
	l.writeLog(WARN, message, data, gameID, userID)
}

func (l *Logger) Error(message string, data interface{}, gameID, userID string) {
	l.writeLog(ERROR, message, data, gameID, userID)
}

func (l *Logger) GetLogs(limit int) ([]LogEntry, error) {
	if !l.redisEnabled {
		return []LogEntry{}, nil
	}

	ctx := context.Background()
	indexKey := fmt.Sprintf("logs:%s:index", l.component)

	// Get keys in reverse order (newest first)
	keys, err := l.redis.ZRevRange(ctx, indexKey, 0, int64(limit-1)).Result()
	if err != nil {
		return nil, err
	}

	var logs []LogEntry
	for _, key := range keys {
		logData, err := l.redis.Get(ctx, key).Result()
		if err != nil {
			continue // Skip failed retrievals
		}

		var logEntry LogEntry
		if err := json.Unmarshal([]byte(logData), &logEntry); err != nil {
			continue // Skip malformed entries
		}

		logs = append(logs, logEntry)
	}

	return logs, nil
}

func (l *Logger) Close() error {
	return l.redis.Close()
}
