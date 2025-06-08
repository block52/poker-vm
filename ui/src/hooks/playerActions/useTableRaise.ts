import { useState } from "react";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";

/**
 * Custom hook to handle raising in a poker game
 * @param tableId The ID of the table where the action will be performed
 * @returns Object containing functions for raising a bet
 */
export function useTableRaise(tableId?: string) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { client } = useNodeRpc();

    /**
     * Raises the bet on the specified table
     * @param options Object containing action parameters
     * @returns Promise resolving to the result of the action
     */
    const raiseHand = async (options: { amount: string }) => {
        if (!tableId) {
            setError("Table ID is required");
            return;
        }

        if (!options.amount) {
            setError("Raise amount is required");
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
                PlayerActionType.RAISE,
                options.amount,
                undefined // Let the client handle the nonce
            );

            return response;
        } catch (err: any) {
            setError(err.message || "Failed to raise bet");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        raiseHand,
        isRaising: isLoading,
        error
    };
}
