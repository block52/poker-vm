import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import WebSocketSingleton from "../utils/websocketSingleton";

interface GameStateContextType {
  gameState: TexasHoldemStateDTO | undefined;
  isLoading: boolean;
  error: Error | null;
  subscribeToTable: (tableId: string) => void;
  unsubscribeFromTable: () => void;
}

const GameStateContext = createContext<GameStateContextType | null>(null);

interface GameStateProviderProps {
  children: React.ReactNode;
}

export const GameStateProvider: React.FC<GameStateProviderProps> = ({ children }) => {
  const [gameState, setGameState] = useState<TexasHoldemStateDTO | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Simplified state management - singleton handles complexity
  const [currentTableId, setCurrentTableId] = useState<string | null>(null);
  const wsInstance = WebSocketSingleton.getInstance();

  const subscribeToTable = useCallback((tableId: string) => {
    // Simple duplicate check - singleton handles the rest
    if (currentTableId === tableId) {
      console.log(`[GameStateContext] Already subscribed to table: ${tableId}`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentTableId(tableId);

    console.log(`[GameStateContext] Subscribing to table: ${tableId}`);

    try {
      //TODO centralised this to a function
      const playerAddress = localStorage.getItem("user_eth_public_key");
      if (!playerAddress) {
        console.error("[GameStateContext] No player address found");
        return;
      }
      
      // Singleton handles all the complexity now
      wsInstance.subscribeToTable(
        tableId,
        playerAddress,
        (newGameState: TexasHoldemStateDTO) => {
          setGameState(newGameState);
          setError(null);
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.error(`[GameStateContext] Failed to subscribe to table ${tableId}:`, err);
      setError(err instanceof Error ? err : new Error("Subscription failed"));
      setIsLoading(false);
    }
  }, [currentTableId, wsInstance]);

  const unsubscribeFromTable = useCallback(() => {
    if (currentTableId) {
      console.log(`[GameStateContext] Unsubscribing from table: ${currentTableId}`);
      // Singleton handles cleanup internally
    }
    setCurrentTableId(null);
    setGameState(undefined);
    setIsLoading(false);
    setError(null);
  }, [currentTableId]);

  // Cleanup on unmount - singleton handles the actual WebSocket cleanup
  useEffect(() => {
    return () => {
      if (currentTableId) {
        console.log("[GameStateContext] Component unmounting, cleaning up subscription");
        // Singleton will handle cleanup when callbacks are removed
      }
    };
  }, [currentTableId]);

  const contextValue: GameStateContextType = {
    gameState,
    isLoading,
    error,
    subscribeToTable,
    unsubscribeFromTable
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameStateContext = (): GameStateContextType => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error("useGameStateContext must be used within a GameStateProvider");
  }
  return context;
}; 