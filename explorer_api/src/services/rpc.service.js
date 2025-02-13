const axios = require("axios");
const logger = require("../config/logger");
const blockService = require("./block.service");

class RPCService {
    constructor() {
        this.baseUrl = process.env.PVM_URL || "http://localhost:3000";
        this.currentBlockIndex = 1;
        this.isSyncing = false;

        logger.info(`PVM Service initialized with URL: ${this.baseUrl}`);
    }

    async getBlock(index) {
        try {
            const response = await axios.post(
                this.baseUrl,
                {
                    id: "1",
                    method: "get_block",
                    version: "2.0",
                    params: [index.toString()]
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            // console.log('Raw PVM response:', response.data);

            if (response.data?.result?.data) {
                return response.data.result.data;
            }
            return null;
        } catch (error) {
            console.error("Error fetching block:", error);
            return null;
        }
    }

    async getBlocks() {
        try {
            const response = await axios.post(
                this.baseUrl,
                {
                    id: "1",
                    method: "get_blocks",
                    version: "2.0",
                    params: [""]
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            if (response.data?.result?.data) {
                return response.data.result.data;
            }
            return null;
        } catch (error) {
            console.error("Error fetching blocks:", error);
            return null;
        }
    }
}

module.exports = new RPCService();
