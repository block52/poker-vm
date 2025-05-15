import { useState, useEffect, useCallback } from "react";
import { Wallet } from "ethers";
import { AccountDTO } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../context/NodeRpcContext";

// Key for storing last API call time in localStorage
const LAST_ACCOUNT_API_CALL_KEY = "last_account_api_call_time";

interface UserWalletResult {
    account: string | null;
    balance: string | null;
    privateKey: string | null;
    isLoading: boolean;
    error: Error | null;
    accountData: AccountDTO | null; // Full account data from SDK
    nonce: number | null; // Expose nonce directly 
    refreshBalance: () => Promise<void>;
}

export const STORAGE_PRIVATE_KEY = "user_eth_private_key";
export const STORAGE_PUBLIC_KEY = "user_eth_public_key";

const useUserWallet = (): UserWalletResult => {
    // Use the shared NodeRpc client from context
    const { client, isLoading: clientLoading } = useNodeRpc();
    
    const [account, setAccount] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [privateKey, setPrivateKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [refreshCounter, setRefreshCounter] = useState(0);
    const [accountData, setAccountData] = useState<AccountDTO | null>(null);
    const [nonce, setNonce] = useState<number | null>(null);

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
            const data = await client.getAccount(account);
            console.log("[useUserWallet] Account data received:", {
                address: data.address,
                nonce: data.nonce,
                balance: data.balance,
                timestamp: new Date().toISOString()
            });
            
            // Store the full account data
            setAccountData(data);
            
            // Extract key properties
            if (data?.balance) {
                setBalance(data.balance);
            } else {
                console.error("[useUserWallet] Balance not found in account data:", data);
                setBalance("0");
            }
            
            if (data?.nonce !== undefined) {
                setNonce(data.nonce);
            }
            
        } catch (err) {
            console.error("[useUserWallet] Error fetching balance:", err);
            setError(err instanceof Error ? err : new Error("An error occurred"));
            setBalance("0");
        } finally {
            setIsLoading(false);
        }
    }, [account, balance, client]);

    // Manual refresh function
    const refreshBalance = useCallback(async () => {
        console.log("[useUserWallet] Manual refresh requested");
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
                    console.log("[useUserWallet] New wallet generated:", pubKey);
                } else {
                    console.log("[useUserWallet] Using existing wallet:", pubKey);
                }

                // Create wallet instance from private key
                const wallet = new Wallet(key);

                setPrivateKey(key);
                setAccount(wallet.address);
                setError(null);
            } catch (err) {
                console.error("[useUserWallet] Failed to initialize wallet:", err);
                setError(err instanceof Error ? err : new Error("Failed to initialize wallet"));
                setAccount(null);
                setPrivateKey(null);
            } finally {
                setIsLoading(false);
            }
        };

        initializeWallet();
    }, []);

    // Return focused data instead of full client
    const result: UserWalletResult = {
        account,
        balance,
        privateKey,
        isLoading: isLoading || clientLoading,
        error,
        accountData,
        nonce,
        refreshBalance
    };

    return result;
};

export default useUserWallet;
