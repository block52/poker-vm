const axios = require("axios");
// const { NodeRpcClient } = "@bitcoinbrisbane/block52";

class Block52 {
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

    getUnixTime () {
        // todo: return the current time in UNIX format from the node
        return Math.floor(Date.now());
    }

    async getNonce(id) {
        const account = await this.client.getAccount(id);
        return account.nonce;
    }

    async getAccount(id) {
        console.log('\n=== Getting Account ===');
        console.log('Address:', id);
        
        try {
            const rpc_request = {
                jsonrpc: "2.0",
                method: "get_account",
                params: [id],
                id: this.requestId++
            };

            console.log('Sending request to:', this.node_url);
            const { data } = await this.client.post('', rpc_request);
            
            // If we get an error response from the node
            if (data.error) {
                console.warn('Node returned error:', data.error);
                return {
                    address: id,
                    balance: "0",
                    error: data.error.message,
                    isNodeError: true
                };
            }

            // If we get a successful response
            return {
                nonce: 0,
                address: id,
                balance: data.result?.balance || "0",
                privateKey: "",
                path: ""
            };

        } catch (error) {
            console.error('Unexpected error in getAccount:', error);
            return {
                address: id,
                balance: "0",
                error: "Unable to fetch account data",
                isNodeError: true
            };
        }
    }

    async getPlayer(index, id) {
        const response = await this.getAccount(id);
        return response.data;
    }

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

module.exports = Block52;
