import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
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
  
  // Use refs to prevent React StrictMode issues
  const currentTableIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isSubscribingRef = useRef<boolean>(false);
  const wsInstance = WebSocketSingleton.getInstance();

  const subscribeToTable = useCallback((tableId: string) => {
    // Prevent duplicate subscriptions
    if (currentTableIdRef.current === tableId && unsubscribeRef.current) {
      console.log(`[GameStateContext] Already subscribed to table: ${tableId}`);
      return;
    }

    // Prevent concurrent subscription attempts
    if (isSubscribingRef.current) {
      console.log(`[GameStateContext] Subscription in progress, ignoring duplicate request for: ${tableId}`);
      return;
    }

    isSubscribingRef.current = true;

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      console.log("[GameStateContext] Cleaning up previous subscription");
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setIsLoading(true);
    setError(null);
    currentTableIdRef.current = tableId;

    console.log(`[GameStateContext] Subscribing to table: ${tableId}`);

    try {
      const playerAddress = localStorage.getItem("user_eth_public_key");
      
      const unsubscribe = wsInstance.subscribeToTable(
        tableId,
        playerAddress || "0x0000000000000000000000000000000000000000", // Use actual player ID
        (newGameState: TexasHoldemStateDTO) => {
          setGameState(newGameState);
          setError(null);
          setIsLoading(false);
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      console.error(`[GameStateContext] Failed to subscribe to table ${tableId}:`, err);
      setError(err instanceof Error ? err : new Error("Subscription failed"));
      setIsLoading(false);
    } finally {
      isSubscribingRef.current = false;
    }
  }, [wsInstance]);

  const unsubscribeFromTable = useCallback(() => {
    if (unsubscribeRef.current) {
      console.log(`[GameStateContext] Unsubscribing from table: ${currentTableIdRef.current}`);
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    currentTableIdRef.current = null;
    setGameState(undefined);
    setIsLoading(false);
    setError(null);
    isSubscribingRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        console.log("[GameStateContext] Component unmounting, cleaning up subscription");
        unsubscribeRef.current();
      }
    };
  }, []);

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