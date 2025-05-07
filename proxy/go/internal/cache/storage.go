package cache

import (
	"encoding/json"
	"fmt"
	"log"
	"path/filepath"

	"github.com/tecbot/gorocksdb"
	"github.com/block52/proxy/internal/models" // Update with your module path
)

// BlockStore represents a RocksDB-backed block storage
type BlockStore struct {
	db        *gorocksdb.DB
	readOpts  *gorocksdb.ReadOptions
	writeOpts *gorocksdb.WriteOptions
}

// NewBlockStore creates a new RocksDB-backed block storage
func NewBlockStore(dataDir string) (*BlockStore, error) {
	// Create RocksDB options
	opts := gorocksdb.NewDefaultOptions()
	opts.SetCreateIfMissing(true)

	// Configure with reasonable defaults for blockchain data
	opts.SetCompression(gorocksdb.SnappyCompression)
	opts.IncreaseParallelism(2)                          // Use 2 threads for background work
	opts.OptimizeLevelStyleCompaction(512 * 1024 * 1024) // 512MB memory budget

	// Open the database
	dbPath := filepath.Join(dataDir, "blocks")
	db, err := gorocksdb.OpenDb(opts, dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open RocksDB: %w", err)
	}

	// Create read/write options
	readOpts := gorocksdb.NewDefaultReadOptions()
	writeOpts := gorocksdb.NewDefaultWriteOptions()

	log.Printf("Opened block store at %s", dbPath)

	return &BlockStore{
		db:        db,
		readOpts:  readOpts,
		writeOpts: writeOpts,
	}, nil
}

// Close closes the database
func (s *BlockStore) Close() {
	if s.readOpts != nil {
		s.readOpts.Destroy()
	}
	if s.writeOpts != nil {
		s.writeOpts.Destroy()
	}
	if s.db != nil {
		s.db.Close()
	}
}

// StoreBlock stores a block in the database using its height as the key
func (s *BlockStore) StoreBlock(block *models.Block) error {
	// Serialize the block to JSON
	blockData, err := json.Marshal(block)
	if err != nil {
		return fmt.Errorf("failed to serialize block: %w", err)
	}

	// Create key from block height (as bytes)
	key := []byte(fmt.Sprintf("block:%d", block.Index))

	// Also store by hash for retrieval by hash
	keyByHash := []byte(fmt.Sprintf("hash:%s", block.Hash))

	// Store in RocksDB
	err = s.db.Put(s.writeOpts, key, blockData)
	if err != nil {
		return fmt.Errorf("failed to store block by height: %w", err)
	}

	// Store hash -> height mapping
	heightBytes := []byte(fmt.Sprintf("%d", block.Index))
	err = s.db.Put(s.writeOpts, keyByHash, heightBytes)
	if err != nil {
		return fmt.Errorf("failed to store block hash mapping: %w", err)
	}

	return nil
}

// GetBlockByHeight retrieves a block by its height
func (s *BlockStore) GetBlockByHeight(height int) (*models.Block, error) {
	// Create key from block height
	key := []byte(fmt.Sprintf("block:%d", height))

	// Get from RocksDB
	blockData, err := s.db.Get(s.readOpts, key)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve block data: %w", err)
	}
	defer blockData.Free()

	// Check if block exists
	if !blockData.Exists() {
		return nil, fmt.Errorf("block at height %d not found", height)
	}

	// Deserialize the block from JSON
	var block models.Block
	if err := json.Unmarshal(blockData.Data(), &block); err != nil {
		return nil, fmt.Errorf("failed to deserialize block: %w", err)
	}

	return &block, nil
}

// GetBlockByHash retrieves a block by its hash
func (s *BlockStore) GetBlockByHash(hash string) (*models.Block, error) {
	// Create key for hash lookup
	keyByHash := []byte(fmt.Sprintf("hash:%s", hash))

	// Get height from RocksDB
	heightData, err := s.db.Get(s.readOpts, keyByHash)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve height for hash: %w", err)
	}
	defer heightData.Free()

	// Check if hash exists
	if !heightData.Exists() {
		return nil, fmt.Errorf("block with hash %s not found", hash)
	}

	// Parse height
	var height int
	if _, err := fmt.Sscanf(string(heightData.Data()), "%d", &height); err != nil {
		return nil, fmt.Errorf("failed to parse height: %w", err)
	}

	// Get block by height
	return s.GetBlockByHeight(height)
}

// HasBlock checks if a block at the given height exists
func (s *BlockStore) HasBlock(height int) (bool, error) {
	// Create key from block height
	key := []byte(fmt.Sprintf("block:%d", height))

	// Get from RocksDB
	blockData, err := s.db.Get(s.readOpts, key)
	if err != nil {
		return false, fmt.Errorf("failed to check block existence: %w", err)
	}
	defer blockData.Free()

	return blockData.Exists(), nil
}

// GetLatestBlockHeight returns the height of the latest stored block
func (s *BlockStore) GetLatestBlockHeight() (int, error) {
	// Create an iterator
	iter := s.db.NewIterator(s.readOpts)
	defer iter.Close()

	// Seek to the last key with the "block:" prefix
	iter.SeekForPrev([]byte("block:\xff"))

	if !iter.Valid() {
		return 0, fmt.Errorf("no blocks found in the database")
	}

	// Parse the key to extract the height
	key := string(iter.Key().Data())
	var height int
	if _, err := fmt.Sscanf(key, "block:%d", &height); err != nil {
		return 0, fmt.Errorf("failed to parse height from key '%s': %w", key, err)
	}

	return height, nil
}
