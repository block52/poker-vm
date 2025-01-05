// pkg/blocks/types.go
package blocks

import (
    "github.com/bitcoinbrisbane/poker-vm/pkg/node"
)

type Block struct {
    Height int64
    // other block fields
}

type NodeBlocks struct {
    Node   *node.Node
    Blocks []Block
    Error  error
}

type RPCRequest struct {
    Method  string        `json:"method"`
    Params  []interface{} `json:"params"`
    ID      int          `json:"id"`
    JSONRPC string       `json:"jsonrpc"`
}

type BlocksResponse struct {
    Result struct {
        Data []Block `json:"data"`
    } `json:"result"`
}