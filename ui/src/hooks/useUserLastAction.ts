import axios from "axios";
import { useState, useEffect } from "react";

interface UserUserLastActionResult {
    action: string;
    amount: number;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

const userUserLastAction = (address: string, player: number): UserUserLastActionResult => {
    const [action, setAction] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);
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

            setAction(response.data.lastAction.actoin);
            setAmount(response.data.lastAction.amount)
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
        action,
        amount,
        isLoading,
        error,
        refetch: fetchType
    };
};

export default userUserLastAction;
