import axios from "axios";
import { useState, useEffect } from "react";
import { PROXY_URL } from "../config/constants";

interface UseTableTypeResult {
    type: string | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

const useTableType = (address: string): UseTableTypeResult => {
    const [type, setType] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchType = async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            const url = PROXY_URL;
            const response = await axios.get(`${url}/get_game_state/${address}`);

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setType(response.data.type);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("An error occurred"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchType();
    }, [address]);

    return {
        type,
        isLoading,
        error,
        refetch: fetchType
    };
};

export default useTableType;
