import axios, { AxiosInstance } from "axios";
import { COSMOS_CONSTANTS, EquityResult, EquityResponse } from "./sdkTypes";
import { IClient } from "./IClient";
import type { LegalActionDTO, TexasHoldemStateDTO, GameOptionsResponse, GameListItem } from "./types/game";

export class CosmosClient implements IClient {
    protected readonly config: any;
    private readonly restClient: AxiosInstance;

    constructor(config: any) {
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
            return response.data;
        } catch (error) {
            console.error("Error fetching account:", error);
            throw error;
        }
    }

    /**
     * Get all coin balances for an address via REST API
     */
    async getAllBalances(address: string): Promise<any[]> {
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
            return response.data;
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
        const blocks: any[] = [];
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
    async getGameState(gameId: string): Promise<TexasHoldemStateDTO> {
        try {
            const response = await this.restClient.get(`/block52/pokerchain/poker/v1/game_state/${gameId}`);

            if (response.data) {
                return response.data;
            }
            return {} as any;
        } catch (error) {
            console.error("Error fetching game state:", error);
            throw error;
        }
    }

    /**
     * Get game info via REST API
     */
    async getGame(gameId: string): Promise<GameOptionsResponse> {
        try {
            const response = await this.restClient.get(`/block52/pokerchain/poker/v1/game/${gameId}`);

            if (response.data) {
                return response.data;
            }
            return {} as any;
        } catch (error) {
            console.error("Error fetching game:", error);
            throw error;
        }
    }

    /**
     * Get legal actions for a game via REST API
     */
    async getLegalActions(gameId: string, playerAddress?: string): Promise<LegalActionDTO[]> {
        try {
            const url = playerAddress
                ? `/block52/pokerchain/poker/v1/legal_actions/${gameId}/${playerAddress}`
                : `/block52/pokerchain/poker/v1/legal_actions/${gameId}`;
            const response = await this.restClient.get(url);

            if (response.data) {
                return response.data;
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
    async listGames(): Promise<GameListItem[]> {
        try {
            console.log("📡 [CosmosClient] Making REST API call to list_games...");
            console.log("   URL:", `${this.config.restEndpoint}/block52/pokerchain/poker/v1/list_games`);

            const response = await this.restClient.get(`/block52/pokerchain/poker/v1/list_games`);

            console.log("📥 [CosmosClient] Raw response:", response.data);
            console.log("   Status:", response.status);
            console.log("   Games string:", response.data.games);

            if (response.data.games && response.data.games !== "null") {
                const parsed = JSON.parse(response.data.games);
                console.log("✅ [CosmosClient] Parsed games:", parsed);
                return parsed || [];
            }

            console.log("⚠️ [CosmosClient] No games or games='null', returning empty array");
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
    async findGames(min?: number, max?: number): Promise<GameListItem[]> {
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
    async getPlayerGames(player: string): Promise<GameListItem[]> {
        try {
            // Use axios generic for type safety, but still need to parse the games string
            const response = await this.restClient.get(`/block52/pokerchain/poker/v1/player_games/${player}`);

            if (response.data) {
                return response.data;
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
     * Initiate a withdrawal request via REST API
     */
    async initiateWithdrawal(baseAddress: string, amount: bigint): Promise<string> {
        throw new Error("Transaction signing not implemented in REST-only mode. Use a wallet implementation.");
    }

    /**
     * List withdrawal requests via REST API
     */
    async listWithdrawalRequests(cosmosAddress?: string): Promise<any[]> {
        try {
            const url = cosmosAddress
                ? `/block52/pokerchain/poker/v1/list_withdrawal_requests?cosmos_address=${cosmosAddress}`
                : `/block52/pokerchain/poker/v1/list_withdrawal_requests`;
            const response = await this.restClient.get(url);
            return response.data.withdrawal_requests || [];
        } catch (error) {
            console.error("Error fetching withdrawal requests:", error);
            return [];
        }
    }

    /**
     * Calculate equity for multiple hands using Monte Carlo simulation
     * Used when players are all-in and showing to display win percentages
     *
     * @param hands - Array of hole cards for each player, e.g., [["AS", "KS"], ["QH", "QD"]]
     * @param board - Community cards (0-5 cards), e.g., ["AH", "7C", "2D"]
     * @param dead - Optional dead/mucked cards
     * @param simulations - Number of Monte Carlo simulations (default 10000)
     * @returns Array of equity results for each hand
     */
    async calculateEquity(
        hands: string[][],
        board: string[] = [],
        dead: string[] = [],
        simulations: number = 10000
    ): Promise<EquityResult[]> {
        try {
            console.log("🎲 Calculating equity:", {
                hands,
                board,
                dead,
                simulations
            });

            const response = await this.restClient.post<EquityResponse>(
                "/block52/pokerchain/poker/v1/equity",
                {
                    hands: hands.map(cards => ({ cards })),
                    board,
                    dead,
                    simulations
                }
            );

            console.log("✅ Equity calculation complete:", {
                stage: response.data.stage,
                duration_ms: response.data.duration_ms,
                hands_per_sec: response.data.hands_per_sec
            });

            return response.data.results;
        } catch (error) {
            console.error("❌ Error calculating equity:", error);
            throw error;
        }
    }

    /**
     * Calculate equity and return full response including metadata
     */
    async calculateEquityFull(
        hands: string[][],
        board: string[] = [],
        dead: string[] = [],
        simulations: number = 10000
    ): Promise<EquityResponse> {
        try {
            const response = await this.restClient.post<EquityResponse>(
                "/block52/pokerchain/poker/v1/equity",
                {
                    hands: hands.map(cards => ({ cards })),
                    board,
                    dead,
                    simulations
                }
            );

            return response.data;
        } catch (error) {
            console.error("❌ Error calculating equity:", error);
            throw error;
        }
    }

    /**
     * Disconnect - no-op for REST client
     */
    async disconnect(): Promise<void> {
        // No persistent connections to close in REST-only mode
    }
}

// Singleton instance
let cosmosClientInstance: CosmosClient;

export const getCosmosClient = (config?: any): CosmosClient => {
    if (!cosmosClientInstance && config) {
        cosmosClientInstance = new CosmosClient(config);
    }

    if (!cosmosClientInstance) {
        throw new Error("Cosmos client not initialized. Provide config on first call.");
    }

    return cosmosClientInstance;
};

export const initializeCosmosClient = (config: any): CosmosClient => {
    cosmosClientInstance = new CosmosClient(config);
    return cosmosClientInstance;
};

// Update the default configuration
export const getDefaultCosmosConfig = (domain: string = "localhost"): any => ({
    rpcEndpoint: `https://${domain}/rpc`,
    restEndpoint: `https://${domain}`,
    chainId: "pokerchain",
    prefix: "b52",
    denom: "stake", // Use stake as the denomination (lowercase, as stored on blockchain)
    gasPrice: "0.0stake" // Gas price in stake (not used in REST-only mode)
});

// Re-export types and constants for convenience
export {
    COSMOS_CONSTANTS,
    type CosmosConfig,
    type Coin,
    type CustomAccountResponse,
    type TxResponse,
    type BlockResponse,
    type GameState,
    type Game,
    type LegalAction,
    type GameStateResponse,
    type GameResponse,
    type ListGamesResponse,
    type PlayerGamesResponse,
    type EquityHand,
    type EquityResult,
    type EquityRequest,
    type EquityResponse
} from "./sdkTypes";
