import { useState, useEffect, useCallback } from "react";
import { useNodeRpc } from "../context/NodeRpcContext";

// Interface for Account data structure
export interface AccountData {
  address: string;
  balance: string;
  nonce: number;
}

// Key for storing last API call time in localStorage
const LAST_ACCOUNT_API_CALL_KEY = "last_account_api_call_time";

/**
 * Custom hook for managing nonce values from the API
 * @returns Object containing nonce value and refresh function
 */
export function useTableNonce() {
  const [nonce, setNonce] = useState<number | null>(null);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const { client } = useNodeRpc();

  // Get user address from localStorage
  const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();

  /**
   * Fetch nonce from the API
   */
  const fetchNonce = useCallback(async (address: string): Promise<number | null> => {
    if (!address) {
      setError(new Error("No user address available"));
      setIsLoading(false);
      return null;
    }

    if (!client) {
      setError(new Error("SDK client not initialized"));
      setIsLoading(false);
      return null;
    }

    // Rate limiting: Only allow API calls once every 10 seconds across all hooks
    const now = Date.now();
    const lastApiCallStr = localStorage.getItem(LAST_ACCOUNT_API_CALL_KEY);
    const lastApiCallTime = lastApiCallStr ? parseInt(lastApiCallStr, 10) : 0;
    const timeSinceLastCall = now - lastApiCallTime;
    const minInterval = 10000; // 10 seconds

    // If it's been less than 10 seconds since the last call, use cached data
    if (timeSinceLastCall < minInterval && nonce !== null) {
      return nonce;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Update shared last API call time
      localStorage.setItem(LAST_ACCOUNT_API_CALL_KEY, now.toString());

      // Use the SDK's getAccount method
      const data = await client.getAccount(address);

      if (data) {
        // Convert the response to match our expected AccountData format
        const accountData: AccountData = {
          address: address,
          balance: data.balance || "0",
          nonce: data.nonce || 0
        };
        
        setAccountData(accountData);
        setNonce(accountData.nonce);
        setLastRefreshTime(Date.now());
        setIsLoading(false);
        return accountData.nonce;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Error fetching nonce");
      setError(error);
      setIsLoading(false);
      console.error("Error fetching nonce:", err);
      return null;
    }
  }, [nonce, client]);

  /**
   * Function to refresh the nonce
   */
  const refreshNonce = useCallback(async (address?: string): Promise<number | null> => {
    // Use provided address or fall back to the one from localStorage
    const targetAddress = address || userAddress;
    
    if (!targetAddress) {
      console.error("No address provided for nonce refresh");
      return null;
    }
    
    return await fetchNonce(targetAddress);
  }, [fetchNonce, userAddress]);

  // Initial fetch on mount
  useEffect(() => {
    if (userAddress && client) {
      fetchNonce(userAddress);
    }
  }, [userAddress, fetchNonce, client]);

  // Automatically refresh nonce every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (userAddress && client) {
        console.log("🔄 Scheduled nonce refresh");
        fetchNonce(userAddress);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [userAddress, fetchNonce, client]);

  const result = {
    nonce,
    accountData,
    isLoading,
    error,
    refreshNonce,
    lastRefreshTime
  };

  return result;
} 