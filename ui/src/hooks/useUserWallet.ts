import { useState, useEffect } from "react";
import { Wallet } from "ethers";
import axios from "axios";

interface UseUserWalletResult {
    account: string | null;
    balance: string | null;
    privateKey: string | null;
    isLoading: boolean;
    error: Error | null;
}

const STORAGE_KEY = "user_eth_private_key";

const useUserWallet = (): UseUserWalletResult => {
    const [account, setAccount] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [privateKey, setPrivateKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchBalance = async () => {
        if (!account) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.get(`https://proxy.block52.xyz/account/${account}`);
            // const response = await axios.get(`http://localhost:8080/account/${account}`);

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
                // Try to get existing private key from storage
                let key = localStorage.getItem(STORAGE_KEY);

                // If no existing key, generate a new one
                if (!key) {
                    const wallet = Wallet.createRandom();
                    key = wallet.privateKey;
                    localStorage.setItem(STORAGE_KEY, key);
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

    return {
        account,
        balance,
        privateKey,
        isLoading,
        error
    };
};

export default useUserWallet;
