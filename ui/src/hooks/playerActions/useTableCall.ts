import { useState } from "react";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { HandParams } from "./types";
// import { NodeRpcClient } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";

/**
 * Custom hook to handle calling in a poker game
 * @param tableId The ID of the table where the action will be performed
 * @returns Object containing functions for performing call action
 */
export const useTableCall = (tableId?: string) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { client } = useNodeRpc();

    /**
     * Executes a call action on the specified table
     * @param params Parameters needed for the call action
     * @returns Promise resolving to the result of the call action
     */
    const callHand = async (params: HandParams) => {
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

            const response = await client.playerAction(tableId, PlayerActionType.CALL, params.amount);
            return response.data;
        } catch (err: any) {
            setError(err.message || "Failed to call");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        callHand,
        isLoading,
        error
    };
};
