import axios from "axios";

const REST_API_URL = "http://localhost:1317";

export interface CosmosBlock {
  block_id: {
    hash: string;
  };
  block: {
    header: {
      height: string;
      time: string;
      chain_id: string;
      proposer_address: string;
    };
    data: {
      txs: string[]; // Base64 encoded transactions
    };
  };
}

export interface CosmosTransaction {
  tx: {
    body: {
      messages: any[];
    };
  };
  tx_response: {
    height: string;
    txhash: string;
    code: number;
    gas_used: string;
    gas_wanted: string;
    timestamp: string;
    events: any[];
  };
}

export const cosmosApi = {
  // Get latest block
  async getLatestBlock(): Promise<CosmosBlock> {
    const response = await axios.get(
      `${REST_API_URL}/cosmos/base/tendermint/v1beta1/blocks/latest`
    );
    return response.data;
  },

  // Get block by height
  async getBlockByHeight(height: number): Promise<CosmosBlock> {
    const response = await axios.get(
      `${REST_API_URL}/cosmos/base/tendermint/v1beta1/blocks/${height}`
    );
    return response.data;
  },

  // Get transaction by hash
  async getTransaction(hash: string): Promise<CosmosTransaction> {
    const response = await axios.get(
      `${REST_API_URL}/cosmos/tx/v1beta1/txs/${hash}`
    );
    return response.data;
  },

  // Get multiple recent blocks
  async getRecentBlocks(count: number = 20): Promise<CosmosBlock[]> {
    const latest = await this.getLatestBlock();
    const latestHeight = parseInt(latest.block.header.height);

    const blocks: CosmosBlock[] = [];
    const promises: Promise<CosmosBlock>[] = [];

    for (let i = 0; i < count; i++) {
      const height = latestHeight - i;
      if (height > 0) {
        promises.push(this.getBlockByHeight(height));
      }
    }

    const results = await Promise.allSettled(promises);
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        blocks.push(result.value);
      }
    });

    return blocks;
  },
};
