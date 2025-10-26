import axios, { AxiosInstance } from "axios";

// Cosmos blockchain constants (matches pokerchain/x/poker/types/types.go)
export const COSMOS_CONSTANTS = {
    CHAIN_ID: "pokerchain",
    ADDRESS_PREFIX: "b52",
    TOKEN_DENOM: "b52usdc",
    USDC_DECIMALS: 6, // 1 USDC = 1,000,000 b52usdc
    GAME_CREATION_COST: 1, // 1 b52usdc = 0.000001 USDC
    DEFAULT_GAS_PRICE: "0.025b52usdc"
} as const;

// Define the game creation parameters interface
export interface CreateGameParams {
    creator: string;
    minBuyIn: string;
    maxBuyIn: string;
    minPlayers: number;
    maxPlayers: number;
    smallBlind: string;
    bigBlind: string;
    timeout: number;
    gameType: string;
}

// Define standard Cosmos types
export interface Coin {
    denom: string;
    amount: string;
}

export interface CosmosConfig {
    rpcEndpoint: string;
    restEndpoint: string;
    chainId: string;
    prefix: string;
    denom: string; // This will be "b52USDC"
    gasPrice: string;
    mnemonic?: string;
}

// Poker API types based on Swagger
export interface GameStateResponse {
    game_state: string; // JSON string containing the game state
}

export interface GameResponse {
    game: string; // JSON string containing the game info
}

export interface LegalActionsResponse {
    actions: string; // JSON string containing legal actions
}

export interface ListGamesResponse {
    games: string; // JSON string containing list of games
}

export interface PlayerGamesResponse {
    games: string; // JSON string containing player's games
}

export class CosmosClient {
    protected readonly config: CosmosConfig;
    private readonly restClient: AxiosInstance;

    constructor(config: CosmosConfig) {
        this.config = config;

        // Initialize REST client for API calls
        this.restClient = axios.create({
            baseURL: config.restEndpoint,
            timeout: 10000,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }

    /**
     * Get account information via REST API
     */
    async getAccount(address: string): Promise<any> {
        try {
            const response = await this.restClient.get(`/cosmos/auth/v1beta1/accounts/${address}`);
            return response.data.account;
        } catch (error) {
            console.error("Error fetching account:", error);
            throw error;
        }
    }

    /**
     * Get all coin balances for an address via REST API
     */
    async getAllBalances(address: string): Promise<Coin[]> {
        try {
            const response = await this.restClient.get(`/cosmos/bank/v1beta1/balances/${address}`);
            return response.data.balances || [];
        } catch (error) {
            console.error("Error fetching balances:", error);
            return [];
        }
    }

    /**
     * Get specific coin balance for an address via REST API
     */
    async getBalance(address: string, denom?: string): Promise<bigint> {
        try {
            const targetDenom = denom || this.config.denom;
            const response = await this.restClient.get(`/cosmos/bank/v1beta1/balances/${address}/by_denom?denom=${targetDenom}`);
            const balance = response.data.balance?.amount || "0";
            return BigInt(balance);
        } catch (error) {
            console.error("Error fetching balance:", error);
            return 0n;
        }
    }

    /**
     * Get current block height via REST API
     */
    async getHeight(): Promise<number> {
        try {
            const response = await this.restClient.get("/cosmos/base/tendermint/v1beta1/blocks/latest");
            return parseInt(response.data.block.header.height);
        } catch (error) {
            console.error("Error fetching height:", error);
            throw error;
        }
    }

    /**
     * Get transaction by hash via REST API
     */
    async getTx(txHash: string): Promise<any> {
        try {
            const response = await this.restClient.get(`/cosmos/tx/v1beta1/txs/${txHash}`);
            return response.data.tx_response;
        } catch (error) {
            console.error("Error fetching transaction:", error);
            throw error;
        }
    }

    /**
     * Get a specific block by height via REST API
     */
    async getBlock(height: number): Promise<any> {
        try {
            const response = await this.restClient.get(`/cosmos/base/tendermint/v1beta1/blocks/${height}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching block at height ${height}:`, error);
            throw error;
        }
    }

    /**
     * Get the latest block via REST API
     */
    async getLatestBlock(): Promise<any> {
        try {
            const response = await this.restClient.get("/cosmos/base/tendermint/v1beta1/blocks/latest");
            return response.data;
        } catch (error) {
            console.error("Error fetching latest block:", error);
            throw error;
        }
    }

    /**
     * Get multiple blocks starting from a specific height
     */
    async getBlocks(startHeight: number, count: number = 10): Promise<any[]> {
        const blocks = [];
        const currentHeight = await this.getHeight();
        const endHeight = Math.min(startHeight + count - 1, currentHeight);

        for (let height = startHeight; height <= endHeight; height++) {
            try {
                const block = await this.getBlock(height);
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
    async getLatestBlocks(count: number = 10): Promise<any[]> {
        const currentHeight = await this.getHeight();
        const startHeight = Math.max(1, currentHeight - count + 1);
        return await this.getBlocks(startHeight, count);
    }

    /**
     * Get game state via REST API
     */
    async getGameState(gameId: string): Promise<any> {
        try {
            const response = await this.restClient.get(`/block52/pokerchain/poker/v1/game_state/${gameId}`);

            if (response.data.game_state) {
                return JSON.parse(response.data.game_state);
            }
            return null;
        } catch (error) {
            console.error("Error fetching game state:", error);
            throw error;
        }
    }

    /**
     * Get game info via REST API
     */
    async getGame(gameId: string): Promise<any> {
        try {
            const response = await this.restClient.get(`/block52/pokerchain/poker/v1/game/${gameId}`);

            if (response.data.game) {
                return JSON.parse(response.data.game);
            }
            return null;
        } catch (error) {
            console.error("Error fetching game:", error);
            throw error;
        }
    }

    /**
     * Get legal actions for a game via REST API
     */
    async getLegalActions(gameId: string, playerAddress?: string): Promise<any> {
        try {
            const url = playerAddress
                ? `/block52/pokerchain/poker/v1/legal_actions/${gameId}/${playerAddress}`
                : `/block52/pokerchain/poker/v1/legal_actions/${gameId}`;
            const response = await this.restClient.get(url);

            if (response.data.actions) {
                return JSON.parse(response.data.actions);
            }
            return [];
        } catch (error) {
            console.error("Error fetching legal actions:", error);
            throw error;
        }
    }

    /**
     * List all games via REST API
     */
    async listGames(): Promise<any[]> {
        try {
            console.log("📡 [CosmosClient] Making REST API call to list_games...");
            console.log("   URL:", `${this.config.restEndpoint}/block52/pokerchain/poker/v1/list_games`);

            const response = await this.restClient.get(`/block52/pokerchain/poker/v1/list_games`);

            console.log("📥 [CosmosClient] Raw response:", response.data);
            console.log("   Status:", response.status);
            console.log("   Games string:", response.data.games);

            if (response.data.games) {
                const parsed = JSON.parse(response.data.games);
                console.log("✅ [CosmosClient] Parsed games:", parsed);
                return parsed;
            }

            console.log("⚠️ [CosmosClient] No games field in response, returning empty array");
            return [];
        } catch (error: any) {
            console.error("❌ [CosmosClient] Error listing games:");
            console.error("   Message:", error.message);
            console.error("   Response status:", error.response?.status);
            console.error("   Response data:", error.response?.data);
            console.error("   Full error:", error);
            throw error;
        }
    }

    /**
     * Find games (alias for listGames - matches IClient interface)
     * @param min Optional minimum players filter
     * @param max Optional maximum players filter
     */
    async findGames(min?: number, max?: number): Promise<any[]> {
        try {
            console.log("🔍 [CosmosClient] findGames called with filters:", { min, max });
            const allGames = await this.listGames();
            console.log("📊 [CosmosClient] Total games before filtering:", allGames.length);

            // Apply filters if provided
            if (min !== undefined || max !== undefined) {
                const filtered = allGames.filter(game => {
                    const playerCount = game.current_players || 0;
                    const matchesMin = min === undefined || playerCount >= min;
                    const matchesMax = max === undefined || playerCount <= max;
                    console.log(`   Game ${game.id || game.game_id}: ${playerCount} players, min=${matchesMin}, max=${matchesMax}`);
                    return matchesMin && matchesMax;
                });
                console.log("✅ [CosmosClient] Filtered games:", filtered.length);
                return filtered;
            }

            console.log("✅ [CosmosClient] Returning all games (no filter):", allGames.length);
            return allGames;
        } catch (error) {
            console.error("❌ [CosmosClient] Error finding games:", error);
            throw error;
        }
    }

    /**
     * Get player's games via REST API
     */
    async getPlayerGames(player: string): Promise<any[]> {
        try {
            const response = await this.restClient.get(`/block52/pokerchain/poker/v1/player_games/${player}`);

            if (response.data.games) {
                return JSON.parse(response.data.games);
            }
            return [];
        } catch (error) {
            console.error("Error fetching player games:", error);
            return [];
        }
    }

    /**
     * Get b52USDC balance for an address via REST API
     */
    async getB52USDCBalance(address: string): Promise<bigint> {
        return this.getBalance(address, "b52USDC");
    }

    /**
     * Convert b52usdc (micro USDC) to USDC display format
     */
    b52usdcToUsdc(b52usdcAmount: bigint): number {
        return Number(b52usdcAmount) / Math.pow(10, COSMOS_CONSTANTS.USDC_DECIMALS);
    }

    /**
     * Convert USDC to b52usdc (micro USDC) format
     */
    usdcToB52usdc(usdcAmount: number): bigint {
        return BigInt(Math.floor(usdcAmount * Math.pow(10, COSMOS_CONSTANTS.USDC_DECIMALS)));
    }

    /**
     * Note: All transaction methods require a separate wallet implementation for signing and broadcasting
     * These methods throw errors to indicate they need wallet integration
     */

    async getWalletAddress(): Promise<string> {
        throw new Error("Wallet address retrieval not implemented in REST-only mode. Use a wallet implementation.");
    }

    async sendTokens(fromAddress: string, toAddress: string, amount: bigint, memo?: string): Promise<string> {
        throw new Error("Transaction signing not implemented in REST-only mode. Use a wallet implementation.");
    }

    async sendB52USDC(fromAddress: string, toAddress: string, amount: bigint, memo?: string): Promise<string> {
        throw new Error("Transaction signing not implemented in REST-only mode. Use a wallet implementation.");
    }

    async performAction(gameId: string, action: string, amount: bigint = 0n): Promise<string> {
        throw new Error("Transaction signing not implemented in REST-only mode. Use a wallet implementation.");
    }

    async joinGame(gameId: string, seat: number, buyInAmount: bigint): Promise<string> {
        throw new Error("Transaction signing not implemented in REST-only mode. Use a wallet implementation.");
    }

    async createGame(
        gameType: string,
        minPlayers: number,
        maxPlayers: number,
        minBuyInB52USDC: bigint,
        maxBuyInB52USDC: bigint,
        smallBlindB52USDC: bigint,
        bigBlindB52USDC: bigint,
        timeout: number
    ): Promise<string> {
        throw new Error("Transaction signing not implemented in REST-only mode. Use a wallet implementation.");
    }

    /**
     * Disconnect - no-op for REST client
     */
    async disconnect(): Promise<void> {
        // No persistent connections to close in REST-only mode
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

// Update the default configuration
export const getDefaultCosmosConfig = (domain: string = "localhost"): CosmosConfig => ({
    rpcEndpoint: `http://${domain}:26657`,
    restEndpoint: `http://${domain}:1317`,
    chainId: "pokerchain",
    prefix: "b52",
    denom: "usdc", // Use usdc as the denomination (lowercase, as stored on blockchain)
    gasPrice: "0.001usdc" // Gas price in usdc (not used in REST-only mode)
});
