const axios = require('axios');
const Transaction = require('../models/transaction.model');
const logger = require('../config/logger');

class TransactionService {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
    }

    async clearTransactions() {
        try {
            await Transaction.deleteMany({});
            logger.info('Successfully cleared transactions database');
        } catch (error) {
            logger.error('Error clearing transactions database', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async getTransactionByHash(hash) {
        try {
            // First check if we already have it in our database
            const existingTx = await Transaction.findOne({ hash });
            if (existingTx) {
                return existingTx;
            }

            // If not in database, fetch from PVM
            const response = await axios.post(this.baseUrl, {
                id: "1",
                method: "get_transaction",
                version: "2.0",
                params: [hash]
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.result?.data) {
                return response.data.result.data;
            }
            return null;
        } catch (error) {
            logger.error('Error fetching transaction', {
                hash,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async getTransactionsByBlockIndex(blockIndex) {
        try {
            // First check if we have these transactions in our database
            const existingTxs = await Transaction.find({ blockIndex });
            if (existingTxs && existingTxs.length > 0) {
                logger.debug('Found transactions in database for block', { 
                    blockIndex,
                    count: existingTxs.length 
                });
                return existingTxs;
            }

            // If not in database, fetch from PVM
            const response = await axios.post(this.baseUrl, {
                id: "1",
                method: "get_transactions",
                version: "2.0",
                params: [blockIndex.toString()]
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            logger.debug('PVM Response for block transactions', {
                blockIndex,
                response: response.data
            });

            if (response.data?.result?.data) {
                const transactions = response.data.result.data;
                logger.info('Retrieved transactions from PVM', {
                    blockIndex,
                    transactionCount: transactions.length
                });

                // Save transactions to database if they don't exist
                for (const tx of transactions) {
                    await this.saveTransaction(tx, tx.blockHash || '', blockIndex);
                }

                return transactions;
            }
            
            logger.info('No transactions found for block', { blockIndex });
            return [];
        } catch (error) {
            logger.error('Error fetching transactions by block index', {
                blockIndex,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async saveTransaction(transactionData, blockHash, blockIndex) {
        try {
            const exists = await Transaction.exists({ hash: transactionData.hash });
            if (exists) {
                logger.debug('Transaction already exists in database', {
                    hash: transactionData.hash,
                    blockIndex
                });
                return null;
            }

            const transaction = new Transaction({
                ...transactionData,
                blockHash,
                blockIndex
            });

            await transaction.save();
            logger.info('Transaction saved to database', {
                hash: transaction.hash,
                blockHash,
                blockIndex
            });
            return transaction;
        } catch (error) {
            if (error.code === 11000) {
                logger.warn('Transaction already exists (caught by unique index)', {
                    hash: transactionData.hash,
                    blockIndex
                });
                return null;
            }
            logger.error('Error saving transaction', {
                error: error.message,
                stack: error.stack,
                blockIndex
            });
            throw error;
        }
    }

    async getTransactionsByBlockHash(blockHash) {
        try {
            return await Transaction.find({ blockHash });
        } catch (error) {
            logger.error('Error fetching transactions by block hash', {
                blockHash,
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = new TransactionService(); 