import React, { createContext, useContext, useState, useEffect } from "react";
import { NodeRpcClient, IClient } from "@bitcoinbrisbane/block52";

// Define the context shape
interface NodeRpcContextType {
  client: IClient | null;
  isLoading: boolean;
  error: Error | null;
}

// Create the context with default values
const NodeRpcContext = createContext<NodeRpcContextType>({
  client: null,
  isLoading: true,
  error: null
});

// Custom hook to use the context
export const useNodeRpc = () => useContext(NodeRpcContext);

interface NodeRpcProviderProps {
  children: React.ReactNode;
  nodeUrl?: string;
}

// Provider component
export const NodeRpcProvider: React.FC<NodeRpcProviderProps> = ({ 
  children, 
  nodeUrl = "http://localhost:3000" 
}) => {
  const [client, setClient] = useState<IClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initClient = async () => {
      try {
        // Get the private key from browser storage
        const privateKey = localStorage.getItem("user_eth_private_key");
        
        if (!privateKey) {
          console.log("No private key found, client will be initialized when a key is available");
          setIsLoading(false);
          return;
        }

        // Create a new client instance using the official NodeRpcClient
        const newClient = new NodeRpcClient(nodeUrl, privateKey);
        setClient(newClient);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize NodeRpcClient", err);
        setError(err instanceof Error ? err : new Error("Unknown error initializing client"));
        setIsLoading(false);
      }
    };

    initClient();

    // Re-initialize client when storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user_eth_private_key") {
        console.log("Private key changed, reinitializing client");
        initClient();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [nodeUrl]);

  const value = {
    client,
    isLoading,
    error
  };

  return (
    <NodeRpcContext.Provider value={value}>
      {children}
    </NodeRpcContext.Provider>
  );
};

export default NodeRpcContext; 