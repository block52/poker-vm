const axios = require("axios");

class Block52 {

    constructor(node_url) {
        // set node url
        this.node_url = node_url;
        console.log("Block52 node", this.node_url);
    }

    getUnixTime () {
        // todo: return the current time in UNIX format from the node
        return Math.floor(Date.now());
    }

    async getNonce(id) {
        return 0;
    }

    async getAccount(id) {
        const rpc_request = {
            jsonrpc: "2.0",
            method: "get_account",
            params: [id],
            id: 1
        };

        const response = await axios.post(this.node_url, rpc_request);
        console.log("Block52 getAccount", response.data);
        
        return {
            nonce: 0,
            address: response.data.result.address,
            privateKey: "",
            path: "",
            balance: response.data.result.balance
        };
    }

    async getBalance(id) {
        const response = await this.getAccount(id);
        return response.data?.balance;
    }

    async getNonce(id) {
        const response = await this.getAccount(id);
        return response.data?.nonce;
    }
}

module.exports = Block52;
