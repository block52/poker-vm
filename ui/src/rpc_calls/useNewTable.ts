import { useState, useCallback } from "react";
import { useNodeRpc } from "../context/NodeRpcContext";

export interface UseNewTableReturn {
    createTable: (owner: string, nonce: number) => Promise<string | null>;
    isCreating: boolean;
    error: Error | null;
    newTableAddress: string | null;
}

/**
 * Custom hook to create a new table using RPC call
 * @returns Object with createTable function, loading state, and error
 */
export const useNewTable = (): UseNewTableReturn => {
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [newTableAddress, setNewTableAddress] = useState<string | null>(null);
    const { client } = useNodeRpc();

    const createTable = useCallback(async (owner: string, nonce: number): Promise<string | null> => {
        if (!client) {
            setError(new Error("Client not initialized"));
            return null;
        }

        setIsCreating(true);
        setError(null);
        setNewTableAddress(null);

        try {
            // Hardcoded game options string: texas-holdem,cash,2,9,10000000000000000,20000000000000000,10000000000000000,1000000000000000000,30000
            const gameOptionsString = "texas-holdem,cash,2,9,10000000000000000,20000000000000000,10000000000000000,1000000000000000000,30000";
            
            // Add timestamp to ensure uniqueness
            const timestamp = Date.now().toString();
            
            console.log("🚀 Creating New Table:");
            console.log(`Owner: ${owner}`);
            console.log(`Nonce: ${nonce}`);
            console.log(`Timestamp: ${timestamp}`);
            console.log(`Game Options: ${gameOptionsString}`);
            
            // Make direct RPC call
            const rpcUrl = import.meta.env.VITE_NODE_RPC_URL || "https://node1.block52.xyz/";
            const requestId = Math.random().toString(36).substring(7);
            
            const rpcRequest = {
                id: requestId,
                method: "new_table",
                params: [gameOptionsString, owner, nonce, timestamp]
            };

            console.log("📡 RPC Request:", rpcRequest);

            const response = await fetch(rpcUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(rpcRequest)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            const tableAddress = data.result?.data || data.result;
            setNewTableAddress(tableAddress);
            
            return tableAddress;
        } catch (err: any) {
            const errorMessage = err.message || "Failed to create table";
            setError(new Error(errorMessage));
            console.error("Error creating table:", err);
            return null;
        } finally {
            setIsCreating(false);
        }
    }, [client]);

    return {
        createTable,
        isCreating,
        error,
        newTableAddress
    };
};
