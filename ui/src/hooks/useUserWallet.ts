import { useState, useEffect } from "react";
import { Wallet, ethers } from "ethers";
import axios from "axios";
import { NodeRpcClient } from "@bitcoinbrisbane/block52";
import { PROXY_URL } from "../config/constants";
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
            const url = PROXY_URL;
            const response = await axios.get(`${url}/get_account/${account}`);
            // console.log("=== BALANCE RESPONSE ===", response.data);
            // console.log(response.data);

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (response.data?.result?.data?.balance) {
                setBalance(response.data.result.data.balance);
            } else {
                console.error("Balance not found in response:", response.data);
                setBalance("0");
            }
        } catch (err) {
            console.error("Error fetching balance:", err);
            setError(err instanceof Error ? err : new Error("An error occurred"));
            setBalance("0");
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
        fetchBalance();
    }, [account]);

    useEffect(() => {
        if (privateKey) {
            const url = PROXY_URL;
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
