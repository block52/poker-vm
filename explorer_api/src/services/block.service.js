const Block = require('../models/block.model');
const logger = require('../config/logger');

class BlockService {
    async clearDatabase() {
        try {
            await Block.deleteMany({});
            logger.info('Successfully cleared blocks database');
        } catch (error) {
            logger.error('Error clearing blocks database', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async blockExists(index, hash) {
        try {
            const exists = await Block.exists({ 
                $or: [
                    { index: index },
                    { hash: hash }
                ]
            });
            return exists !== null;
        } catch (error) {
            logger.error('Error checking block existence', {
                error: error.message,
                blockIndex: index,
                blockHash: hash
            });
            throw error;
        }
    }

    async createBlock(blockData) {
        try {
            // Check if block already exists
            const exists = await this.blockExists(blockData.index, blockData.hash);
            if (exists) {
                logger.warn('Block already exists in database', {
                    blockIndex: blockData.index,
                    blockHash: blockData.hash
                });
                return null;
            }

            // Debug log to see what we're getting from PVM
            logger.debug('Raw block data received from PVM:', {
                blockData: JSON.stringify(blockData, null, 2),
                hasTransactions: !!blockData.transactions,
                transactionsType: typeof blockData.transactions,
                transactionsIsArray: Array.isArray(blockData.transactions),
                transactionsLength: blockData.transactions?.length
            });

            // Save transaction hashes with the block
            const blockToSave = {
                ...blockData,
                transactions: Array.isArray(blockData.transactions) ? blockData.transactions : []
            };

            const block = new Block(blockToSave);
            
            // Debug log what we're about to save
            logger.debug('Block data being saved:', {
                blockIndex: block.index,
                blockHash: block.hash,
                transactions: block.transactions,
                fullBlock: JSON.stringify(block.toObject(), null, 2)
            });

            await block.save();
            
            logger.info('Block saved to database', {
                blockIndex: block.index,
                blockHash: block.hash,
                transactionCount: block.transactions?.length || 0,
                savedTransactions: block.transactions
            });
            
            return block;
        } catch (error) {
            if (error.code === 11000) {
                logger.warn('Block already exists in database (caught by unique index)', {
                    blockIndex: blockData.index,
                    blockHash: blockData.hash
                });
                return null;
            }
            logger.error('Error saving block to database', {
                error: error.message,
                stack: error.stack,
                blockIndex: blockData.index
            });
            throw error;
        }
    }

    async getBlockByIndex(index) {
        try {
            return await Block.findOne({ index });
        } catch (error) {
            logger.error('Error fetching block by index', {
                error: error.message,
                blockIndex: index
            });
            throw error;
        }
    }

    async getBlockByHash(hash) {
        try {
            return await Block.findOne({ hash });
        } catch (error) {
            logger.error('Error fetching block by hash', {
                error: error.message,
                blockHash: hash
            });
            throw error;
        }
    }

    async getLatestBlock() {
        try {
            return await Block.findOne().sort({ index: -1 });
        } catch (error) {
            logger.error('Error fetching latest block', {
                error: error.message
            });
            throw error;
        }
    }

    async getBlocks(skip = 0, limit = 20) {
        try {
            return await Block.find()
                .sort({ index: -1 })
                .skip(skip)
                .limit(limit);
        } catch (error) {
            logger.error('Error fetching blocks', {
                error: error.message,
                skip,
                limit
            });
            throw error;
        }
    }
}

module.exports = new BlockService(); 