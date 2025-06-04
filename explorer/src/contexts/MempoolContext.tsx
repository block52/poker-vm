import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { TransactionDTO } from "@bitcoinbrisbane/block52";

/**
 * MempoolContext - Centralized WebSocket mempool state management
 * 
 * SIMPLIFIED ARCHITECTURE:
 * Components → useMempoolContext → MempoolContext → WebSocket (direct)
 * 
 * BENEFITS:
 * - Real-time mempool updates via WebSocket
 * - No need for polling RPC calls
 * - Context manages ONE WebSocket connection for mempool
 * - All components read from Context state automatically
 * - Stable React lifecycle management
 */

interface MempoolContextType {
  transactions: TransactionDTO[];
  isLoading: boolean;
  error: Error | null;
  subscribeToMempool: () => void;
  unsubscribeFromMempool: () => void;
  isConnected: boolean;
}

const MempoolContext = createContext<MempoolContextType | null>(null);

interface MempoolProviderProps {
  children: React.ReactNode;
}

export const MempoolProvider: React.FC<MempoolProviderProps> = ({ children }) => {
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // WebSocket management - direct in Context
  const wsRef = useRef<WebSocket | null>(null);
  const wsUrl = import.meta.env.VITE_NODE_WS_URL || "wss://node1.block52.xyz";

  const subscribeToMempool = useCallback(() => {
    // Check if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("[MempoolContext] Already connected to mempool");
      return;
    }

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsLoading(true);
    setError(null);
    setIsConnected(false);

    console.log("[MempoolContext] Subscribing to mempool updates");

    // Create WebSocket connection with URL parameter for auto-subscription
    const fullWsUrl = `${wsUrl}?subscribeMempool=true`;
    const ws = new WebSocket(fullWsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[MempoolContext] WebSocket connected to mempool");
      setIsLoading(false);
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "mempoolUpdate") {
          console.log(`[MempoolContext] Received mempool update with ${message.transactions.length} transactions`);
          setTransactions(message.transactions || []);
          setError(null);
        } else if (message.type === "mempool_subscribed") {
          console.log("[MempoolContext] Successfully subscribed to mempool");
        } else if (message.type === "connected") {
          console.log("[MempoolContext] Connected to WebSocket server");
        }
      } catch (err) {
        console.error("[MempoolContext] Error parsing WebSocket message:", err);
        setError(new Error("Error parsing WebSocket message"));
      }
    };

    ws.onclose = (event) => {
      console.log(`[MempoolContext] WebSocket disconnected from mempool (code: ${event.code})`);
      setIsConnected(false);
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      
      // Don't clear transactions on disconnect to maintain last known state
      // but set loading to false
      setIsLoading(false);
    };

    ws.onerror = (error) => {
      console.error("[MempoolContext] WebSocket error:", error);
      setError(new Error("WebSocket connection error for mempool"));
      setIsLoading(false);
      setIsConnected(false);
    };
  }, [wsUrl]);

  const unsubscribeFromMempool = useCallback(() => {
    console.log("[MempoolContext] Unsubscribing from mempool");
    
    // Send unsubscribe message if connection is open
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ action: "unsubscribe_mempool" }));
      } catch (err) {
        console.error("[MempoolContext] Error sending unsubscribe message:", err);
      }
    }
    
    // Clean up WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setTransactions([]);
    setIsLoading(false);
    setError(null);
    setIsConnected(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Auto-reconnect logic
  useEffect(() => {
    if (!isConnected && !isLoading && wsRef.current === null) {
      const reconnectTimeout = setTimeout(() => {
        console.log("[MempoolContext] Attempting to reconnect...");
        subscribeToMempool();
      }, 5000); // Reconnect after 5 seconds

      return () => clearTimeout(reconnectTimeout);
    }
  }, [isConnected, isLoading, subscribeToMempool]);

  const contextValue: MempoolContextType = {
    transactions,
    isLoading,
    error,
    subscribeToMempool,
    unsubscribeFromMempool,
    isConnected
  };

  return (
    <MempoolContext.Provider value={contextValue}>
      {children}
    </MempoolContext.Provider>
  );
};

export const useMempoolContext = (): MempoolContextType => {
  const context = useContext(MempoolContext);
  if (!context) {
    throw new Error("useMempoolContext must be used within a MempoolProvider");
  }
  return context;
};
