// // pkg/blocks/service.go
// package blocks

// import (
//     "bytes"
//     "encoding/json"
//     "fmt"
//     "net/http"
//     "time"
    
//     "github.com/bitcoinbrisbane/poker-vm/pkg/node"
// )

// // GetBlocksFromNode fetches blocks from a single node
// func GetBlocksFromNode(node *node.Node) (*NodeBlocks, error) {
//     // Block fetching logic...
// }

// // GetBlocksFromHighestNode fetches blocks from the highest node
// func GetBlocksFromHighestNode(nodes []*node.Node) (*NodeBlocks, error) {
//     highestNode := node.GetHighestIndexBootNode()
//     if highestNode == nil {
//         return nil, fmt.Errorf("no nodes available")
//     }
    
//     return GetBlocksFromNode(highestNode)
// }

// // GetAndStoreBlocks fetches and stores blocks from the highest node
// func GetAndStoreBlocks(store *BlockStore) error {
//     blocks, err := GetBlocksFromHighestNode()
//     if err != nil {
//         return fmt.Errorf("failed to get blocks: %v", err)
//     }

//     return store.SaveBlocks(blocks)
// }