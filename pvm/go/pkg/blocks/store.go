// pkg/blocks/store.go
package blocks

import (
    "encoding/json"
    "fmt"
    "github.com/tecbot/gorocksdb"
)

type BlockStore struct {
    db *gorocksdb.DB
}

func NewBlockStore(path string) (*BlockStore, error) {
    opts := gorocksdb.NewDefaultOptions()
    opts.SetCreateIfMissing(true)
    db, err := gorocksdb.OpenDb(opts, path)
    if err != nil {
        return nil, fmt.Errorf("failed to open rocksdb: %v", err)
    }

    return &BlockStore{db: db}, nil
}

func (s *BlockStore) SaveBlocks(blocks *NodeBlocks) error {
    wo := gorocksdb.NewDefaultWriteOptions()
    defer wo.Destroy()

    // Begin batch write
    batch := gorocksdb.NewWriteBatch()
    defer batch.Destroy()

    for _, block := range blocks.Blocks {
        // Create a key based on block height or hash
        key := fmt.Sprintf("block:%d", block.Height) // or use block.Hash if available
        
        // Marshal block to JSON
        blockData, err := json.Marshal(block)
        if err != nil {
            return fmt.Errorf("failed to marshal block: %v", err)
        }

        // Add to batch
        batch.Put([]byte(key), blockData)
    }

    // Write batch to db
    err := s.db.Write(wo, batch)
    if err != nil {
        return fmt.Errorf("failed to write blocks to db: %v", err)
    }

    return nil
}

func (s *BlockStore) Close() {
    if s.db != nil {
        s.db.Close()
    }
}

// GetBlock retrieves a single block by height
func (s *BlockStore) GetBlock(height int64) (*Block, error) {
    ro := gorocksdb.NewDefaultReadOptions()
    defer ro.Destroy()

    key := fmt.Sprintf("block:%d", height)
    value, err := s.db.Get(ro, []byte(key))
    if err != nil {
        return nil, fmt.Errorf("failed to get block: %v", err)
    }
    defer value.Free()

    if !value.Exists() {
        return nil, fmt.Errorf("block not found")
    }

    var block Block
    if err := json.Unmarshal(value.Data(), &block); err != nil {
        return nil, fmt.Errorf("failed to unmarshal block: %v", err)
    }

    return &block, nil
}