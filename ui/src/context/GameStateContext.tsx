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
          // 🔍 DEBUG: Log game state change timing for race condition debugging
          console.log("🔄 [GAME STATE UPDATE]", {
            timestamp: new Date().toISOString(),
            tableId,
            newRound: message.gameState?.round,
            playerTurnInfo: {
              nextToAct: message.gameState?.nextToAct,
              currentActorSeat: message.gameState?.players?.find((p: any) => p.address?.toLowerCase() === localStorage.getItem("user_eth_public_key")?.toLowerCase())?.seat
            },
            source: "WebSocket gameStateUpdate"
          });
          
          console.log(`[GameStateContext] Received game state update for table ${tableId}`);
          
          // DEBUG: Log hole card data for all players to detect if backend sends undefined/null cards
          if (message.gameState?.players) {
            const playerAddress = localStorage.getItem("user_eth_public_key");
            const currentUser = message.gameState.players.find((player: any) => 
              player.address?.toLowerCase() === playerAddress?.toLowerCase()
            );
            
            console.log("🃏 [GameStateContext] Hole Cards Debug:", {
              timestamp: new Date().toISOString(),
              totalPlayers: message.gameState.players.length,
              round: message.gameState.round,
              shouldHaveCards: ["preflop", "flop", "turn", "river", "showdown"].includes(message.gameState.round),
              source: "WebSocket gameStateUpdate message",
              note: "This shows raw backend data - compare with Player component logs",
              currentUserData: currentUser ? {
                seat: currentUser.seat,
                address: currentUser.address?.substring(0, 8) + "...",
                holeCards: currentUser.holeCards,
                hasCards: !!currentUser.holeCards,
                cardCount: currentUser.holeCards?.length || 0,
                status: currentUser.status
              } : "Current user not found in players"
            });
            
            // Only check current user's hole cards (opposite players should have hidden cards)
            // And only during rounds where cards should actually be dealt
            const roundsWithCards = ["preflop", "flop", "turn", "river", "showdown"];
            if (currentUser && roundsWithCards.includes(message.gameState.round) && 
                (!currentUser.holeCards || currentUser.holeCards.length !== 2)) {
              console.warn("🚨 [WebSocket/Backend Data Issue] PVM backend sent invalid hole cards via WebSocket:", {
                seat: currentUser.seat,
                address: currentUser.address?.substring(0, 8) + "...",
                holeCards: currentUser.holeCards,
                issue: !currentUser.holeCards ? "Backend sent null/undefined cards" : `Backend sent wrong count: ${currentUser.holeCards.length}`,
                round: message.gameState.round,
                source: "WebSocket gameStateUpdate message",
                note: "This is NOT a frontend rendering issue - backend data is invalid"
              });
            }
          } else {
            console.warn("⚠️ [GameStateContext] No players data in game state update");
          }
          
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