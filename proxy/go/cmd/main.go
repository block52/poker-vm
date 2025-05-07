// Initialize project
// Run: go mod init hello-api
// Then: go get -u github.com/gin-gonic/gin

// main.go
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/block52/proxy/internal/cache"
	"github.com/block52/proxy/internal/rpc"
	"github.com/gin-gonic/gin"
)

var (
	// CLI flags
	rpcEndpoint = flag.String("rpc", "http://localhost:8545", "RPC endpoint URL")
	dataDir     = flag.String("data", "./data", "Data directory for block storage")
	listenAddr  = flag.String("listen", ":8080", "HTTP server listen address")
	startBlock  = flag.Int("start", 0, "Starting block height for sync")
	batchSize   = flag.Int("batch", 10, "Number of blocks to sync in parallel")
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
	// Parse command-line flags
	flag.Parse()

	// Create data directory if it doesn't exist
	if err := os.MkdirAll(*dataDir, 0755); err != nil {
		log.Fatalf("Failed to create data directory: %v", err)
	}

	// Initialize RPC client
	rpcClient := rpc.NewRPCClient(*rpcEndpoint)
	log.Printf("RPC client initialized, connecting to %s", *rpcEndpoint)

	// Initialize block store
	blockStore, err := cache.NewBlockStore(*dataDir)
	if err != nil {
		log.Fatalf("Failed to initialize block store: %v", err)
	}
	defer blockStore.Close()
	log.Printf("Block store initialized at %s", *dataDir)

	// Create context that can be canceled
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start block sync in background
	var wg sync.WaitGroup
	wg.Add(1)
	go syncBlocks(ctx, &wg, rpcClient, blockStore, *startBlock, *batchSize)

	// Create a new Gin router with default middleware
	// (logger and recovery middleware)
	router := gin.Default()

	router.GET("/", helloHandler)
	router.GET("/account/:accountId", accountHandler)
	router.GET("/balance/:accountId", balanceHandler)

	// // Group API routes
	// api := router.Group("/api")
	// {
	// 	api.GET("/", helloHandler)
	// 	api.GET("/balance/:accountId", balanceHandler)
	// }

	// Start server on port 8080
	log.Println("Server starting on port 8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}

// syncBlocks continuously syncs blocks from the node
func syncBlocks(ctx context.Context, wg *sync.WaitGroup, rpcClient *rpc.RPCClient, blockStore *cache.BlockStore, startBlock, batchSize int) {
	defer wg.Done()
	
	// Start from provided height or from the latest local block + 1
	currentHeight := startBlock
	
	// If we're not starting from 0, try to get the latest stored block
	if startBlock == 0 {
		latestHeight, err := blockStore.GetLatestBlockHeight()
		if err == nil && latestHeight > 0 {
			currentHeight = latestHeight + 1
			log.Printf("Resuming sync from block %d", currentHeight)
		} else {
			log.Printf("Starting fresh sync from block %d", currentHeight)
		}
	}
	
	log.Printf("Block sync started from height %d", currentHeight)
	
	// Sync loop
	for {
		select {
		case <-ctx.Done():
			log.Println("Block sync stopped due to context cancellation")
			return
		default:
			// Continue syncing
		}
		
		// Process a batch of blocks in parallel
		var batchWg sync.WaitGroup
		errors := make(chan error, batchSize)
		
		for i := 0; i < batchSize; i++ {
			height := currentHeight + i
			
			// Check if we already have this block
			hasBlock, err := blockStore.HasBlock(height)
			if err != nil {
				log.Printf("Error checking if block %d exists: %v", height, err)
				continue
			}
			
			if hasBlock {
				log.Printf("Block %d already exists, skipping", height)
				continue
			}
			
			// Fetch and store block in parallel
			batchWg.Add(1)
			go func(blockHeight int) {
				defer batchWg.Done()
				
				// Fetch block from RPC
				block, err := rpcClient.GetBlock(blockHeight)
				if err != nil {
					errors <- fmt.Errorf("failed to get block %d: %w", blockHeight, err)
					return
				}
				
				// Verify block height matches what we requested
				if block.Index != blockHeight {
					errors <- fmt.Errorf("block height mismatch: requested %d, got %d", blockHeight, block.Index)
					return
				}
				
				// Store block in database
				if err := blockStore.StoreBlock(block); err != nil {
					errors <- fmt.Errorf("failed to store block %d: %w", blockHeight, err)
					return
				}
				
				log.Printf("Successfully synced block %d (hash: %s)", blockHeight, block.Hash[:10]+"...")
			}(height)
		}
		
		// Wait for all block operations in this batch to complete
		batchWg.Wait()
		close(errors)
		
		// Process any errors
		errorCount := 0
		for err := range errors {
			errorCount++
			log.Printf("Sync error: %v", err)
		}
		
		// If we got no blocks, we might be at the chain tip - pause briefly
		if errorCount == batchSize {
			log.Printf("No new blocks found, waiting before retrying...")
			select {
			case <-ctx.Done():
				return
			case <-time.After(5 * time.Second):
				// Continue after delay
			}
		} else {
			// Move to next batch
			currentHeight += batchSize - errorCount
		}
	}
}

func helloHandler(c *gin.Context) {
	response := Response{
		Message: "Hello, World!",
	}
	c.JSON(http.StatusOK, response)
}

func accountHandler(c *gin.Context) {
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
