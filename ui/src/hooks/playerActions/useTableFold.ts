import { useState } from "react";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";

/**
 * Custom hook to handle folding in a poker game
 * @param tableId The ID of the table where the action will be performed
 * @returns Object containing functions for folding a hand
 */
export function useTableFold(tableId?: string) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { client } = useNodeRpc();

    /**
     * Folds the player's hand on the specified table
     * @param options Object containing action parameters
     * @returns Promise resolving to the result of the action
     */
    const foldHand = async () => {
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

            // Call the playerAction method
            const response = await client.playerAction(
                tableId,
                PlayerActionType.FOLD,
                "0", // Fold doesn't require an amount, but API expects it
                undefined // Let the client handle the nonce
            );

            return response;
        } catch (err: any) {
            setError(err.message || "Failed to fold hand");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        foldHand,
        isFolding: isLoading,
        error
    };
}
