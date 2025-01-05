// pkg/blocks/store.go
package blocks

import (
    "encoding/json"
    "fmt"
    "github.com/syndtr/goleveldb/leveldb"
    "github.com/bitcoinbrisbane/poker-vm/pkg/node"
)

type BlockStore struct {
    db *leveldb.DB
}

func NewBlockStore(path string) (*BlockStore, error) {
    db, err := leveldb.OpenFile(path, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to open leveldb: %v", err)
    }

    return &BlockStore{db: db}, nil
}

func (s *BlockStore) SaveBlocks(blocks []*node.Block) error {
    batch := new(leveldb.Batch)

    for _, block := range blocks {
        // Create a key based on block height
        key := fmt.Sprintf("block:%d", block.Index)
        
        // Marshal block to JSON
        blockData, err := json.Marshal(block)
        if err != nil {
            return fmt.Errorf("failed to marshal block: %v", err)
        }

        // Add to batch
        batch.Put([]byte(key), blockData)
    }

    // Write batch to db
    if err := s.db.Write(batch, nil); err != nil {
        return fmt.Errorf("failed to write blocks to db: %v", err)
    }

    return nil
}

// GetBlock retrieves a single block by height
func (s *BlockStore) GetBlock(height int64) (*node.Block, error) {
    key := fmt.Sprintf("block:%d", height)
    data, err := s.db.Get([]byte(key), nil)
    if err == leveldb.ErrNotFound {
        return nil, fmt.Errorf("block not found")
    }
    if err != nil {
        return nil, fmt.Errorf("failed to get block: %v", err)
    }

    var block node.Block
    if err := json.Unmarshal(data, &block); err != nil {
        return nil, fmt.Errorf("failed to unmarshal block: %v", err)
    }

    return &block, nil
}

func (s *BlockStore) Close() {
    if s.db != nil {
        s.db.Close()
    }
}
