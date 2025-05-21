import useSWR from "swr";
import { useNodeRpc } from "../context/NodeRpcContext";
import { useEffect } from "react";
import { TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { GameStateReturn } from "../types/index";

/**
 * Central hook for fetching game state data
 * This hook is used by other hooks to avoid multiple fetch requests for the same data
 * @param tableId The ID of the table to fetch state for
 * @param autoRefreshIntervalMs Optional refresh interval in ms, set to 0 to disable auto-refresh
 * @returns Object containing game state data and SWR utilities
 */
export const useGameState = (tableId?: string, autoRefreshIntervalMs: number = 10000): GameStateReturn => {
  const { client, isLoading: clientLoading } = useNodeRpc();
  const userAddress = localStorage.getItem("user_eth_public_key");
  
  // Define the fetcher function using the SDK client
  const fetcher = async (gameAddress: string): Promise<TexasHoldemStateDTO> => {
    if (!client) throw new Error("RPC client not initialized");
    return client.getGameState(gameAddress, userAddress?.toLowerCase() ?? "");
  };

  // Skip the request if no tableId is provided or client isn't ready
  const { data: gameState, error, isLoading: dataLoading, mutate } = useSWR<TexasHoldemStateDTO>(
    tableId && client ? tableId : null,
    fetcher,
    {
      refreshInterval: autoRefreshIntervalMs,
      revalidateOnFocus: true,
      dedupingInterval: Math.min(3000, autoRefreshIntervalMs), // Prevent duplicate requests within 3 seconds or less
    }
  );

  // Debug the game state structure
  useEffect(() => {
    if (gameState) {
      console.log("Raw Game State Object:", {
        handNumber: gameState.handNumber,
        actionCount: gameState.actionCount,
        nextToAct: gameState.nextToAct,
        // Log full structure for debugging
        fullGameState: JSON.parse(JSON.stringify(gameState))
      });
    }
  }, [gameState]);

  // Set up an effect to refresh more frequently when the game is in the "end" state
  useEffect(() => {
    if (gameState?.round === "end") {
      // Set a short timeout to do an extra refresh after the game ends
      const timeoutId = setTimeout(() => {
        mutate();
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [gameState?.round, mutate]);
  
  const isLoading = clientLoading || dataLoading;
  
  // Wrap mutate to ensure it returns the correct type
  const refresh = async (): Promise<TexasHoldemStateDTO | undefined> => {
    return mutate();
  };
  
  return { 
    gameState, 
    error, 
    isLoading, 
    refresh,
    // Helper function to safely extract nested properties
    getNestedValue: (path: string) => {
      if (!gameState) return undefined;
      
      return path.split(".").reduce((obj: any, key: string) => 
        (obj && obj[key] !== undefined) ? obj[key] : undefined, 
        gameState
      );
    }
  };
}; 