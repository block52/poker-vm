package rpc

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/block52/proxy/internal/models" // Update with your module path
)

// RPCClient represents a JSON-RPC client
type RPCClient struct {
	Endpoint   string
	HTTPClient *http.Client
}

// RPCRequest represents a JSON-RPC request
type RPCRequest struct {
	Method  string      `json:"method"`
	Params  interface{} `json:"params"`
	ID      int         `json:"id"`
	JSONRPC string      `json:"jsonrpc"`
	Data    string      `json:"data,omitempty"`
}

// NewRPCClient creates a new RPC client with the specified endpoint
func NewRPCClient(endpoint string) *RPCClient {
	return &RPCClient{
		Endpoint:   endpoint,
		HTTPClient: &http.Client{},
	}
}

// GetBlock fetches a block by its height
func (c *RPCClient) GetBlock(height int) (*models.Block, error) {
	// Create request
	req := RPCRequest{
		Method:  "get_block",
		Params:  []int{height},
		ID:      1,
		JSONRPC: "2.0",
		Data:    "",
	}

	// Marshal request to JSON
	reqBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("error marshaling request: %w", err)
	}

	// Create HTTP request
	httpReq, err := http.NewRequest("POST", c.Endpoint, bytes.NewReader(reqBody))
	if err != nil {
		return nil, fmt.Errorf("error creating HTTP request: %w", err)
	}

	// Set appropriate headers
	httpReq.Header.Set("Content-Type", "application/json")

	// Send the request
	httpResp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("error sending HTTP request: %w", err)
	}
	defer httpResp.Body.Close()

	// Read response body
	respBody, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response body: %w", err)
	}

	// Check HTTP status code
	if httpResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected HTTP status: %d, body: %s", httpResp.StatusCode, string(respBody))
	}

	// Parse response into our structured model
	var blockResp models.BlockResponse
	if err := json.Unmarshal(respBody, &blockResp); err != nil {
		return nil, fmt.Errorf("error unmarshaling response: %w, body: %s", err, string(respBody))
	}

	// Return just the block data
	return &blockResp.Result.Data, nil
}
