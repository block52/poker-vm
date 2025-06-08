import { useState } from "react";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { useGameOptions } from "../useGameOptions";

/**
 * Custom hook to handle posting small blind at a poker table
 * @param tableId The ID of the table where the action will be performed
 * @returns Object containing functions for performing small blind action
 */
export function useTablePostSmallBlind(tableId?: string) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { client } = useNodeRpc();
    const { gameOptions } = useGameOptions();

    /**
     * Posts a small blind on the specified table
     * @param options Object containing action parameters
     * @returns Promise resolving to the result of the action
     */
    const postSmallBlind = async (options: { smallBlindAmount?: string }) => {
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
            const amount = options.smallBlindAmount || gameOptions?.smallBlind;
            
            if (!amount) {
                setError("Small blind amount not available from game options");
                return;
            }

            // Call the playerAction method
            const response = await client.playerAction(
                tableId,
                PlayerActionType.SMALL_BLIND,
                amount,
                undefined // Let the client handle the nonce
            );

            return response;
        } catch (err: any) {
            setError(err.message || "Failed to post small blind");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        postSmallBlind,
        isPostingSmallBlind: isLoading,
        error
    };
}
