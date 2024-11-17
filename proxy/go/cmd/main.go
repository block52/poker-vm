// Initialize project
// Run: go mod init hello-api
// Then: go get -u github.com/gin-gonic/gin

// main.go
package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Message string `json:"message"`
}

type RPCRequest struct {
	Id     string `json:"id"`
	Method string `json:"method"`
}

type RPCResponse struct {
	Result string `json:"result"`
}

const node = "https://node1.block52.xyz"

func main() {
	// Create a new Gin router with default middleware
	// (logger and recovery middleware)
	router := gin.Default()

	// Group API routes
	api := router.Group("/api")
	{
		api.GET("/", helloHandler)
	}

	// Start server on port 8080
	log.Println("Server starting on port 8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}

func helloHandler(c *gin.Context) {
	response := Response{
		Message: "Hello, World!",
	}
	c.JSON(http.StatusOK, response)
}

func balanceHandler(c *gin.Context) {
	var request RPCRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response := RPCResponse{
		Result: "1000",
	}
	c.JSON(http.StatusOK, response)
}
