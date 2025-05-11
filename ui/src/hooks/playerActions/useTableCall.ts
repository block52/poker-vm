import { useState } from "react";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { HandParams } from "./types";
import { NodeRpcClient } from "@bitcoinbrisbane/block52";

/**
 * Custom hook to handle calling in a poker game
 * @param tableId The ID of the table where the action will be performed
 * @returns Object containing functions for performing call action
 */
export const useTableCall = (tableId?: string) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Executes a call action on the specified table
     * @param params Parameters needed for the call action
     * @returns Promise resolving to the result of the call action
     */
    const callHand = async (params: HandParams) => {
        if (!tableId) {
            console.error("Table ID is required to call");
            setError("Table ID is required");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Create a new client instance using the official NodeRpcClient
            const nodeUrl = process.env.NODE_RPC_URL || "https://node1.block52.xyz/";
            const client = new NodeRpcClient(nodeUrl, params.privateKey);

            // Make the API call
            const response = await client.playerAction(tableId, PlayerActionType.CALL, params.amount);
            return response.data;
        } catch (err: any) {
            console.error("Error calling:", err);
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
