/**
 * useCosmosWallet - Temporary replacement hook
 *
 * This provides basic Cosmos wallet functionality using localStorage
 * and the SDK directly, without using CosmosContext.
 *
 * TODO: Replace with proper hooks in /src/hooks/cosmos/ after SDK testing is complete
 */

import { useState, useEffect, useCallback } from "react";
import { getCosmosClient } from "../utils/cosmos/client";
import { getCosmosMnemonic, setCosmosMnemonic } from "../utils/cosmos/storage";
import { getAddressFromMnemonic } from "@bitcoinbrisbane/block52";

interface Balance {
    denom: string;
    amount: string;
}

interface UseCosmosWalletReturn {
    address: string | null;
    balance: Balance[];
    isLoading: boolean;
    error: string | null;
    refreshBalance: () => Promise<void>;
    importSeedPhrase: (mnemonic: string) => Promise<void>;
    sendTokens: (recipient: string, amount: bigint | string) => Promise<string>;
}

export const useCosmosWallet = (): UseCosmosWalletReturn => {
    const [address, setAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<Balance[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load address from mnemonic
    useEffect(() => {
        const loadAddress = async () => {
            const mnemonic = getCosmosMnemonic();
            if (!mnemonic) {
                setAddress(null);
                return;
            }

            try {
                const addr = await getAddressFromMnemonic(mnemonic, "b52");
                setAddress(addr);
            } catch (err) {
                console.error("Error loading Cosmos address:", err);
                setAddress(null);
            }
        };

        loadAddress();
    }, []);

    // Refresh balance
    const refreshBalance = useCallback(async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            const client = getCosmosClient();
            if (!client) {
                throw new Error("Cosmos client not initialized");
            }

            const balances = await client.getAllBalances(address);
            setBalance(balances);
        } catch (err: any) {
            console.error("Error fetching balance:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    // Auto-refresh balance when address changes
    useEffect(() => {
        if (address) {
            refreshBalance();
        }
    }, [address, refreshBalance]);

    // Import seed phrase
    const importSeedPhrase = useCallback(async (mnemonic: string) => {
        setIsLoading(true);
        setError(null);

        try {
            // Get address from mnemonic
            const addr = await getAddressFromMnemonic(mnemonic, "b52");

            // Store mnemonic
            setCosmosMnemonic(mnemonic);

            // Update state
            setAddress(addr);
        } catch (err: any) {
            console.error("Error importing seed phrase:", err);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Send tokens (stub - will be implemented with SigningCosmosClient)
    const sendTokens = useCallback(async (_recipient: string, _amount: bigint | string): Promise<string> => {
        if (!address) {
            throw new Error("No wallet connected");
        }

        // TODO: Implement with SigningCosmosClient
        throw new Error("sendTokens not yet implemented - use /test-signing page");
    }, [address]);

    return {
        address,
        balance,
        isLoading,
        error,
        refreshBalance,
        importSeedPhrase,
        sendTokens,
    };
};

export default useCosmosWallet;
