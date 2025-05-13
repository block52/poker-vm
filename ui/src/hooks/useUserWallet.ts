import { useState, useEffect, useCallback } from "react";
import { Wallet } from "ethers";
import { NodeRpcClient } from "@bitcoinbrisbane/block52";
import { PROXY_URL } from "../config/constants";

// Key for storing last API call time in localStorage
const LAST_ACCOUNT_API_CALL_KEY = "last_account_api_call_time";

interface UserWalletResult {
    b52: NodeRpcClient | null;
    account: string | null;
    balance: string | null;
    privateKey: string | null;
    isLoading: boolean;
    error: Error | null;
    refreshBalance: () => Promise<void>;
}

export const STORAGE_PRIVATE_KEY = "user_eth_private_key";
export const STORAGE_PUBLIC_KEY = "user_eth_public_key";

const useUserWallet = (): UserWalletResult => {
    const [account, setAccount] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [privateKey, setPrivateKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [client, setClient] = useState<NodeRpcClient | null>(null);
    const [refreshCounter, setRefreshCounter] = useState(0);

    const fetchBalance = useCallback(async () => {
        if (!account || !client) return;

        // Rate limiting: Only allow API calls once every 10 seconds across all hooks
        const now = Date.now();
        const lastApiCallStr = localStorage.getItem(LAST_ACCOUNT_API_CALL_KEY);
        const lastApiCallTime = lastApiCallStr ? parseInt(lastApiCallStr, 10) : 0;
        const timeSinceLastCall = now - lastApiCallTime;
        const minInterval = 10000; // 10 seconds

        // If it's been less than 10 seconds since the last call and we have balance data, use cached data
        if (timeSinceLastCall < minInterval && balance !== null) {
            return;
        }

        setIsLoading(true);
        setError(null);
        
        // Update shared last API call time
        localStorage.setItem(LAST_ACCOUNT_API_CALL_KEY, now.toString());

        try {
            // Use the SDK's getAccount method
            const accountData = await client.getAccount(account);
            
            if (accountData?.balance) {
                setBalance(accountData.balance);
            } else {
                console.error("Balance not found in account data:", accountData);
                setBalance("0");
            }
        } catch (err) {
            console.error("Error fetching balance:", err);
            setError(err instanceof Error ? err : new Error("An error occurred"));
            setBalance("0");
        } finally {
            setIsLoading(false);
        }
    }, [account, balance, client]);

    // Manual refresh function
    const refreshBalance = useCallback(async () => {
        setRefreshCounter(prev => prev + 1);
    }, []);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance, refreshCounter]);

    useEffect(() => {
        const initializeWallet = async () => {
            try {
                // Try to get existing private key and public key from storage
                let key = localStorage.getItem(STORAGE_PRIVATE_KEY);
                let pubKey = localStorage.getItem(STORAGE_PUBLIC_KEY);

                // If no existing private key, generate a new one
                if (!key || !pubKey) {
                    const wallet = Wallet.createRandom();
                    key = wallet.privateKey;
                    pubKey = wallet.address;

                    // Save keys in localStorage
                    localStorage.setItem(STORAGE_PRIVATE_KEY, key);
                    localStorage.setItem(STORAGE_PUBLIC_KEY, pubKey);
                }

                // Create wallet instance from private key
                const wallet = new Wallet(key);

                setPrivateKey(key);
                setAccount(wallet.address);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err : new Error("Failed to initialize wallet"));
                setAccount(null);
                setPrivateKey(null);
            } finally {
                setIsLoading(false);
            }
        };

        initializeWallet();
    }, []);

    useEffect(() => {
        if (privateKey) {
            const url = PROXY_URL;
            const client = new NodeRpcClient(url, privateKey);
            setClient(client);
        }
    }, [privateKey]);

    const result = {
        account,
        balance,
        privateKey,
        isLoading,
        error,
        b52: client,
        refreshBalance
    };

    return result;
};

export default useUserWallet;
