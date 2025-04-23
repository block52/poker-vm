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

    try {
      setIsLoading(true);
      setError(null);

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
  }, []);

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