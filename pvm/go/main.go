package main

import (
    "fmt"
    "log"
    "github.com/bitcoinbrisbane/poker-vm/pkg/node"
    "github.com/bitcoinbrisbane/poker-vm/pkg/blocks"
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

    _blocks, err := node.GetBlocksFromNode(highestNode)
    if err != nil {
        log.Fatalf("failed to get blocks: %v", err)
    }

    fmt.Printf("Node returned %d blocks\n", len(_blocks.Blocks))

    // Save blocks to rocks
    store, err := blocks.NewBlockStore("/home/lucascullen/GitHub/block52/poker-vm/pvm/go/data")

    blocksPtrs := make([]*node.Block, len(_blocks.Blocks))
    for i := range _blocks.Blocks {
        blocksPtrs[i] = &_blocks.Blocks[i]
    }

    if err := store.SaveBlocks(blocksPtrs); err != nil {
        log.Fatalf("failed to save blocks: %v", err)
    }
}
