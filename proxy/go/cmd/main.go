// Initialize project
// Run: go mod init hello-api
// Then: go get -u github.com/gin-gonic/gin

// main.go
package main

import (
	"github.com/gin-gonic/gin"
	"log"
	"math/big"
	"net/http"
	"net/rpc"
)

type Response struct {
	Message string `json:"message"`
}

type RPCRequest struct {
	Id     string `json:"id"`
	Method string `json:"method"`
}

type RPCResponse struct {
	Id     string `json:"id"`
	Result string `json:"result"`
}

type AccountResponse struct {
	Balance string
	Exists  bool
}

type BalanceRequest struct {
	AccountID string
}

type BalanceResponse struct {
	Balance string
	Exists  bool
}

type APIBalanceResponse struct {
	AccountID string   `json:"accountId"`
	Balance   *big.Int `json:"balance"`
	Exists    bool     `json:"exists"`
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
		api.GET("/balance/:accountId", balanceHandler)
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
	// Connect to RPC server
	client, err := rpc.Dial("tcp", "rpc:1234")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to connect to RPC server: " + err.Error(),
		})
		return
	}
	defer client.Close()

	// Get account ID from path parameter
	accountID := c.Param("accountId")
	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Account ID is required",
		})
		return
	}

	// Prepare request and response objects
	req := &BalanceRequest{AccountID: accountID}
	var res BalanceResponse

	// Make RPC call
	err = client.Call("BalanceService.GetBalance", req, &res)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "RPC call failed: " + err.Error(),
		})
		return
	}

	// Convert string balance back to big.Int
	balance := new(big.Int)
	balance.SetString(res.Balance, 10)

	// Prepare API response
	apiResponse := APIBalanceResponse{
		AccountID: accountID,
		Balance:   balance,
		Exists:    res.Exists,
	}

	c.JSON(http.StatusOK, apiResponse)
}
