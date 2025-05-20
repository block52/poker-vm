import { useState } from "react";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { useGameOptions, DEFAULT_BIG_BLIND } from "../useGameOptions";

/**
 * Custom hook to handle posting big blind at a poker table
 * @param tableId The ID of the table where the action will be performed
 * @returns Object containing functions for performing big blind action
 */
export function useTablePostBigBlind(tableId?: string) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { client } = useNodeRpc();
    const { gameOptions } = useGameOptions(tableId);

    /**
     * Posts a big blind on the specified table
     * @param options Object containing action parameters
     * @returns Promise resolving to the result of the action
     */
    const postBigBlind = async (options: { 
        actionIndex: number;
        bigBlindAmount?: string;
    }) => {
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

            // Use the provided amount or get from game options
            const amount = options.bigBlindAmount || gameOptions.bigBlind.toString() || DEFAULT_BIG_BLIND;
            
            // Additional data with the action index
            const data = options.actionIndex !== undefined ? 
                JSON.stringify({ index: options.actionIndex }) : 
                undefined;

            // Call the playerAction method
            const response = await client.playerAction(
                tableId, 
                PlayerActionType.BIG_BLIND, 
                amount,
                undefined, // Let the client handle the nonce
                data
            );
            
            return response;
        } catch (err: any) {
            setError(err.message || "Failed to post big blind");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        postBigBlind,
        isPostingBigBlind: isLoading,
        error
    };
}
