import { StargateClient, SigningStargateClient, GasPrice, Coin, defaultRegistryTypes } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { stringToPath } from "@cosmjs/crypto";
import { Registry, GeneratedType } from "@cosmjs/proto-signing";
import { Writer, Reader } from "protobufjs/minimal";
import axios, { AxiosInstance } from "axios";

// Cosmos blockchain constants (matches pokerchain/x/poker/types/types.go)
export const COSMOS_CONSTANTS = {
    CHAIN_ID: "pokerchain",
    ADDRESS_PREFIX: "b52",
    TOKEN_DENOM: "uusdc",
    USDC_DECIMALS: 6, // 1 USDC = 1,000,000 uusdc
    GAME_CREATION_COST: 1, // 1 uusdc = 0.000001 USDC
    DEFAULT_GAS_PRICE: "0.025uusdc"
} as const;

// Define the MsgCreateGame interface to match the protobuf structure
export interface MsgCreateGame {
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

// Create a simple encoder for MsgCreateGame
const MsgCreateGameType: GeneratedType = {
    encode(message: MsgCreateGame, writer: Writer = Writer.create()): Writer {
        if (message.creator !== "") {
            writer.uint32(10).string(message.creator);
        }
        if (message.minBuyIn !== "0") {
            writer.uint32(16).uint64(message.minBuyIn);
        }
        if (message.maxBuyIn !== "0") {
            writer.uint32(24).uint64(message.maxBuyIn);
        }
        if (message.minPlayers !== 0) {
            writer.uint32(32).int64(message.minPlayers);
        }
        if (message.maxPlayers !== 0) {
            writer.uint32(40).int64(message.maxPlayers);
        }
        if (message.smallBlind !== "0") {
            writer.uint32(48).uint64(message.smallBlind);
        }
        if (message.bigBlind !== "0") {
            writer.uint32(56).uint64(message.bigBlind);
        }
        if (message.timeout !== 0) {
            writer.uint32(64).int64(message.timeout);
        }
        if (message.gameType !== "") {
            writer.uint32(74).string(message.gameType);
        }
        return writer;
    },
    decode(input: Uint8Array | Reader, length?: number): MsgCreateGame {
        throw new Error("MsgCreateGame decode not implemented");
    },
    fromPartial(object: Partial<MsgCreateGame>): MsgCreateGame {
        return {
            creator: object.creator || "",
            minBuyIn: object.minBuyIn || "0",
            maxBuyIn: object.maxBuyIn || "0",
            minPlayers: object.minPlayers || 0,
            maxPlayers: object.maxPlayers || 0,
            smallBlind: object.smallBlind || "0",
            bigBlind: object.bigBlind || "0",
            timeout: object.timeout || 0,
            gameType: object.gameType || "",
        };
    },
};

// Create a custom registry with poker module types
function createPokerRegistry(): Registry {
    const registry = new Registry([...defaultRegistryTypes]);
    registry.register("/pokerchain.poker.v1.MsgCreateGame", MsgCreateGameType);
    return registry;
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
    private config: CosmosConfig;
    private client?: StargateClient;
    private signingClient?: SigningStargateClient;
    private wallet?: DirectSecp256k1HdWallet;
    private restClient: AxiosInstance;

    constructor(config: CosmosConfig) {
        this.config = config;

        // Initialize REST client for API calls
        this.restClient = axios.create({
            baseURL: config.restEndpoint,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
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
            // Create custom registry with poker module types
            const registry = createPokerRegistry();

            this.signingClient = await SigningStargateClient.connectWithSigner(
                this.config.rpcEndpoint,
                this.wallet,
                {
                    gasPrice: GasPrice.fromString(this.config.gasPrice),
                    registry: registry
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
     * Get a specific block by height via REST API
     */
    async getBlock(height: number) {
        try {
            const response = await this.restClient.get(
                `/cosmos/base/tendermint/v1beta1/blocks/${height}`
            );
            return response.data;
        } catch (error) {
            console.error(`Error fetching block at height ${height}:`, error);
            throw error;
        }
    }

    /**
     * Get the latest block via REST API
     */
    async getLatestBlock() {
        try {
            const response = await this.restClient.get(
                "/cosmos/base/tendermint/v1beta1/blocks/latest"
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching latest block:", error);
            throw error;
        }
    }

    /**
     * Get multiple blocks starting from a specific height
     */
    async getBlocks(startHeight: number, count: number = 10) {
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
    async getLatestBlocks(count: number = 10) {
        const currentHeight = await this.getHeight();
        const startHeight = Math.max(1, currentHeight - count + 1);
        return await this.getBlocks(startHeight, count);
    }

    /**
     * Fetch game state from Cosmos REST API
     */
    async getGameState(gameId: string): Promise<any> {
        try {
            const response = await this.restClient.get<GameStateResponse>(
                `/block52/pokerchain/poker/v1/game_state/${gameId}`
            );

            // Parse the JSON string response
            if (response.data.game_state) {
                return JSON.parse(response.data.game_state);
            }

            throw new Error("No game state found in response");
        } catch (error) {
            console.error("Error fetching game state:", error);
            throw error;
        }
    }

    /**
     * Fetch game info from Cosmos REST API
     */
    async getGame(gameId: string): Promise<any> {
        try {
            const response = await this.restClient.get<GameResponse>(
                `/block52/pokerchain/poker/v1/game/${gameId}`
            );

            if (response.data.game) {
                return JSON.parse(response.data.game);
            }

            throw new Error("No game found in response");
        } catch (error) {
            console.error("Error fetching game:", error);
            throw error;
        }
    }

    /**
     * Fetch legal actions for a player
     */
    async getLegalActions(gameId: string, playerAddress: string): Promise<any> {
        try {
            const response = await this.restClient.get<LegalActionsResponse>(
                `/block52/pokerchain/poker/v1/legal_actions/${gameId}/${playerAddress}`
            );

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
     * List all games
     */
    async listGames(): Promise<any[]> {
        try {
            console.log("📡 [CosmosClient] Making REST API call to list_games...");
            console.log("   URL:", `${this.config.restEndpoint}/block52/pokerchain/poker/v1/list_games`);

            const response = await this.restClient.get<ListGamesResponse>(
                `/block52/pokerchain/poker/v1/list_games`
            );

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
     * Get games for a specific player
     */
    async getPlayerGames(playerAddress: string): Promise<any[]> {
        try {
            const response = await this.restClient.get<PlayerGamesResponse>(
                `/block52/pokerchain/poker/v1/player_games/${playerAddress}`
            );

            if (response.data.games) {
                return JSON.parse(response.data.games);
            }

            return [];
        } catch (error) {
            console.error("Error fetching player games:", error);
            throw error;
        }
    }

    /**
     * Perform a poker action (transaction)
     */
    async performAction(
        gameId: string,
        action: string,
        amount: bigint = 0n
    ): Promise<string> {
        await this.initSigningClient();
        if (!this.signingClient) throw new Error("Signing client not initialized");

        const fromAddress = await this.getWalletAddress();

        // Create the message for performing action
        const msg = {
            typeUrl: "/pokerchain.poker.v1.MsgPerformAction",
            value: {
                creator: fromAddress,
                gameId: gameId,
                action: action,
                amount: amount.toString(),
            },
        };

        const result = await this.signingClient.signAndBroadcast(
            fromAddress,
            [msg],
            "auto"
        );

        return result.transactionHash;
    }

    /**
     * Get b52USDC balance for an address
     */
    async getB52USDCBalance(address: string): Promise<bigint> {
        await this.initClient();
        if (!this.client) throw new Error("Client not initialized");

        const balance = await this.client.getBalance(address, "b52USDC");
        return BigInt(balance.amount);
    }

    /**
     * Send b52USDC tokens from one account to another
     */
    async sendB52USDC(
        fromAddress: string,
        toAddress: string,
        amount: bigint,
        memo?: string
    ): Promise<string> {
        await this.initSigningClient();
        if (!this.signingClient) throw new Error("Signing client not initialized");

        const coin: Coin = {
            denom: "b52USDC",
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
     * Join a game with b52USDC buy-in (transaction)
     */
    async joinGame(
        gameId: string,
        seat: number,
        buyInAmount: bigint // Amount in b52USDC
    ): Promise<string> {
        await this.initSigningClient();
        if (!this.signingClient) throw new Error("Signing client not initialized");

        const fromAddress = await this.getWalletAddress();

        const msg = {
            typeUrl: "/pokerchain.poker.v1.MsgJoinGame",
            value: {
                creator: fromAddress,
                gameId: gameId,
                seat: seat.toString(),
                buyIn: buyInAmount.toString(), // b52USDC amount
            },
        };

        const result = await this.signingClient.signAndBroadcast(
            fromAddress,
            [msg],
            "auto"
        );

        return result.transactionHash;
    }

    /**
     * Create a new game with b52USDC denominated blinds and buy-ins
     */
    async createGame(
        gameType: string,
        minPlayers: number,
        maxPlayers: number,
        minBuyInB52USDC: bigint,  // Minimum buy-in in b52USDC
        maxBuyInB52USDC: bigint,  // Maximum buy-in in b52USDC
        smallBlindB52USDC: bigint, // Small blind in b52USDC
        bigBlindB52USDC: bigint,   // Big blind in b52USDC
        timeout: number
    ): Promise<string> {
        await this.initSigningClient();
        if (!this.signingClient) throw new Error("Signing client not initialized");

        const fromAddress = await this.getWalletAddress();

        const msg = {
            typeUrl: "/pokerchain.poker.v1.MsgCreateGame",
            value: {
                creator: fromAddress,
                gameType: gameType,
                minPlayers: minPlayers.toString(),
                maxPlayers: maxPlayers.toString(),
                minBuyIn: minBuyInB52USDC.toString(),
                maxBuyIn: maxBuyInB52USDC.toString(),
                smallBlind: smallBlindB52USDC.toString(),
                bigBlind: bigBlindB52USDC.toString(),
                timeout: timeout.toString(),
            },
        };

        const result = await this.signingClient.signAndBroadcast(
            fromAddress,
            [msg],
            "auto"
        );

        return result.transactionHash;
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
export const getDefaultCosmosConfig = (): CosmosConfig => ({
    rpcEndpoint: "http://localhost:26657",
    restEndpoint: "http://localhost:1317",
    chainId: "pokerchain",
    prefix: "b52",
    denom: "b52USDC", // Use b52USDC as the denomination
    gasPrice: "0.001b52USDC", // Gas price in b52USDC
});