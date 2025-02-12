const axios = require('axios');
const logger = require('../config/logger');
const blockService = require('./block.service');

class PVMService {
    constructor() {
        this.baseUrl = process.env.PVM_URL || 'http://localhost:3000';
        this.currentBlockIndex = 1;
        this.isSyncing = false;
        
        logger.info(`PVM Service initialized with URL: ${this.baseUrl}`);
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

            console.log('Raw PVM response:', response.data);

            if (response.data?.result?.data) {
                return response.data.result.data;
            }
            return null;

        } catch (error) {
            console.error('Error fetching block:', error);
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

            // Clear existing data - just blocks for now
            await blockService.clearDatabase();
            logger.info('Database cleared, starting fresh sync');
            
            this.currentBlockIndex = 1; // Reset to start from beginning
            
            const syncNextBlock = async () => {
                try {
                    const block = await this.getBlock(this.currentBlockIndex);
                    
                    if (block) {
                        // Log the block data
                        console.log('Retrieved block data:', JSON.stringify(block, null, 2));
                        
                        // Save the block to database
                        const savedBlock = await blockService.createBlock(block);
                        if (savedBlock) {
                            logger.info('Block saved successfully', { 
                                blockIndex: this.currentBlockIndex,
                                blockHash: block.hash,
                                transactionCount: block.transactions?.length || 0
                            });
                        }
                        
                        this.currentBlockIndex++;
                    } else {
                        logger.info('No more blocks available or reached the end', {
                            lastAttemptedIndex: this.currentBlockIndex
                        });
                    }
                } catch (error) {
                    logger.error('Error during block sync', {
                        blockIndex: this.currentBlockIndex,
                        error: error.message
                    });
                }
            };

            // Initial sync
            await syncNextBlock();

            // Continue syncing every 5 seconds
            setInterval(syncNextBlock, 5000);

        } catch (error) {
            logger.error('Error starting block sync', {
                error: error.message
            });
            this.isSyncing = false;
        }
    }
}

module.exports = new PVMService(); 