import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import { PROXY_URL } from "../config/constants";

interface UseGameTypeResult {
    type: string | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

const useGameType = (address: string): UseGameTypeResult => {
    const [type, setType] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchType = useCallback(async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            const url = PROXY_URL;
            const response = await axios.get(`${url}/games/`);

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setType(response.data.type);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("An error occurred"));
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    useEffect(() => {
        fetchType();
        
        // Cleanup function
        return () => {
            setType(null);
        };
    }, [fetchType]);

    return {
        type,
        isLoading,
        error,
        refetch: fetchType
    };
};

export default useGameType;