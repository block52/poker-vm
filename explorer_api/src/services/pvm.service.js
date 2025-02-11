const axios = require('axios');
const logger = require('../config/logger');
const blockService = require('./block.service');
const transactionService = require('./transaction.service');

class PVMService {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.currentBlockIndex = 1;
        this.isSyncing = false;
    }

    async getBlock(index) {
        try {
            const response = await axios.post(this.baseUrl, {
                id: "1",
                method: "get_block",
                version: "2.0",
                params: [index.toString()]
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            logger.debug('Raw PVM response for get_block:', {
                blockIndex: index,
                response: JSON.stringify(response.data, null, 2)
            });

            if (response.data?.result?.data) {
                const block = response.data.result.data;
                logger.info('Retrieved block from PVM', {
                    blockIndex: index,
                    blockHash: block.hash
                });
                
                try {
                    // Save block to database
                    const savedBlock = await blockService.createBlock(block);
                    
                    // Get transactions for this block
                    if (savedBlock) {
                        logger.info('Fetching transactions for block', {
                            blockIndex: index
                        });

                        const transactions = await transactionService.getTransactionsByBlockIndex(index);
                        logger.info('Retrieved transactions for block', {
                            blockIndex: index,
                            transactionCount: transactions.length
                        });
                    }
                    
                    return block;
                } catch (dbError) {
                    logger.error('Failed to save block or fetch transactions', {
                        blockIndex: index,
                        error: dbError.message,
                        stack: dbError.stack
                    });
                }
            }
            return null;
        } catch (error) {
            logger.error('Error fetching block from PVM', {
                blockIndex: index,
                error: error.message,
                stack: error.stack
            });
            return null;
        }
    }

    async startBlockSync() {
        if (this.isSyncing) {
            logger.warn('Block sync already in progress');
            return;
        }

        try {
            this.isSyncing = true;
            logger.info('Starting block synchronization with PVM');

            // Clear existing data
            await Promise.all([
                blockService.clearDatabase(),
                transactionService.clearTransactions()
            ]);
            logger.info('Databases cleared, starting fresh sync');
            
            this.currentBlockIndex = 1; // Reset to start from beginning
            
            const syncNextBlock = async () => {
                try {
                    const block = await this.getBlock(this.currentBlockIndex);
                    
                    if (block) {
                        logger.debug('Block sync details', {
                            index: block.index,
                            hash: block.hash,
                            timestamp: block.timestamp,
                            transactionCount: block.transactions.length
                        });
                        
                        this.currentBlockIndex++;
                    } else {
                        logger.info('No more blocks available or reached the end', {
                            lastAttemptedIndex: this.currentBlockIndex
                        });
                    }
                } catch (error) {
                    logger.error('Error during block sync', {
                        blockIndex: this.currentBlockIndex,
                        error: error.message,
                        stack: error.stack
                    });
                }
            };

            // Initial sync
            await syncNextBlock();

            // Continue syncing every second
            setInterval(syncNextBlock, 1000);

        } catch (error) {
            logger.error('Error starting block sync', {
                error: error.message,
                stack: error.stack
            });
            this.isSyncing = false;
        }
    }
}

module.exports = new PVMService(); 