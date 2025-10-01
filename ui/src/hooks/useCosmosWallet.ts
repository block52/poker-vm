import { useState, useEffect, useCallback } from "react";

import {
    CosmosClient,
    getCosmosMnemonic,
    setCosmosMnemonic,
    setCosmosAddress,
    clearCosmosData,
    createCosmosClient,
    getDefaultCosmosConfig
} from "../utils/cosmosUtils";

interface CosmosBalance {
    denom: string;
    amount: string;
}

interface CosmosWalletResult {
    // Primary cosmos account data
    address: string | null;
    balance: CosmosBalance[];

    // Cosmos client instance
    cosmosClient: CosmosClient | null;

    // Loading and error states
    isLoading: boolean;
    error: Error | null;

    // Wallet management functions
    importSeedPhrase: (mnemonic: string) => Promise<void>;
    clearWallet: () => void;

    // Helper function to refresh data
    refreshBalance: () => Promise<void>;

    // Transaction functions
    sendTokens: (recipientAddress: string, amount: string) => Promise<string>;
}

const useCosmosWallet = (): CosmosWalletResult => {
    const [address, setAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<CosmosBalance[]>([]);
    const [cosmosClient, setCosmosClient] = useState<CosmosClient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Initialize cosmos client and address from storage
    const initializeWallet = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const mnemonic = getCosmosMnemonic();
            if (!mnemonic) {
                setAddress(null);
                setCosmosClient(null);
                setBalance([]);
                return;
            }

            const client = createCosmosClient(mnemonic);
            if (!client) {
                setError(new Error("Failed to create cosmos client"));
                return;
            }

            setCosmosClient(client);

            // Initialize client and get address
            await client.initClient();
            const userAddress = await client.getWalletAddress();

            setAddress(userAddress);
            setCosmosAddress(userAddress);

            // Get balance
            const balances = await client.getAllBalances(userAddress);
            setBalance(balances);
        } catch (err) {
            console.error("Failed to initialize cosmos wallet:", err);
            setError(err instanceof Error ? err : new Error("Unknown error"));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Refresh balance
    const refreshBalance = useCallback(async () => {
        if (!cosmosClient || !address) return;

        try {
            setError(null);
            const balances = await cosmosClient.getAllBalances(address);
            setBalance(balances);
        } catch (err) {
            console.error("Failed to refresh balance:", err);
            setError(err instanceof Error ? err : new Error("Failed to refresh balance"));
        }
    }, [cosmosClient, address]);

    // Import seed phrase
    const importSeedPhrase = useCallback(async (mnemonic: string) => {
        try {
            setIsLoading(true);
            setError(null);

            // Store mnemonic
            setCosmosMnemonic(mnemonic);

            // Reinitialize wallet
            await initializeWallet();
        } catch (err) {
            console.error("Failed to import seed phrase:", err);
            setError(err instanceof Error ? err : new Error("Failed to import seed phrase"));
            // Clear invalid mnemonic
            clearCosmosData();
        } finally {
            setIsLoading(false);
        }
    }, [initializeWallet]);

    // Clear wallet
    const clearWallet = useCallback(() => {
        clearCosmosData();
        setAddress(null);
        setCosmosClient(null);
        setBalance([]);
        setError(null);
    }, []);

    // Send tokens
    const sendTokens = useCallback(async (recipientAddress: string, amount: string): Promise<string> => {
        if (!cosmosClient || !address) {
            throw new Error("Cosmos wallet not initialized");
        }

        try {
            const txHash = await cosmosClient.sendTokens(
                address,
                recipientAddress,
                BigInt(amount)
            );

            // Refresh balance after successful transaction
            await refreshBalance();

            return txHash;
        } catch (err) {
            console.error("Failed to send tokens:", err);
            throw err instanceof Error ? err : new Error("Failed to send tokens");
        }
    }, [cosmosClient, address, refreshBalance]);

    // Initialize on mount
    useEffect(() => {
        initializeWallet();
    }, [initializeWallet]);

    return {
        address,
        balance,
        cosmosClient,
        isLoading,
        error,
        importSeedPhrase,
        clearWallet,
        refreshBalance,
        sendTokens,
    };
};

export default useCosmosWallet;