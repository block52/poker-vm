const axios = require("axios");

class Block52 {

    constructor(node) {
        // set node url
        this.node = node || "https://node1.block52.xyz";
    }

    async getBalance(id) {
        const rpc_request = {
            jsonrpc: "2.0",
            method: "get_balance",
            params: [id],
            id: 1
        };

        const response = await axios.post(this.node, rpc_request);
        return response.data?.balance;
    }

    async getNonce(id) {
        const response = await this.getBalance(id);
        return response.data?.nonce;
    }
}

module.exports = Block52;
