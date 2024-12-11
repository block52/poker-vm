import axios from "axios";
import { useState, useEffect } from "react";

interface UseGameStateResult {
    startIndex: number;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

const useGame = (address: string): UseGameStateResult => {
    const [startIndex, setStartIndex] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchGameState = async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.get(`https://proxy.block52.xyz/table/${address}`);
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setStartIndex(response.data.button);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("An error occurred"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGameState();
    }, []);

    return {
        startIndex,
        isLoading,
        error,
        refetch: fetchGameState
    };
};

export default useGame;
