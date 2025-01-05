package main

import (
    "fmt"
    "log"
    "github.com/bitcoinbrisbane/poker-vm/pkg/node"
)

func main() {
    // Example URL - replace with your actual URL
    // const bootnodesURL = "https://raw.githubusercontent.com/block52/poker-vm/refs/heads/main/bootnodes.json"
    
    // nodes, err := node.FetchBootnodes(bootnodesURL)
    // if err != nil {
    //     log.Fatal(err)
    // }

    // results := node.GetBlocks(nodes)
    // for _, result := range results {
    //     if result.Error != nil {
    //         fmt.Printf("Error from node %s: %v\n", result.Node.Name, result.Error)
    //         continue
    //     }

    //     fmt.Printf("Node %s returned %d blocks\n", result.Node.Name, len(result.Blocks))
    //     for _, block := range result.Blocks {
    //         fmt.Printf("Block #%d: %s\n", block.Index, block.Hash)
    //     }
    // }

    highestNode := node.GetHighestIndexBootNode()
    if highestNode == nil {
        log.Fatal("no nodes available")
    }

    fmt.Printf("Highest node: %s\n", highestNode.URL)

    blocks, err := node.GetBlocksFromNode(highestNode)
    if err != nil {
        log.Fatalf("failed to get blocks: %v", err)
    }

    fmt.Printf("Node %s returned %d blocks\n", blocks.Node.Name, len(blocks.Blocks))
}
