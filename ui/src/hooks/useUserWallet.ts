import { useState, useEffect } from "react";
import { Wallet, ethers } from "ethers";
import axios from "axios";
import { NodeRpcClient } from "@bitcoinbrisbane/block52";

interface UserWalletResult {
    b52: NodeRpcClient | null;
    account: string | null;
    balance: string | null;
    privateKey: string | null;
    isLoading: boolean;
    error: Error | null;
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

    const fetchBalance = async () => {
        if (!account) return;

        setIsLoading(true);
        setError(null);

        try {
            const url = process.env.REACT_APP_PROXY_URL || "https://proxy.block52.xyz";
            const response = await axios.get(`${url}/account/${account}`);

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setBalance(response.data.balance);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("An error occurred"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const initializeWallet = async () => {
            try {
                // Try to get existing private key and public key from storage
                let key = localStorage.getItem(STORAGE_PRIVATE_KEY);
                let pubKey = localStorage.getItem(STORAGE_PUBLIC_KEY);

                // If no existing private key, generate a new one
                if (!key) {
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
        fetchBalance();
    }, [account]);

    useEffect(() => {
        if (privateKey) {
            const url = process.env.REACT_APP_PROXY_URL || "https://proxy.block52.xyz";
            const client = new NodeRpcClient(url, privateKey);
            setClient(client);
        }
    }, [privateKey]);

    return {
        account,
        balance,
        privateKey,
        isLoading,
        error,
        b52: client
    };
};

export default useUserWallet;
