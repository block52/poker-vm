import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningStargateClient, GasPrice, calculateFee } from "@cosmjs/stargate";
import { Registry, EncodeObject } from "@cosmjs/proto-signing";
import { CosmosClient, CosmosConfig, COSMOS_CONSTANTS } from "./cosmosClient";
import { msgTypes } from "./pokerchain.poker.v1/registry";
import Long from "long";

/**
 * Extended configuration for signing client
 */
export interface SigningCosmosConfig extends Omit<CosmosConfig, 'gasPrice'> {
    wallet?: DirectSecp256k1HdWallet;
    gasPrice?: string | GasPrice;
}

/**
 * Message type for creating a game
 * This should match your blockchain's message structure
 */
export interface MsgCreateGame {
    creator: string;
    gameType: string;
    minPlayers: number;
    maxPlayers: number;
    minBuyIn: string;
    maxBuyIn: string;
    smallBlind: string;
    bigBlind: string;
    timeout: number;
}

/**
 * Signing Cosmos Client that extends the read-only CosmosClient with transaction capabilities
 */
export class SigningCosmosClient extends CosmosClient {
    private wallet?: DirectSecp256k1HdWallet;
    private signingClient?: SigningStargateClient;
    private gasPrice: GasPrice;

    constructor(config: SigningCosmosConfig) {
        // Convert config to CosmosConfig for parent constructor
        const baseConfig: CosmosConfig = {
            rpcEndpoint: config.rpcEndpoint,
            restEndpoint: config.restEndpoint,
            chainId: config.chainId,
            prefix: config.prefix,
            denom: config.denom,
            gasPrice: typeof config.gasPrice === 'string' ? config.gasPrice : (config.gasPrice?.toString() || COSMOS_CONSTANTS.DEFAULT_GAS_PRICE)
        };

        super(baseConfig);
        this.wallet = config.wallet;

        // Handle gasPrice - convert string to GasPrice if needed
        if (typeof config.gasPrice === 'string') {
            this.gasPrice = GasPrice.fromString(config.gasPrice);
        } else if (config.gasPrice) {
            this.gasPrice = config.gasPrice;
        } else {
            this.gasPrice = GasPrice.fromString(COSMOS_CONSTANTS.DEFAULT_GAS_PRICE);
        }
    }

    /**
     * Initialize the signing client
     */
    private async initializeSigningClient(): Promise<void> {
        if (!this.wallet) {
            throw new Error("No wallet provided for signing");
        }

        if (this.signingClient) {
            return; // Already initialized
        }

        // Create custom registry for poker messages
        const registry = new Registry();

        // Register poker module message types
        msgTypes.forEach(([typeUrl, type]) => {
            registry.register(typeUrl, type);
        });

        this.signingClient = await SigningStargateClient.connectWithSigner(
            this.config.rpcEndpoint,
            this.wallet,
            {
                registry,
                gasPrice: this.gasPrice,
            }
        );
    }

    /**
     * Get the wallet address
     */
    async getWalletAddress(): Promise<string> {
        if (!this.wallet) {
            throw new Error("No wallet provided");
        }

        const [account] = await this.wallet.getAccounts();
        return account.address;
    }

    /**
     * Send tokens from one address to another
     */
    async sendTokens(
        fromAddress: string,
        toAddress: string,
        amount: bigint,
        denom?: string,
        memo?: string
    ): Promise<string> {
        await this.initializeSigningClient();

        if (!this.signingClient) {
            throw new Error("Failed to initialize signing client");
        }

        if (!denom) {
            denom = this.config.denom;
        }

        const coins = [{ denom, amount: amount.toString() }];
        const fee = calculateFee(100_000, this.gasPrice); // Estimate gas

        const result = await this.signingClient.sendTokens(
            fromAddress,
            toAddress,
            coins,
            fee,
            memo || ""
        );

        return result.transactionHash;
    }

    /**
     * Send B52USDC tokens
     */
    async sendB52USDC(
        fromAddress: string,
        toAddress: string,
        amount: bigint,
        memo?: string
    ): Promise<string> {
        return this.sendTokens(fromAddress, toAddress, amount, memo);
    }

    /**
     * Create a new poker game
     */
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
        await this.initializeSigningClient();

        if (!this.signingClient || !this.wallet) {
            throw new Error("Signing client not initialized");
        }

        const [account] = await this.wallet.getAccounts();
        const creator = account.address;

        // Create the message object
        const msgCreateGame: MsgCreateGame = {
            creator,
            gameType,
            minPlayers,
            maxPlayers,
            minBuyIn: minBuyInB52USDC.toString(),
            maxBuyIn: maxBuyInB52USDC.toString(),
            smallBlind: smallBlindB52USDC.toString(),
            bigBlind: bigBlindB52USDC.toString(),
            timeout
        };

        // Create the transaction message
        const msg: EncodeObject = {
            typeUrl: "/pokerchain.poker.v1.MsgCreateGame",
            value: msgCreateGame
        };

        const fee = calculateFee(200_000, this.gasPrice); // Higher gas for game creation
        const memo = "Create poker game via SDK";

        console.log("🎮 Creating game transaction:", {
            creator,
            gameType,
            minPlayers,
            maxPlayers,
            minBuyIn: minBuyInB52USDC.toString(),
            maxBuyIn: maxBuyInB52USDC.toString(),
            smallBlind: smallBlindB52USDC.toString(),
            bigBlind: bigBlindB52USDC.toString(),
            timeout
        });

        try {
            const result = await this.signingClient.signAndBroadcast(
                creator,
                [msg],
                fee,
                memo
            );

            console.log("✅ Game creation transaction successful:", result.transactionHash);
            return result.transactionHash;
        } catch (error) {
            console.error("❌ Game creation failed:", error);
            throw error;
        }
    }

    /**
     * Join a poker game
     */
    async joinGame(gameId: string, seat: number, buyInAmount: bigint): Promise<string> {
        await this.initializeSigningClient();

        if (!this.signingClient || !this.wallet) {
            throw new Error("Signing client not initialized");
        }

        const [account] = await this.wallet.getAccounts();
        const player = account.address;

        // Create the message object with Long type conversions for protobuf encoding
        const msgJoinGame = {
            player,
            gameId,
            seat: Long.fromNumber(seat, true),
            buyInAmount: Long.fromString(buyInAmount.toString(), true)
        };

        // Create the transaction message
        const msg: EncodeObject = {
            typeUrl: "/pokerchain.poker.v1.MsgJoinGame",
            value: msgJoinGame
        };

        const fee = calculateFee(150_000, this.gasPrice);
        const memo = "Join poker game via SDK";

        console.log("🪑 Joining game:", { gameId, seat, buyInAmount: buyInAmount.toString() });

        try {
            const result = await this.signingClient.signAndBroadcast(
                player,
                [msg],
                fee,
                memo
            );

            console.log("✅ Join game transaction successful:", result.transactionHash);
            return result.transactionHash;
        } catch (error) {
            console.error("❌ Join game failed:", error);
            throw error;
        }
    }

    /**
     * Perform a game action (fold, call, raise, etc.)
     * Automatically tracks action index like the original client
     */
    async performAction(gameId: string, action: string, amount: bigint = 0n): Promise<string> {
        await this.initializeSigningClient();

        if (!this.signingClient || !this.wallet) {
            throw new Error("Signing client not initialized");
        }

        const [account] = await this.wallet.getAccounts();
        const player = account.address;

        // Get next action index - follows original client pattern
        // Check previousActions array first, fallback to actionCount
        const nextActionIndex = await this.getNextActionIndex(gameId);

        // Create the message object
        const msgPerformAction = {
            player,
            gameId,
            action,
            amount: Long.fromString(amount.toString(), true)
        };

        // Create the transaction message
        const msg: EncodeObject = {
            typeUrl: "/pokerchain.poker.v1.MsgPerformAction",
            value: msgPerformAction
        };

        const fee = calculateFee(100_000, this.gasPrice);
        const memo = `Poker action: ${action}`;

        console.log("🃏 Performing action:", {
            gameId,
            action,
            amount: amount.toString(),
            actionIndex: nextActionIndex
        });

        try {
            const result = await this.signingClient.signAndBroadcast(
                player,
                [msg],
                fee,
                memo
            );

            console.log("✅ Action transaction successful:", result.transactionHash);
            return result.transactionHash;
        } catch (error) {
            console.error("❌ Action failed:", error);
            throw error;
        }
    }

    /**
     * Get next action index for a game - matches original client pattern
     * Checks previousActions array first, falls back to actionCount + 1
     */
    private async getNextActionIndex(gameId: string): Promise<number> {
        try {
            const gameState = await this.queryGameState(gameId);

            if (!gameState) {
                throw new Error("Game state not found");
            }

            let nextIndex: number;

            // Match original client logic exactly
            if (!gameState.previousActions || gameState.previousActions.length === 0) {
                nextIndex = gameState.actionCount + 1;
                console.log("📊 Action Index Calculation:", {
                    gameId: gameId.substring(0, 20) + "...",
                    method: "actionCount + 1",
                    actionCount: gameState.actionCount,
                    nextIndex,
                    previousActionsLength: 0
                });
            } else {
                const lastAction = gameState.previousActions[gameState.previousActions.length - 1];
                nextIndex = lastAction.index + 1;
                console.log("📊 Action Index Calculation:", {
                    gameId: gameId.substring(0, 20) + "...",
                    method: "lastAction.index + 1",
                    lastActionIndex: lastAction.index,
                    nextIndex,
                    previousActionsLength: gameState.previousActions.length,
                    lastAction: {
                        action: lastAction.action,
                        player: lastAction.playerId?.substring(0, 10) + "...",
                        round: lastAction.round
                    }
                });
            }

            return nextIndex;
        } catch (error) {
            console.error(`Error getting next action index: ${(error as Error).message}`);
            throw error; // Rethrow to be handled by caller
        }
    }

    /**
     * Query all games from the blockchain
     */
    async queryGames(): Promise<any[]> {
        try {
            const response = await fetch(`${this.config.restEndpoint}/pokerchain/poker/v1/games`);

            if (!response.ok) {
                throw new Error(`Failed to query games: ${response.statusText}`);
            }

            const data = await response.json();

            // The response has games as a JSON string, need to parse it
            if (data.games) {
                return JSON.parse(data.games);
            }

            return [];
        } catch (error) {
            console.error("❌ queryGames() failed:", error);
            throw error;
        }
    }

    /**
     * Query game state for a specific game
     */
    async queryGameState(gameId: string): Promise<any> {
        try {
            const response = await fetch(
                `${this.config.restEndpoint}/pokerchain/poker/v1/game_state?game_id=${encodeURIComponent(gameId)}`
            );

            if (!response.ok) {
                throw new Error(`Failed to query game state: ${response.statusText}`);
            }

            const data = await response.json();

            // The response has game_state as a JSON string, need to parse it
            if (data.game_state) {
                return JSON.parse(data.game_state);
            }

            return null;
        } catch (error) {
            console.error("❌ queryGameState() failed:", error);
            throw error;
        }
    }

    /**
     * Disconnect the signing client
     */
    async disconnect(): Promise<void> {
        if (this.signingClient) {
            this.signingClient.disconnect();
            this.signingClient = undefined;
        }
    }

    /**
     * Set a new wallet for signing
     */
    setWallet(wallet: DirectSecp256k1HdWallet): void {
        this.wallet = wallet;
        // Reset signing client to reinitialize with new wallet
        if (this.signingClient) {
            this.signingClient.disconnect();
            this.signingClient = undefined;
        }
    }

    /**
     * Get the current wallet
     */
    getWallet(): DirectSecp256k1HdWallet | undefined {
        return this.wallet;
    }
}

/**
 * Create a signing client with a wallet
 */
export async function createSigningCosmosClient(
    config: CosmosConfig,
    wallet: DirectSecp256k1HdWallet
): Promise<SigningCosmosClient> {
    const signingConfig: SigningCosmosConfig = {
        ...config,
        wallet,
        gasPrice: GasPrice.fromString(config.gasPrice || COSMOS_CONSTANTS.DEFAULT_GAS_PRICE)
    };

    return new SigningCosmosClient(signingConfig);
}

/**
 * Create a signing client from a mnemonic
 */
export async function createSigningClientFromMnemonic(
    config: CosmosConfig,
    mnemonic: string
): Promise<SigningCosmosClient> {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: config.prefix
    });

    return createSigningCosmosClient(config, wallet);
}