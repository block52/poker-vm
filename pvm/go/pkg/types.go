package node

import "encoding/json"

// Node represents a poker virtual machine node in the network
type Node struct {
	Client      string `json:"client"`
	PublicKey   string `json:"publicKey"`
	URL         string `json:"url"`
	Version     string `json:"version"`
	IsValidator bool   `json:"isValidator"`
	Name        string `json:"name"`
	Height      int64  `json:"height"`
}

// Block represents a single block in the blockchain
type Block struct {
	Index        int64  `json:"index"`
	Hash         string `json:"hash"`
	PreviousHash string `json:"previousHash"`
	MerkleRoot   string `json:"merkleRoot"`
	Signature    string `json:"signature"`
	Timestamp    int64  `json:"timestamp"`
	Validator    string `json:"validator"`
	Version      string `json:"version"`
	Transactions []any  `json:"transactions"`
}

// RPCRequest represents a JSON-RPC 2.0 request
type RPCRequest struct {
	Method  string        `json:"method"`
	Params  []interface{} `json:"params"`
	ID      int           `json:"id"`
	JSONRPC string        `json:"jsonrpc"`
}

// RPCResponse represents a JSON-RPC 2.0 response
type RPCResponse struct {
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *RPCError       `json:"error,omitempty"`
	ID      int             `json:"id"`
	JSONRPC string          `json:"jsonrpc"`
}

// RPCError represents a JSON-RPC 2.0 error
type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// BlocksResponse represents the structure of the get_blocks RPC response
type BlocksResponse struct {
	ID      string     `json:"id"`
	Result  BlocksData `json:"result"`
	JSONRPC string     `json:"jsonrpc"`
}

// BlocksData represents the data field in the blocks response
type BlocksData struct {
	Data []Block `json:"data"`
}

// NodeBlocks represents the blocks data returned from a node
type NodeBlocks struct {
	Node   *Node   `json:"node"`
	Blocks []Block `json:"blocks"`
	Error  error   `json:"error,omitempty"`
}
