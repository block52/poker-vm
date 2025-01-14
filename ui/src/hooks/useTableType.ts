import axios from "axios";
import { useState, useEffect } from "react";

interface UseTableTypeResult {
    tableType: string | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

const useTableType = (address: string): UseTableTypeResult => {
    const [tableType, setTableType] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchType = async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            const url = process.env.REACT_APP_PROXY_URL || "https://proxy.block52.xyz";
            const response = await axios.get(`${url}/table/${address}`);

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            setTableType(response.data.type);
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
        tableType: tableType,
        isLoading,
        error,
        refetch: fetchType
    };
};

export default useTableType;
