import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";

/**
 * GameStateContext - Centralized WebSocket state management
 * 
 * SIMPLIFIED ARCHITECTURE:
 * Components → useGameState → GameStateContext → WebSocket (direct)
 * 
 * BENEFITS:
 * - No more WebSocketSingleton complexity
 * - No more callback system needed
 * - Context manages ONE WebSocket connection per table
 * - All components read from Context state automatically
 * - Stable React lifecycle management
 */

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
  
  // WebSocket management - direct in Context (no Singleton needed)
  const [currentTableId, setCurrentTableId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsUrl = import.meta.env.VITE_NODE_WS_URL || "wss://node1.block52.xyz";

  const subscribeToTable = useCallback((tableId: string) => {
    // Simple duplicate check
    if (currentTableId === tableId && wsRef.current?.readyState === WebSocket.OPEN) {
      console.log(`[GameStateContext] Already subscribed to table: ${tableId}`);
      return;
    }

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsLoading(true);
    setError(null);
    setCurrentTableId(tableId);

    console.log(`[GameStateContext] Subscribing to table: ${tableId}`);

    // Get player address
    const playerAddress = localStorage.getItem("user_eth_public_key");
    if (!playerAddress) {
      console.error("[GameStateContext] No player address found");
      setError(new Error("No player address found"));
      setIsLoading(false);
      return;
    }
    
    // Create WebSocket connection with URL parameters for auto-subscription
    const fullWsUrl = `${wsUrl}?tableAddress=${tableId}&playerId=${playerAddress}`;
    const ws = new WebSocket(fullWsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`[GameStateContext] WebSocket connected to table ${tableId}`);
      setIsLoading(false);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "gameStateUpdate" && message.tableAddress === tableId) {
          console.log(`[GameStateContext] Received game state update for table ${tableId}`);
          setGameState(message.gameState);
          setError(null);
        }
      } catch (err) {
        console.error("[GameStateContext] Error parsing WebSocket message:", err);
        setError(new Error("Error parsing WebSocket message"));
      }
    };

    ws.onclose = () => {
      console.log(`[GameStateContext] WebSocket disconnected from table ${tableId}`);
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };

    ws.onerror = (error) => {
      console.error("[GameStateContext] WebSocket error:", error);
      setError(new Error(`WebSocket connection error for table ${tableId}`));
      setIsLoading(false);
    };
  }, [currentTableId, wsUrl]);

  const unsubscribeFromTable = useCallback(() => {
    if (currentTableId) {
      console.log(`[GameStateContext] Unsubscribing from table: ${currentTableId}`);
    }
    
    // Clean up WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setCurrentTableId(null);
    setGameState(undefined);
    setIsLoading(false);
    setError(null);
  }, [currentTableId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
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