import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import { PROXY_URL } from "../config/constants";

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

    const fetchBalance = useCallback(async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            const url = PROXY_URL;
            const response = await axios.get(`${url}/get_account/${address}`);

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setBalance(response.data.balance);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("An error occurred"));
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    return {
        balance,
        isLoading,
        error,
        refetch: fetchBalance
    };
};

export default useBalance;