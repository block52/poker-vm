import { useState } from "react";
import { NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";

/**
 * Custom hook to handle dealing cards in a poker game
 * @param tableId The ID of the table where the action will be performed
 * @returns Object containing functions for dealing cards
 */
export function useTableDeal(tableId?: string) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { client } = useNodeRpc();

    /**
     * Deals cards on the specified table
     * @param options Object containing action parameters
     * @returns Promise resolving to the result of the action
     */
    const dealCards = async () => {
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

            // Create a seed from timestamp for randomness
            const timestamp = Math.floor(Date.now() / 1000);
            const seed = `${timestamp}-${Math.random().toString(36).substring(2, 15)}`;

            // Call the deal method on the client
            const response = await client.deal(
                tableId,
                seed,
                "", // The publicKey is not actually used in the interface
                undefined // Let the client handle the nonce
            );
            
            return response;
        } catch (err: any) {
            setError(err.message || "Failed to deal cards");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        dealCards,
        isDealing: isLoading,
        error
    };
}
