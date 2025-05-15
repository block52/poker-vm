import { useState } from "react";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { PerformActionResponse } from "@bitcoinbrisbane/block52";
import { LeaveTableOptions } from "../../types/index";


/**
 * Custom hook to handle leaving a poker table
 * @param tableId The ID of the table where the action will be performed
 * @returns Object containing functions for performing leave table action
 */
export function useTableLeave(tableId: string | undefined) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [data, setData] = useState<PerformActionResponse | null>(null);
    const { client } = useNodeRpc();

    /**
     * Execute a leave table action
     * @param options Options for leaving the table, including amount
     * @returns Promise resolving to the result of the leave action
     */
    const leaveTable = async (options: LeaveTableOptions): Promise<PerformActionResponse> => {
        if (!tableId) {
            const err = new Error("Table ID is required");
            setError(err);
            return Promise.reject(err);
        }

        setIsLoading(true);
        setError(null);

        try {
            // Check if the client is available
            if (!client) {
                const err = new Error("Node RPC client not available");
                setError(err);
                return Promise.reject(err);
            }

            // Convert the amount from string to bigint
            const amountBigInt = BigInt(options.amount);
            
            console.log("👋 Leaving table:", {
                tableId,
                amount: amountBigInt.toString(),
                nonce: options.nonce
            });

            // Call playerLeave method on the client
            const response = await client.playerLeave(tableId, amountBigInt, options.nonce);
            console.log("👋 Leave table response:", response);
            
            setData(response);
            return response;
        } catch (err) {
            console.error("👋 Leave table error:", err);
            setError(err instanceof Error ? err : new Error("Failed to leave table"));
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        leaveTable,
        isLeaving: isLoading,
        error,
        data
    };
}