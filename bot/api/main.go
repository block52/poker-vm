package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Bot struct {
	Address      string `json:"address" bson:"address"`
	PrivateKey   string `json:"privateKey" bson:"privateKey"`
	Enabled      bool   `json:"enabled" bson:"enabled"`
	TableAddress string `json:"tableAddress" bson:"tableAddress"`
	Type         string `json:"type" bson:"type"`
}

var (
	// mongoClient   *mongo.Client
	botCollection *mongo.Collection
)

func getBots(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := botCollection.Find(ctx, bson.M{})
	if err != nil {
		log.Printf("Error fetching bots: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bots"})
		return
	}
	defer cursor.Close(ctx)

	var bots []Bot
	if err := cursor.All(ctx, &bots); err != nil {
		log.Printf("Error decoding bots: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode bots"})
		return
	}
	c.JSON(http.StatusOK, bots)
}

// PATCH /bots/:address - update enabled and/or tableAddress

var apiKeyEnv string

func requireAPIKey(c *gin.Context) bool {
	apiKey := c.GetHeader("x-api-key")
	if apiKey == "" || apiKeyEnv == "" || apiKey != apiKeyEnv {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing or invalid API key"})
		return false
	}
	return true
}

// PATCH /bots/:address - update enabled and/or tableAddress
func patchBot(c *gin.Context) {
	if !requireAPIKey(c) {
		return
	}
	address := c.Param("address")
	var req struct {
		Enabled      *bool   `json:"enabled"`
		TableAddress *string `json:"tableAddress"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	update := bson.M{}
	if req.Enabled != nil {
		update["enabled"] = *req.Enabled
	}
	if req.TableAddress != nil {
		update["tableAddress"] = *req.TableAddress
	}
	if len(update) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	res, err := botCollection.UpdateOne(ctx, bson.M{"address": address}, bson.M{"$set": update})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update bot"})
		return
	}
	if res.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bot not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"updated": true})
}

// POST /bots - add a new bot
func postBot(c *gin.Context) {
	if !requireAPIKey(c) {
		return
	}
	var bot Bot
	if err := c.ShouldBindJSON(&bot); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := botCollection.InsertOne(ctx, bot)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add bot"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"created": true})
}

var logger *Logger

func main() {
	apiKeyEnv = os.Getenv("API_KEY")
	// Load .env if present

	_ = godotenv.Load()

	// Gather .env configs to log (obfuscated)
	envVars := []string{
		"MONGODB_URI", "MONGODB_DB", "REDIS_HOST", "REDIS_PORT", "REDIS_PASSWORD", "PORT", "GIN_MODE",
	}
	obfuscated := make(map[string]string)
	for _, k := range envVars {
		v := os.Getenv(k)
		if v == "" {
			obfuscated[k] = "<empty>"
			continue
		}
		// Obfuscate sensitive values
		if k == "MONGODB_URI" || k == "REDIS_PASSWORD" {
			if len(v) > 6 {
				obfuscated[k] = v[:2] + "***" + v[len(v)-2:]
			} else if len(v) > 2 {
				obfuscated[k] = v[:1] + "***" + v[len(v)-1:]
			} else {
				obfuscated[k] = "***"
			}
		} else {
			obfuscated[k] = v
		}
	}
	logger = NewLogger("bot-api")
	logger.Info("Loaded .env config", obfuscated, "", "")

	mongoURI := os.Getenv("MONGODB_URI")
	dbName := os.Getenv("MONGODB_DB")
	if mongoURI == "" {
		log.Print("MONGODB_URI not set, using default")
		logger.Info("MONGODB_URI not set, using default", nil, "", "")
		mongoURI = "mongodb://localhost:27017"
	}
	if dbName == "" {
		log.Print("MONGODB_DB not set, using default")
		logger.Info("MONGODB_DB not set, using default", nil, "", "")
		dbName = "pvm"
	}

	log.Println("Using ", mongoURI, " for MongoDB")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	// mongoClient = client
	botCollection = client.Database(dbName).Collection("bots")

	r := gin.Default()

	// Enable CORS for local testing
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173",
			"http://localhost:3000",
			"https://bots.block52.xyz",
			"https://botapi.block52.xyz",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "x-api-key"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/bots", getBots)
	r.POST("/bots", postBot)
	r.PATCH("/bots/:address", patchBot)

	// Add logs route
	r.GET("/logs", getLogsHandler)

	logger.Info("Server starting on port 8080", nil, "", "")
	r.Run(":8080")
}

func getLogsHandler(c *gin.Context) {
	// Get limit from query parameter, default to 50
	limitStr := c.DefaultQuery("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 1000 {
		limit = 50
	}

	logs, err := logger.GetLogs(limit)
	if err != nil {
		logger.Error("Failed to retrieve logs", map[string]interface{}{"error": err.Error()}, "", "")
		c.JSON(500, gin.H{"error": "Failed to retrieve logs"})
		return
	}

	logger.Debug("Retrieved logs", map[string]interface{}{"count": len(logs)}, "", "")
	c.JSON(200, gin.H{
		"logs":  logs,
		"count": len(logs),
		"limit": limit,
	})
}
