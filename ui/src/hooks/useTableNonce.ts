import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { PROXY_URL } from "../config/constants";

// Interface for Account data structure
export interface AccountData {
  address: string;
  balance: string;
  nonce: number;
}

// Interface for API response
export interface AccountApiResponse {
  id: string;
  result: {
    data: AccountData;
    signature: string;
  };
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

    // Rate limiting: Only allow API calls once every 10 seconds across all hooks
    const now = Date.now();
    const lastApiCallStr = localStorage.getItem(LAST_ACCOUNT_API_CALL_KEY);
    const lastApiCallTime = lastApiCallStr ? parseInt(lastApiCallStr, 10) : 0;
    const timeSinceLastCall = now - lastApiCallTime;
    const minInterval = 10000; // 10 seconds

    // If it's been less than 10 seconds since the last call, use cached data
    if (timeSinceLastCall < minInterval && nonce !== null) {
      console.log(`[useTableNonce] Rate limiting: Using cached nonce data (${Math.floor(timeSinceLastCall/1000)}s since last call)`);
      return nonce;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Update shared last API call time
      localStorage.setItem(LAST_ACCOUNT_API_CALL_KEY, now.toString());
      console.log(`[useTableNonce] Making API call to /get_account/ (${Math.floor(timeSinceLastCall/1000)}s since last call)`);

      const response = await axios.get<AccountApiResponse>(`${PROXY_URL}/get_account/${address}`);
      console.log("Nonce response:", response.data);

      if (response.data?.result?.data) {
        const { data } = response.data.result;
        setAccountData(data);
        setNonce(data.nonce);
        setLastRefreshTime(Date.now());
        setIsLoading(false);
        return data.nonce;
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
  }, [nonce]);

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
    
    console.log("🔄 Refreshing nonce for address:", targetAddress);
    return await fetchNonce(targetAddress);
  }, [fetchNonce, userAddress]);

  // Initial fetch on mount
  useEffect(() => {
    if (userAddress) {
      fetchNonce(userAddress);
    }
  }, [userAddress, fetchNonce]);

  // Automatically refresh nonce every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (userAddress) {
        console.log("🔄 Scheduled nonce refresh");
        fetchNonce(userAddress);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [userAddress, fetchNonce]);

  const result = {
    nonce,
    accountData,
    isLoading,
    error,
    refreshNonce,
    lastRefreshTime
  };

  console.log("[useTableNonce] Returns:", {
    nonce,
    hasAccountData: !!accountData,
    balance: accountData?.balance,
    isLoading,
    hasError: !!error,
    lastRefreshTime: new Date(lastRefreshTime).toISOString()
  });

  return result;
} 