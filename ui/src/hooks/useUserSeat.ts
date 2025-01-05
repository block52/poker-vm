import axios from "axios";
import { useState, useEffect } from "react";

interface UseUserSeatResult {
    seat: number | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

const useUserSeat = (address: string, player: number): UseUserSeatResult => {
    const [seat, setSeat] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchType = async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            const url = process.env.REACT_APP_PROXY_URL || "https://proxy.block52.xyz";
            const response = await axios.get(`${url}/table/${address}/player/${player}`);

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setSeat(response.data.seat);
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
        seat,
        isLoading,
        error,
        refetch: fetchType
    };
};

export default useUserSeat;
