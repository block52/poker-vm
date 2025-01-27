import axios from "axios";
import { useState, useEffect } from "react";
import { PROXY_URL } from '../config/constants';

interface UseUserSeatResult {
    data: any;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

const useUserBySeat = (address: string, seat: number): UseUserSeatResult => {
    const [userData, setUserData] = useState<any>();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchType = async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${PROXY_URL}/table/${address}/player/${seat}`);

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // console.log(response.data)
            setUserData(response.data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("An error occurred"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchType();
    }, [address, seat]);

    return {
        data: userData,
        isLoading,
        error,
        refetch: fetchType // Correctly assign the fetch function
    };
};

export default useUserBySeat;
