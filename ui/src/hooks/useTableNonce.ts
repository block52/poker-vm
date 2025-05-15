import { useState, useEffect, useCallback } from "react";
import { useNodeRpc } from "../context/NodeRpcContext";
import { AccountDTO } from "@bitcoinbrisbane/block52";

// Key for storing last API call time in localStorage
const LAST_ACCOUNT_API_CALL_KEY = "last_account_api_call_time";

/**
 * Custom hook for managing nonce values from the API
 * @returns Object containing nonce value and refresh function
 */
export function useTableNonce() {
  const [nonce, setNonce] = useState<number | null>(null);
  const [accountData, setAccountData] = useState<AccountDTO | null>(null);
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
      console.log("[useTableNonce] No user address available");
      setError(new Error("No user address available"));
      setIsLoading(false);
      return null;
    }

    if (!client) {
      console.log("[useTableNonce] SDK client not initialized");
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
      console.log("[useTableNonce] Using cached nonce:", nonce);
      return nonce;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Update shared last API call time
      localStorage.setItem(LAST_ACCOUNT_API_CALL_KEY, now.toString());

      console.log("[useTableNonce] Fetching nonce for address:", address);
      
      // Use the SDK's getAccount method
      const data = await client.getAccount(address);

      if (data) {
        // Store the account data directly from SDK
        setAccountData(data);
        setNonce(data.nonce);
        
        console.log("[useTableNonce] Nonce received:", data.nonce);
        
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
      console.error("[useTableNonce] Error fetching nonce:", err);
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
      console.error("[useTableNonce] No address provided for nonce refresh");
      return null;
    }
    
    console.log("[useTableNonce] Manual nonce refresh requested for:", targetAddress);
    return await fetchNonce(targetAddress);
  }, [fetchNonce, userAddress]);

  // Initial fetch on mount
  useEffect(() => {
    if (userAddress && client) {
      console.log("[useTableNonce] Initial nonce fetch");
      fetchNonce(userAddress);
    }
  }, [userAddress, fetchNonce, client]);

  // Automatically refresh nonce every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (userAddress && client) {
        console.log("[useTableNonce] Scheduled nonce refresh");
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