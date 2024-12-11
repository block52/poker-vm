import axios from "axios";
import { useState, useEffect } from "react";

interface UseBalanceResult {
    balance: string | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

const useBalance = (address: string): UseBalanceResult => {
    const [balance, setBalance] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchBalance = async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            // const response = await axios.get(`https://proxy.block52.xyz/account/${address}`);
            const response = await axios.get(`http://localhost:8080/account/${address}`);

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
        fetchBalance();
    }, [address]);

    return {
        balance,
        isLoading,
        error,
        refetch: fetchBalance
    };
};

export default useBalance;
