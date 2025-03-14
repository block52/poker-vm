/**
 * Block52 Client
 * Handles all RPC communication with Block52 nodes
 */

// ===================================
// 1. Import Dependencies
// ===================================
const axios = require("axios");
// const { NodeRpcClient } = "@bitcoinbrisbane/block52";


// ===================================
// 2. Client Class Definition
// ===================================
class Block52 {
    /**
    * Initialize Block52 client with node URL
    * @param {string} node_url - URL of the Block52 node
    */
    constructor(node_url) {
        console.log("Initializing Block52 client with URL:", node_url);
        this.node_url = node_url;
        this.requestId = 1;

        // Configure axios instance with timeout and retry logic
        this.client = axios.create({
            baseURL: node_url,
            timeout: 10000, // 10 second timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add response interceptor for better error handling
        this.client.interceptors.response.use(
            response => response,
            error => {
                console.error('\n=== Block52 Client Error ===');
                console.error('URL:', error.config?.url);
                console.error('Method:', error.config?.method);
                console.error('Status:', error.response?.status);
                console.error('Message:', error.message);

                // Return a standardized error response instead of throwing
                return Promise.resolve({
                    data: {
                        error: {
                            code: error.response?.status || 500,
                            message: error.message,
                            isNodeError: true
                        }
                    }
                });
            }
        );
    }

    // ===================================
    // 3. System Methods
    // ===================================

    /**
     * Get current Unix timestamp
     * @returns {number} Current Unix timestamp
     */

    getUnixTime() {
        // todo: return the current time in UNIX format from the node
        return Math.floor(Date.now());
    }

    // ===================================
    // 4. Account Methods
    // ===================================

    /**
     * Get account nonce
     * @param {string} id - Account address
     * @returns {Promise<number>} Account nonce
     */

    async getNonce(id) {
        const account = await this.client.getAccount(id);
        return account.nonce;
    }

    /**
     * Get account details
     * @param {string} id - Account address
     * @returns {Promise<Object>} Account details
     */
    async getAccount(id) {
        try {
            const rpc_request = {
                jsonrpc: "2.0",
                method: "get_account",
                params: [id],
                id: this.requestId++
            };

            console.log('Sending account request to:', this.node_url);
            const { data } = await this.client.post('', rpc_request);

            // Add better error handling and logging
            console.log('Account response:', data);

            if (data.error) {
                return {
                    error: data.error.message,
                    isNodeError: true
                };
            }

            // Properly extract and return the account data
            return {
                address: data.result.data.address,
                balance: data.result.data.balance,
                nonce: data.result.data.nonce,
                signature: data.result.signature
            };

        } catch (error) {
            console.error('Error in getAccount:', error);
            return {
                error: "Unable to fetch account data",
                isNodeError: true
            };
        }
    }

    async getPlayer(index, id) {
        const response = await this.getAccount(id);
        return response.data;
    }

    // ===================================
    // 5. Table Methods
    // ===================================

    /**
     * Get table details
     * @param {string} id - Table address
     * @returns {Promise<Object>} Table details
     */


    async getTable(id) {
        try {
            const rpc_request = {
                jsonrpc: "2.0",
                method: "get_game_state",
                params: [id],
                id: this.requestId++
            };

            const { data } = await this.client.post('', rpc_request);

            if (data.error) {
                return {
                    error: data.error.message,
                    isNodeError: true
                };
            }

            return data.result;

        } catch (error) {
            return {
                error: "Unable to fetch table data",
                isNodeError: true
            };
        }
    }

    /**
    * Get all available tables
    * @returns {Promise<Array>} List of tables
    */
    async getTables() {
        try {
            const rpc_request = {
                jsonrpc: "2.0",
                method: "get_tables",
                params: [],
                id: this.requestId++
            };

            const { data } = await this.client.post('', rpc_request);

            if (data.error) {
                return [];
            }

            return data.result || [];

        } catch (error) {
            console.error('Error fetching tables:', error);
            return [];
        }
    }

    // ===================================
    // 6. Player Methods
    // ===================================

    /**
     * Get player information
     * @param {string} tableId - Table ID
     * @param {number} seat - Seat number
     * @returns {Promise<Object|null>} Player details
     */

    async getPlayer(tableId, seat) {
        try {
            const rpc_request = {
                jsonrpc: "2.0",
                method: "get_player",
                params: [tableId, seat],
                id: this.requestId++
            };

            const { data } = await this.client.post('', rpc_request);

            if (data.error) {
                return null;
            }

            return data.result;

        } catch (error) {
            console.error('Error fetching player:', error);
            return null;
        }
    }
}

// ===================================
// 7. Export
// ===================================
module.exports = Block52;
