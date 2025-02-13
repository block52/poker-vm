const Block = require("../models/block.model");
const logger = require("../config/logger");

class BlockService {
    async clearDatabase() {
        try {
            await Block.deleteMany({});
            logger.info("Successfully cleared blocks database");
        } catch (error) {
            logger.error("Error clearing blocks database", {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async blockExists(index, hash) {
        try {
            const exists = await Block.exists({
                $or: [{ index: index }, { hash: hash }]
            });
            return exists !== null;
        } catch (error) {
            logger.error("Error checking block existence", {
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
                logger.warn("Block already exists in database", {
                    blockIndex: blockData.index,
                    blockHash: blockData.hash
                });
                return null;
            }

            // Debug log to see what we're getting from PVM
            // logger.debug('Raw block data received from PVM:', {
            //     blockData: JSON.stringify(blockData, null, 2)
            // });

            // Prepare the block data with transaction count
            const blockToSave = {
                ...blockData,
                transactionCount: blockData.transactions?.length || 0,
                transactions: blockData.transactions || []
            };

            const block = new Block(blockToSave);

            // Debug log what we're about to save
            // logger.debug('Block data being saved:', {
            //     blockIndex: block.index,
            //     blockHash: block.hash,
            //     transactionCount: block.transactionCount,
            //     fullBlock: JSON.stringify(block.toObject(), null, 2)
            // });

            await block.save();

            // logger.info('Block saved to database', {
            //     blockIndex: block.index,
            //     blockHash: block.hash,
            //     transactionCount: block.transactionCount
            // });

            return block;
        } catch (error) {
            if (error.code === 11000) {
                logger.warn("Block already exists in database (caught by unique index)", {
                    blockIndex: blockData.index,
                    blockHash: blockData.hash
                });
                return null;
            }
            logger.error("Error saving block to database", {
                error: error.message,
                stack: error.stack,
                blockIndex: blockData?.index
            });
            throw error;
        }
    }

    async getBlockByIndex(index) {
        try {
            return await Block.findOne({ index });
        } catch (error) {
            logger.error("Error fetching block by index", {
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
            logger.error("Error fetching block by hash", {
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
            logger.error("Error fetching latest block", {
                error: error.message
            });
            throw error;
        }
    }

    async getBlocks(skip = 0, limit = 100, sort = "-index") {
        try {
            // Convert sort parameter to MongoDB sort object
            const sortObj = {};
            if (sort.startsWith("-")) {
                sortObj[sort.substring(1)] = -1;
            } else {
                sortObj[sort] = 1;
            }

            // Fetch blocks with proper sorting
            const blocks = await Block.find().sort(sortObj).skip(skip).limit(limit);

            // Get total count for pagination
            const totalBlocks = await Block.countDocuments();

            return {
                blocks,
                pagination: {
                    currentPage: Math.floor(skip / limit) + 1,
                    totalPages: Math.ceil(totalBlocks / limit),
                    totalBlocks,
                    blocksPerPage: limit
                }
            };
        } catch (error) {
            logger.error("Error fetching blocks", {
                error: error.message,
                skip,
                limit,
                sort
            });
            throw error;
        }
    }
}

module.exports = new BlockService();
