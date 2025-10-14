import React, { createContext, useEffect, useState, useCallback, ReactNode } from "react";
import { CosmosClient } from "@bitcoinbrisbane/block52";
import { getCosmosMnemonic, setCosmosMnemonic, setCosmosAddress, getCosmosAddress, clearCosmosData, getCosmosUIConfig } from "../utils/cosmosUtils";

/**
 * ARCHITECTURE NOTE - Real-Time Game State Subscription Flow:
 *
 * This CosmosContext handles wallet management and blockchain transactions.
 * For REAL-TIME game state updates, the architecture is:
 *
 * 1. UI creates/joins game → CosmosClient.createGame() → Cosmos blockchain (MsgCreateGame)
 * 2. Cosmos blockchain processes transaction and commits to block
 * 3. PVM server polls Cosmos REST API for new blocks/transactions
 *    (e.g., GET /cosmos/base/tendermint/v1beta1/blocks/latest every 2 seconds)
 * 4. When PVM detects game transaction, it queries full game state from Cosmos via REST API
 *    (REST is simpler than gRPC - no protobuf complexity in PVM)
 * 5. PVM broadcasts game state to ALL connected WebSocket clients
 * 6. UI GameStateContext receives updates via WebSocket connection (wss://node1.block52.xyz)
 *
 * Key connections:
 * - PVM ← (polls via REST) ← Cosmos blockchain
 * - UI ← (WebSocket) ← PVM server (UNCHANGED - existing GameStateContext works as-is!)
 *
 * This hybrid approach keeps:
 * - Cosmos blockchain as source of truth for game state and transactions
 * - PVM as real-time relay/distribution layer via WebSocket
 * - Existing GameStateContext.tsx needs ZERO changes
 * - Simple REST API polling in PVM (no complex Tendermint RPC subscriptions)
 *
 * See: /poker-vm/WORKING_CHECKLIST.md "OPTION 2: Custom WebSocket Server + Cosmos Subscriber (Hybrid)"
 */

interface CosmosBalance {
    denom: string;
    amount: string;
}

interface CosmosProviderState {
    // Cosmos client and account data
    cosmosClient: CosmosClient | null;
    address: string | null;
    balance: CosmosBalance[];

    // Connection state
    isConnected: boolean;
    isLoading: boolean;
    error: Error | null;

    // Wallet management
    importSeedPhrase: (mnemonic: string) => Promise<void>;
    clearWallet: () => void;
    refreshBalance: () => Promise<void>;
    sendTokens: (recipientAddress: string, amount: string) => Promise<string>;

    // Game actions
    performPokerAction: (gameId: string, action: string, amount?: bigint) => Promise<string>;
    joinGame: (gameId: string, seat: number, buyInAmount: bigint) => Promise<string>;
    createGame: (
        gameType: string,
        minPlayers: number,
        maxPlayers: number,
        minBuyInB52USDC: bigint,
        maxBuyInB52USDC: bigint,
        smallBlindB52USDC: bigint,
        bigBlindB52USDC: bigint,
        timeout: number
    ) => Promise<string>;
    getGameState: (gameId: string) => Promise<any>;
    getLegalActions: (gameId: string, playerAddress: string) => Promise<any>;
}

const CosmosContext = createContext<CosmosProviderState | null>(null);

export { CosmosContext };

interface CosmosProviderProps {
    children: ReactNode;
}

export const CosmosProvider: React.FC<CosmosProviderProps> = ({ children }) => {
    const [cosmosClient, setCosmosClient] = useState<CosmosClient | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<CosmosBalance[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Initialize cosmos client
    const initializeClient = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const mnemonic = getCosmosMnemonic();
            if (!mnemonic) {
                setIsConnected(false);
                setCosmosClient(null);
                setAddress(null);
                setBalance([]);
                return;
            }

            // Create client (REST-only, no initialization needed)
            const config = getCosmosUIConfig();
            const client = new CosmosClient({ ...config, mnemonic });

            // Note: REST-only client doesn't support wallet operations
            // We'll need to implement address derivation from mnemonic locally
            // For now, we'll show an error that transaction signing is not supported

            setCosmosClient(client);
            setIsConnected(true);

            console.warn("🚧 REST-only mode: Transaction signing not supported. Read operations only.");

            // Get initial balance (if we have a stored address)
            const storedAddress = getCosmosAddress();
            if (storedAddress) {
                setAddress(storedAddress);
                setCosmosAddress(storedAddress);
                const balances = await client.getAllBalances(storedAddress);
                setBalance(balances);
            }
        } catch (err) {
            console.error("Failed to initialize Cosmos client:", err);
            setError(err instanceof Error ? err : new Error("Failed to initialize Cosmos client"));
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Refresh balance
    const refreshBalance = useCallback(async () => {
        if (!cosmosClient || !address) return;

        try {
            const balances = await cosmosClient.getAllBalances(address);
            setBalance(balances);
        } catch (err) {
            console.error("Failed to refresh balance:", err);
            setError(err instanceof Error ? err : new Error("Failed to refresh balance"));
        }
    }, [cosmosClient, address]);

    // Import seed phrase
    const importSeedPhrase = useCallback(
        async (mnemonic: string) => {
            try {
                setIsLoading(true);
                setError(null);

                // Store mnemonic
                setCosmosMnemonic(mnemonic);

                // Reinitialize client
                await initializeClient();
            } catch (err) {
                console.error("Failed to import seed phrase:", err);
                setError(err instanceof Error ? err : new Error("Failed to import seed phrase"));
                clearCosmosData();
            } finally {
                setIsLoading(false);
            }
        },
        [initializeClient]
    );

    // Clear wallet
    const clearWallet = useCallback(() => {
        clearCosmosData();
        setCosmosClient(null);
        setAddress(null);
        setBalance([]);
        setIsConnected(false);
        setError(null);
    }, []);

    // Send tokens
    const sendTokens = useCallback(
        async (recipientAddress: string, amount: string): Promise<string> => {
            if (!cosmosClient || !address) {
                throw new Error("Cosmos wallet not initialized");
            }

            try {
                const txHash = await cosmosClient.sendB52USDC(address, recipientAddress, BigInt(amount));

                // Refresh balance after successful transaction
                await refreshBalance();

                return txHash;
            } catch (err) {
                console.error("Failed to send tokens:", err);
                throw err instanceof Error ? err : new Error("Failed to send tokens");
            }
        },
        [cosmosClient, address, refreshBalance]
    );

    // Perform poker action
    const performPokerAction = useCallback(
        async (gameId: string, action: string, amount: bigint = 0n): Promise<string> => {
            if (!cosmosClient) {
                throw new Error("Cosmos client not initialized");
            }

            try {
                const txHash = await cosmosClient.performAction(gameId, action, amount);

                // Refresh balance after action
                await refreshBalance();

                return txHash;
            } catch (err) {
                console.error("Failed to perform poker action:", err);
                throw err instanceof Error ? err : new Error("Failed to perform poker action");
            }
        },
        [cosmosClient, refreshBalance]
    );

    // Join game
    const joinGame = useCallback(
        async (gameId: string, seat: number, buyInAmount: bigint): Promise<string> => {
            if (!cosmosClient) {
                throw new Error("Cosmos client not initialized");
            }

            try {
                const txHash = await cosmosClient.joinGame(gameId, seat, buyInAmount);

                // Refresh balance after joining
                await refreshBalance();

                return txHash;
            } catch (err) {
                console.error("Failed to join game:", err);
                throw err instanceof Error ? err : new Error("Failed to join game");
            }
        },
        [cosmosClient, refreshBalance]
    );

    // Create a new game
    const createGame = useCallback(
        async (
            gameType: string,
            minPlayers: number,
            maxPlayers: number,
            minBuyInB52USDC: bigint,
            maxBuyInB52USDC: bigint,
            smallBlindB52USDC: bigint,
            bigBlindB52USDC: bigint,
            timeout: number
        ): Promise<string> => {
            if (!cosmosClient) {
                throw new Error("Cosmos client not initialized");
            }

            try {
                const txHash = await cosmosClient.createGame(
                    gameType,
                    minPlayers,
                    maxPlayers,
                    minBuyInB52USDC,
                    maxBuyInB52USDC,
                    smallBlindB52USDC,
                    bigBlindB52USDC,
                    timeout
                );

                // Refresh balance after creating game
                await refreshBalance();

                return txHash;
            } catch (err) {
                console.error("Error creating game:", err);
                throw err instanceof Error ? err : new Error("Failed to create game");
            }
        },
        [cosmosClient, refreshBalance]
    );

    // Get game state
    const getGameState = useCallback(
        async (gameId: string): Promise<any> => {
            if (!cosmosClient) {
                throw new Error("Cosmos client not initialized");
            }

            return await cosmosClient.getGameState(gameId);
        },
        [cosmosClient]
    );

    // Get legal actions
    const getLegalActions = useCallback(
        async (gameId: string, playerAddress: string): Promise<any> => {
            if (!cosmosClient) {
                throw new Error("Cosmos client not initialized");
            }

            return await cosmosClient.getLegalActions(gameId, playerAddress);
        },
        [cosmosClient]
    );

    // Initialize on mount
    useEffect(() => {
        initializeClient();
    }, [initializeClient]);

    const value: CosmosProviderState = {
        cosmosClient,
        address,
        balance,
        isConnected,
        isLoading,
        error,
        importSeedPhrase,
        clearWallet,
        refreshBalance,
        sendTokens,
        performPokerAction,
        joinGame,
        createGame,
        getGameState,
        getLegalActions
    };

    return <CosmosContext.Provider value={value}>{children}</CosmosContext.Provider>;
};
