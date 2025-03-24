import axios from "axios";
import { useState, useEffect } from "react";
import { PROXY_URL } from "../config/constants";

interface UseUserSeatResult {
    data: any;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

const useUserBySeat = (address: string, seat: number): UseUserSeatResult => {
    const [userData, setUserData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchType = async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            console.log(`Fetching user data for table: ${address}, seat: ${seat}`);
            const response = await axios.get(`${PROXY_URL}/table/${address}/player/${seat}`);

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log('User data by seat:', response.data);
            setUserData(response.data);
        } catch (err) {
            console.error('Error fetching user data by seat:', err);
            setError(err instanceof Error ? err : new Error("An error occurred"));
            setUserData(null); // Reset data on error
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
        refetch: fetchType
    };
};

export default useUserBySeat;