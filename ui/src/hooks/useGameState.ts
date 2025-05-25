import { useState, useEffect, useCallback, useRef } from "react";
import { TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { GameStateReturn } from "../types/index";

// Global WebSocket connection manager to prevent multiple connections
interface WebSocketConnection {
  ws: WebSocket;
  subscribers: Set<(gameState: TexasHoldemStateDTO | null) => void>;
  lastGameState: TexasHoldemStateDTO | null;
  isConnecting: boolean;
  reconnectAttempts: number;
  reconnectTimeout: NodeJS.Timeout | null;
}

const globalConnections = new Map<string, WebSocketConnection>();

// Global debounce for refresh requests
const refreshDebounceMap = new Map<string, NodeJS.Timeout>();

/**
 * Central hook for fetching game state data via WebSocket subscription
 * This hook connects to the WebSocket server and subscribes to real-time game state updates
 * @param tableId The ID of the table to fetch state for
 * @param autoRefreshIntervalMs Not used for WebSocket (kept for compatibility)
 * @returns Object containing game state data and WebSocket utilities
 */
export const useGameState = (tableId?: string, autoRefreshIntervalMs: number = 10000): GameStateReturn => {
  const [gameState, setGameState] = useState<TexasHoldemStateDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Get user address from localStorage
  const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();

  // Create a subscription callback that updates this hook's state
  const subscriptionCallback = useCallback((newGameState: TexasHoldemStateDTO | null) => {
    setGameState(newGameState);
    setIsLoading(false);
    setError(null);
  }, []);

  // Subscribe to global connection for this table
  useEffect(() => {
    if (!tableId || !userAddress) {
      setIsLoading(false);
      return;
    }

    const connectionKey = `${tableId}-${userAddress}`;
    let connection = globalConnections.get(connectionKey);

    if (!connection) {
      // Create new global connection
      connection = {
        ws: null as any, // Will be set below
        subscribers: new Set(),
        lastGameState: null,
        isConnecting: false,
        reconnectAttempts: 0,
        reconnectTimeout: null
      };
      globalConnections.set(connectionKey, connection);
    }

    // Add this hook as a subscriber
    connection.subscribers.add(subscriptionCallback);

    // If we already have game state, update immediately
    if (connection.lastGameState) {
      subscriptionCallback(connection.lastGameState);
    }

    // Connect if not already connected or connecting
    if (!connection.ws || connection.ws.readyState === WebSocket.CLOSED) {
      connectToTable(connectionKey, tableId, userAddress);
    }

    // Cleanup on unmount
    return () => {
      const conn = globalConnections.get(connectionKey);
      if (conn) {
        conn.subscribers.delete(subscriptionCallback);
        
        // If no more subscribers, close the connection
        if (conn.subscribers.size === 0) {
          if (conn.reconnectTimeout) {
            clearTimeout(conn.reconnectTimeout);
          }
          if (conn.ws && conn.ws.readyState === WebSocket.OPEN) {
            conn.ws.send(JSON.stringify({
              action: "unsubscribe",
              tableAddress: tableId,
              playerId: userAddress
            }));
            conn.ws.close();
          }
          globalConnections.delete(connectionKey);
          
          // Clear any pending refresh debounce
          const refreshKey = `refresh-${connectionKey}`;
          const refreshTimeout = refreshDebounceMap.get(refreshKey);
          if (refreshTimeout) {
            clearTimeout(refreshTimeout);
            refreshDebounceMap.delete(refreshKey);
          }
        }
      }
    };
  }, [tableId, userAddress, subscriptionCallback]);

  // Function to connect to a table
  const connectToTable = (connectionKey: string, tableId: string, userAddress: string) => {
    const connection = globalConnections.get(connectionKey);
    if (!connection || connection.isConnecting) {
      return;
    }

    connection.isConnecting = true;
    
    try {
      const wsUrl = `ws://localhost:3000?tableAddress=${tableId}&playerId=${userAddress}`;
      console.log(`🔌 Connecting to table ${tableId.slice(0, 8)}...`);
      
      const ws = new WebSocket(wsUrl);
      connection.ws = ws;

      ws.onopen = () => {
        console.log(`✅ Connected to table ${tableId.slice(0, 8)}...`);
        connection.isConnecting = false;
        connection.reconnectAttempts = 0;
        
        // Send subscription message
        ws.send(JSON.stringify({
          action: "subscribe",
          tableAddress: tableId,
          playerId: userAddress
        }));

        // Notify all subscribers of connection success
        connection.subscribers.forEach(callback => {
          // Don't change game state on connection, wait for data
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === "gameStateUpdate" && message.tableAddress === tableId) {
            // Only log on significant state changes (reduce spam)
            connection.lastGameState = message.gameState;
            
            // Notify all subscribers
            connection.subscribers.forEach(callback => {
              callback(message.gameState);
            });
          } else if (message.type === "subscribed") {
            console.log(`📝 Subscribed to table ${tableId.slice(0, 8)}...`);
          } else if (message.type === "connected") {
            // Reduce logging spam - only log connection establishment
          } else if (message.type === "error") {
            console.error("❌ WebSocket error:", message.message);
            const errorObj = new Error(message.message);
            connection.subscribers.forEach(callback => {
              // For errors, we don't call the callback but could add error handling
            });
          }
        } catch (err) {
          console.error("❌ Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket connection error:", error);
        connection.isConnecting = false;
      };

      ws.onclose = (event) => {
        console.log(`🔌 Disconnected from table ${tableId.slice(0, 8)}... (Code: ${event.code})`);
        connection.isConnecting = false;
        
        // Only reconnect if we have active subscribers and haven't exceeded max attempts
        if (connection.reconnectAttempts < 3 && connection.subscribers.size > 0) {
          connection.reconnectAttempts++;
          const delay = Math.min(2000 * Math.pow(1.5, connection.reconnectAttempts), 8000); // Gentler backoff
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${connection.reconnectAttempts}/3)`);
          
          connection.reconnectTimeout = setTimeout(() => {
            connectToTable(connectionKey, tableId, userAddress);
          }, delay);
        } else if (connection.reconnectAttempts >= 3) {
          console.error("❌ Max reconnection attempts reached");
          const errorObj = new Error("WebSocket connection failed after multiple attempts");
          connection.subscribers.forEach(callback => {
            // Could add error callback here
          });
        }
      };

    } catch (err) {
      console.error("❌ Failed to create WebSocket connection:", err);
      connection.isConnecting = false;
    }
  };

  // Debounced manual refresh function
  const refresh = async (): Promise<TexasHoldemStateDTO | undefined> => {
    if (!tableId || !userAddress) return undefined;

    const connectionKey = `${tableId}-${userAddress}`;
    const refreshKey = `refresh-${connectionKey}`;
    
    // Clear any existing debounce timeout
    const existingTimeout = refreshDebounceMap.get(refreshKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Debounce refresh requests to prevent spam
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log("🔄 Manual refresh requested");
        const connection = globalConnections.get(connectionKey);
        
        if (connection) {
          if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.close();
          }
          connection.reconnectAttempts = 0;
          connectToTable(connectionKey, tableId, userAddress);
        }
        
        refreshDebounceMap.delete(refreshKey);
        resolve(gameState || undefined);
      }, 500); // 500ms debounce

      refreshDebounceMap.set(refreshKey, timeout);
    });
  };
  
  return { 
    gameState: gameState ?? undefined, 
    error, 
    isLoading, 
    refresh,
    isConnected: !!tableId && !!userAddress && globalConnections.get(`${tableId}-${userAddress}`)?.ws?.readyState === WebSocket.OPEN
  };
}; 