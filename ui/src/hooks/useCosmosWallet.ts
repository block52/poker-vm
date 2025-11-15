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
import { getAddressFromMnemonic, SigningCosmosClient } from "@bitcoinbrisbane/block52";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { useNetwork } from "../context/NetworkContext";

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
    const { currentNetwork } = useNetwork();
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
            const client = getCosmosClient(currentNetwork);
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
    }, [address, currentNetwork]);

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

    // Send tokens using SigningCosmosClient
    const sendTokens = useCallback(async (recipient: string, amount: bigint | string): Promise<string> => {
        if (!address) {
            throw new Error("No wallet connected");
        }

        const mnemonic = getCosmosMnemonic();
        if (!mnemonic) {
            throw new Error("No mnemonic found. Please import a wallet first.");
        }

        try {
            // Create wallet from mnemonic
            const hdWallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
                prefix: "b52"
            });

            // Create SigningCosmosClient
            const signingClient = new SigningCosmosClient({
                rpcEndpoint: currentNetwork.rpc,
                restEndpoint: currentNetwork.rest,
                chainId: "pokerchain",
                prefix: "b52",
                denom: "stake", // Native gas token
                gasPrice: "0stake", // Testnet has zero gas fees (minimum-gas-prices = "")
                wallet: hdWallet
            });

            // Convert amount to BigInt if it's a string
            const amountBigInt = typeof amount === "string" ? BigInt(amount) : amount;

            // Send tokens - using "usdc" as default denom for poker transfers
            const txHash = await signingClient.sendTokens(
                address,        // from address
                recipient,      // to address
                amountBigInt,   // amount in micro-units as BigInt
                "usdc",         // denom
                "Transfer via Dashboard"  // memo
            );

            console.log("✅ Tokens sent successfully:", txHash);

            // Refresh balance after sending
            await refreshBalance();

            return txHash;
        } catch (err: any) {
            console.error("❌ Failed to send tokens:", err);
            throw new Error(err.message || "Failed to send tokens");
        }
    }, [address, currentNetwork, refreshBalance]);

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
