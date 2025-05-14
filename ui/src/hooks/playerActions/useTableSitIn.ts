import { useState } from "react";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";

/**
 * Custom hook to handle sitting in at a poker table
 * @param tableId The ID of the table where the action will be performed
 * @returns Object containing functions for performing sit in action
 */
export const useTableSitIn = (tableId?: string) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { client } = useNodeRpc();

    /**
     * Executes a sit in action on the specified table
     * @returns Promise resolving to the result of the sit in action
     */
    const sitIn = async () => {
        if (!tableId) {
            setError("Table ID is required");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Make the API call
            if (!client) {
                setError("Client is not initialized");
                return;
            }

            // SIT_IN doesn't require an amount, so pass "0"
            const response = await client.playerAction(tableId, PlayerActionType.SIT_IN, "0");
            return response;
        } catch (err: any) {
            setError(err.message || "Failed to sit in");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        sitIn,
        isLoading,
        error
    };
};
