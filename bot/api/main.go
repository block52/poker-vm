package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

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
	mongoClient   *mongo.Client
	botCollection *mongo.Collection
)

func getBots(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := botCollection.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bots"})
		return
	}
	defer cursor.Close(ctx)

	var bots []Bot
	if err := cursor.All(ctx, &bots); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode bots"})
		return
	}
	c.JSON(http.StatusOK, bots)
}

func main() {
	// Load .env if present
	_ = godotenv.Load()

	mongoURI := os.Getenv("MONGODB_URI")
	dbName := os.Getenv("MONGODB_DB")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}
	if dbName == "" {
		dbName = "pvm"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	mongoClient = client
	botCollection = client.Database(dbName).Collection("bots")

	r := gin.Default()
	r.GET("/bots", getBots)
	r.Run(":8080")
}
