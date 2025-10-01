import { StargateClient, SigningStargateClient, GasPrice } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { stringToPath } from "@cosmjs/crypto";
import { Coin } from "@cosmjs/amino";
import { Tendermint37Client } from "@cosmjs/tendermint-rpc";

export interface CosmosConfig {
    rpcEndpoint: string;
    chainId: string;
    prefix: string;
    denom: string;
    gasPrice: string;
    mnemonic?: string;
}

export class CosmosClient {
    private config: CosmosConfig;
    private client?: StargateClient;
    private signingClient?: SigningStargateClient;
    private tmClient?: Tendermint37Client;
    private wallet?: DirectSecp256k1HdWallet;

    constructor(config: CosmosConfig) {
        this.config = config;
    }

    /**
     * Initialize the read-only client
     */
    async initClient(): Promise<void> {
        if (!this.client) {
            this.client = await StargateClient.connect(this.config.rpcEndpoint);
        }
    }

    /**
     * Initialize the signing client (requires mnemonic)
     */
    async initSigningClient(): Promise<void> {
        if (!this.config.mnemonic) {
            throw new Error("Mnemonic required for signing client");
        }

        if (!this.wallet) {
            this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(
                this.config.mnemonic,
                {
                    prefix: this.config.prefix,
                    hdPaths: [stringToPath("m/44'/118'/0'/0/0")]
                }
            );
        }

        if (!this.signingClient) {
            this.signingClient = await SigningStargateClient.connectWithSigner(
                this.config.rpcEndpoint,
                this.wallet,
                {
                    gasPrice: GasPrice.fromString(this.config.gasPrice)
                }
            );
        }
    }

    /**
     * Get account balance
     */
    async getBalance(address: string): Promise<bigint> {
        await this.initClient();
        if (!this.client) throw new Error("Client not initialized");

        const balance = await this.client.getBalance(address, this.config.denom);
        return BigInt(balance.amount);
    }

    /**
     * Get all balances for an account
     */
    async getAllBalances(address: string): Promise<Coin[]> {
        await this.initClient();
        if (!this.client) throw new Error("Client not initialized");

        const balances = await this.client.getAllBalances(address);
        return [...balances]; // Convert readonly array to mutable array
    }

    /**
     * Send tokens from one account to another
     */
    async sendTokens(
        fromAddress: string,
        toAddress: string,
        amount: bigint,
        memo?: string
    ): Promise<string> {
        await this.initSigningClient();
        if (!this.signingClient) throw new Error("Signing client not initialized");

        const coin: Coin = {
            denom: this.config.denom,
            amount: amount.toString()
        };

        const result = await this.signingClient.sendTokens(
            fromAddress,
            toAddress,
            [coin],
            "auto",
            memo
        );

        return result.transactionHash;
    }

    /**
     * Get account information
     */
    async getAccount(address: string) {
        await this.initClient();
        if (!this.client) throw new Error("Client not initialized");

        return await this.client.getAccount(address);
    }

    /**
     * Get the wallet address (first account)
     */
    async getWalletAddress(): Promise<string> {
        if (!this.wallet) {
            await this.initSigningClient();
        }
        if (!this.wallet) throw new Error("Wallet not initialized");

        const accounts = await this.wallet.getAccounts();
        return accounts[0].address;
    }

    /**
     * Get current block height
     */
    async getHeight(): Promise<number> {
        await this.initClient();
        if (!this.client) throw new Error("Client not initialized");

        return await this.client.getHeight();
    }

    /**
     * Get transaction by hash
     */
    async getTx(txHash: string) {
        await this.initClient();
        if (!this.client) throw new Error("Client not initialized");

        return await this.client.getTx(txHash);
    }

    /**
     * Initialize the Tendermint client for block queries
     */
    async initTendermintClient(): Promise<void> {
        if (!this.tmClient) {
            this.tmClient = await Tendermint37Client.connect(this.config.rpcEndpoint);
        }
    }

    /**
     * Get a specific block by height
     */
    async getBlock(height: number) {
        await this.initTendermintClient();
        if (!this.tmClient) throw new Error("Tendermint client not initialized");

        return await this.tmClient.block(height);
    }

    /**
     * Get multiple blocks starting from a specific height
     */
    async getBlocks(startHeight: number, count: number = 10) {
        await this.initTendermintClient();
        if (!this.tmClient) throw new Error("Tendermint client not initialized");

        const blocks = [];
        const currentHeight = await this.getHeight();
        const endHeight = Math.min(startHeight + count - 1, currentHeight);

        for (let height = startHeight; height <= endHeight; height++) {
            try {
                const block = await this.tmClient.block(height);
                blocks.push(block);
            } catch (error) {
                console.warn(`Failed to fetch block at height ${height}:`, error);
                // Continue fetching other blocks even if one fails
            }
        }

        return blocks;
    }

    /**
     * Get the latest blocks (most recent)
     */
    async getLatestBlocks(count: number = 10) {
        const currentHeight = await this.getHeight();
        const startHeight = Math.max(1, currentHeight - count + 1);
        return await this.getBlocks(startHeight, count);
    }

    /**
     * Disconnect clients
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            this.client.disconnect();
        }
        if (this.signingClient) {
            this.signingClient.disconnect();
        }
        if (this.tmClient) {
            this.tmClient.disconnect();
        }
    }
}

// Singleton instance
let cosmosClientInstance: CosmosClient | null = null;

export const getCosmosClient = (config?: CosmosConfig): CosmosClient => {
    if (!cosmosClientInstance && config) {
        cosmosClientInstance = new CosmosClient(config);
    }

    if (!cosmosClientInstance) {
        throw new Error("Cosmos client not initialized. Provide config on first call.");
    }

    return cosmosClientInstance;
};

export const initializeCosmosClient = (config: CosmosConfig): CosmosClient => {
    cosmosClientInstance = new CosmosClient(config);
    return cosmosClientInstance;
};