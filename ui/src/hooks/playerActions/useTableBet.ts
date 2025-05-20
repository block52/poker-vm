import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { HandParams } from "./types";
import { useState } from "react";

/**
 * Custom hook to handle betting in a poker game
 * @param tableId The ID of the table where the action will be performed
 * @returns Object containing functions for performing bet action
 */
export const useTableBet = (tableId?: string) => {
    // Get the Node RPC client
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { client } = useNodeRpc();

    // Create a fetcher that has access to the client
    const bet = async ({ arg }: { arg: HandParams }) => {
        const { amount } = arg;

        try {
            // Make the API call
            if (!client) {
                setError("Client is not initialized");
                return;
            }

            if (!tableId) {
                throw new Error("Table ID is required");
            }

            // Call playerAction method on the client
            const response = await client.playerAction(tableId, PlayerActionType.BET, amount);
            return response;
        } catch (error) {
            console.error("🎲 Bet error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        bet,
        isLoading,
        error
    };
};
