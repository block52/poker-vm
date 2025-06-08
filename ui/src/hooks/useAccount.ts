import { useState, useEffect, useCallback } from "react";
import { AccountDTO } from "@bitcoinbrisbane/block52";
import { getClient } from "../utils/b52AccountUtils";

export interface UseAccountReturn {
    account: AccountDTO | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Custom hook to get account details including nonce
 * @param address The account address to fetch details for
 * @returns Object containing account details, loading state, and error
 */
export const useAccount = (address?: string): UseAccountReturn => {
    const [account, setAccount] = useState<AccountDTO | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchAccount = useCallback(async () => {
        if (!address) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Use the singleton client instance
            const client = getClient();
            
            const accountData = await client.getAccount(address);
            console.log("🔍 Account Data Retrieved:");
            console.log(`Address: ${address}`);
            console.log(`Balance: ${accountData.balance}`);
            console.log(`Nonce: ${accountData.nonce}`);
            console.log("Full Account Data:", accountData);
            setAccount(accountData);
        } catch (err: any) {
            const errorMessage = err.message || "Failed to fetch account";
            setError(new Error(errorMessage));
            console.error("Error fetching account:", err);
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    useEffect(() => {
        if (address) {
            fetchAccount();
        }
    }, [fetchAccount, address]);

    return {
        account,
        isLoading,
        error,
        refetch: fetchAccount
    };
}; 