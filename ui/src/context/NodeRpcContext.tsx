import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { NodeRpcClient, IClient } from "@bitcoinbrisbane/block52";
import { ErrorLog } from "../types/index";

// Define the context shape
interface NodeRpcContextType {
    client: IClient | null;
    isLoading: boolean;
    error: Error | null;
    errorLogs: ErrorLog[];
    clearErrorLogs: () => void;
    logError: (message: string, severity: "error" | "warning" | "info", source: "API" | "UI" | "System", details?: any) => void;
}

// Create the context with default values
const NodeRpcContext = createContext<NodeRpcContextType>({
    client: null,
    isLoading: true,
    error: null,
    errorLogs: [],
    clearErrorLogs: () => {},
    logError: () => {},
});

// Custom hook to use the context
export const useNodeRpc = () => useContext(NodeRpcContext);

interface NodeRpcProviderProps {
    children: React.ReactNode;
    nodeUrl?: string;
}

// Provider component
export const NodeRpcProvider: React.FC<NodeRpcProviderProps> = ({ children, nodeUrl = import.meta.env.VITE_NODE_RPC_URL || "https://node1.block52.xyz/" }) => {
    const [client, setClient] = useState<IClient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);

    // Function to log errors
    const logError = useCallback((message: string, severity: "error" | "warning" | "info", source: "API" | "UI" | "System", details?: any) => {
        const newError: ErrorLog = {
            id: crypto.randomUUID(),
            message,
            timestamp: new Date(),
            severity,
            source,
            details
        };
        setErrorLogs(prev => [newError, ...prev]);
    }, []);

    // Function to clear error logs
    const clearErrorLogs = useCallback(() => {
        setErrorLogs([]);
    }, []);

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
                const errorObj = err instanceof Error ? err : new Error("Unknown error initializing client");
                setError(errorObj);
                logError(
                    `Failed to initialize client: ${errorObj.message}`, 
                    "error", 
                    "System", 
                    { error: err }
                );
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
    }, [nodeUrl, logError]);

    const value = {
        client,
        isLoading,
        error,
        errorLogs,
        clearErrorLogs,
        logError,
    };

    return <NodeRpcContext.Provider value={value}>{children}</NodeRpcContext.Provider>;
};

export default NodeRpcContext;
