package models

// Block represents the blockchain block structure
type Block struct {
	Index            int    `json:"index"`
	Hash             string `json:"hash"`
	PreviousHash     string `json:"previousHash"`
	MerkleRoot       string `json:"merkleRoot"`
	Signature        string `json:"signature"`
	Timestamp        int64  `json:"timestamp"`
	Validator        string `json:"validator"`
	Version          string `json:"version"`
	Transactions     []any  `json:"transactions"`
	TransactionCount int    `json:"transactionCount"`
}

// BlockResponse represents the complete response structure for a block request
type BlockResponse struct {
	ID     int    `json:"id"`
	Result Result `json:"result"`
}

// Result contains the block data and its signature
type Result struct {
	Data      Block  `json:"data"`
	Signature string `json:"signature"`
}
