import { CosmosClient, CosmosConfig, initializeCosmosClient } from '@bitcoinbrisbane/block52';

/**
 * Example frontend usage of the CosmosClient from the SDK
 */

// Cosmos configuration for your blockchain
const cosmosConfig: CosmosConfig = {
    rpcEndpoint: 'https://node1.block52.xyz',
    chainId: 'pokerchain',
    prefix: 'poker',
    denom: 'upoker',
    gasPrice: '0.025upoker',
    // mnemonic: 'your twelve word mnemonic phrase here' // Optional, only needed for signing
};

export class CosmosService {
    private cosmosClient: CosmosClient;

    constructor() {
        // Initialize the cosmos client
        this.cosmosClient = initializeCosmosClient(cosmosConfig);
    }

    /**
     * Get account balance for a specific address
     */
    async getAccountBalance(address: string): Promise<string> {
        try {
            const balance = await this.cosmosClient.getBalance(address);
            return balance.toString();
        } catch (error) {
            console.error('Error fetching balance:', error);
            throw error;
        }
    }

    /**
     * Get all balances for an account
     */
    async getAllAccountBalances(address: string) {
        try {
            const balances = await this.cosmosClient.getAllBalances(address);
            return balances;
        } catch (error) {
            console.error('Error fetching balances:', error);
            throw error;
        }
    }

    /**
     * Get current blockchain height
     */
    async getBlockHeight(): Promise<number> {
        try {
            return await this.cosmosClient.getHeight();
        } catch (error) {
            console.error('Error fetching height:', error);
            throw error;
        }
    }

    /**
     * Get block information
     */
    async getBlock(height: number) {
        try {
            return await this.cosmosClient.getBlock(height);
        } catch (error) {
            console.error('Error fetching block:', error);
            throw error;
        }
    }

    /**
     * Get latest blocks
     */
    async getLatestBlocks(count: number = 10) {
        try {
            return await this.cosmosClient.getLatestBlocks(count);
        } catch (error) {
            console.error('Error fetching latest blocks:', error);
            throw error;
        }
    }

    /**
     * Send tokens (requires mnemonic in config)
     */
    async sendTokens(fromAddress: string, toAddress: string, amount: bigint, memo?: string): Promise<string> {
        try {
            return await this.cosmosClient.sendTokens(fromAddress, toAddress, amount, memo);
        } catch (error) {
            console.error('Error sending tokens:', error);
            throw error;
        }
    }

    /**
     * Disconnect the client when done
     */
    async disconnect(): Promise<void> {
        await this.cosmosClient.disconnect();
    }
}

// Example usage:
/*
const cosmosService = new CosmosService();

// Get balance
cosmosService.getAccountBalance('poker1abc123...').then(balance => {
    console.log('Balance:', balance);
});

// Get latest blocks
cosmosService.getLatestBlocks(5).then(blocks => {
    console.log('Latest blocks:', blocks);
});

// Clean up when done
window.addEventListener('beforeunload', () => {
    cosmosService.disconnect();
});
*/