import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import { PROXY_URL } from "../config/constants";

interface UseUserLastActionResult {
    action: string;
    amount: number;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

const useUserLastAction = (address: string, player: number): UseUserLastActionResult => {
    const [action, setAction] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchLastAction = useCallback(async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            const url = PROXY_URL;
            const response = await axios.get(`${url}/table/${address}/player/${player}`);

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setAction(response.data.lastAction.action);
            setAmount(response.data.lastAction.amount);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("An error occurred"));
        } finally {
            setIsLoading(false);
        }
    }, [address, player]);

    useEffect(() => {
        fetchLastAction();
        
        // Cleanup function
        return () => {
            setAction("");
            setAmount(0);
        };
    }, [fetchLastAction]);

    return {
        action,
        amount,
        isLoading,
        error,
        refetch: fetchLastAction
    };
};

export default useUserLastAction;