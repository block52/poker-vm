const axios = require("axios");
// const { NodeRpcClient } = "@bitcoinbrisbane/block52";

class Block52 {
    constructor(node_url) {
        // set node url
        this.node_url = node_url; // remove, just use the client
        // this.client = new NodeRpcClient(node_url);
        console.log("Block52 node", this.node_url);
        this.requestId = 1;
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
        const rpc_request = {
            jsonrpc: "2.0",
            method: "get_account",
            params: [id],
            id: this.requestId
        };

        console.log('\n=== Proxy Sending RPC Request ===');
        console.log('To:', this.node_url);
        console.log('Request:', JSON.stringify(rpc_request, null, 2));

        try {
            const { data } = await axios.post(this.node_url, rpc_request);
            console.log('\n=== Proxy Received Response ===');
            console.log('Response:', JSON.stringify(data, null, 2));
            console.log('===============================\n');

            this.requestId++;
            
            return {
                nonce: 0,
                address: data.result.data.address,
                privateKey: "",
                path: "",
                balance: data.result.data.balance
            };
        } catch (error) {
            console.error('\n=== Proxy Error ===');
            console.error('Error:', error.message);
            console.error('Response:', error.response?.data);
            console.error('===================\n');
            throw error;
        }
    }

    async getPlayer(index, id) {
        const response = await this.getAccount(id);
        return response.data;
    }

    async getTable(id) {
        const rpc_request = {
            jsonrpc: "2.0",
            method: "get_game_state",
            params: [id],
            id: this.requestId
        };

        const { data } = await axios.post(this.node_url, rpc_request);
        console.log("Block52 getTable", data);

        this.requestId++;

        return data.result;
    }
}

module.exports = Block52;
