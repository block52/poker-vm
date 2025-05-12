import useSWRMutation from "swr/mutation";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { HandParams } from "./types";

/**
 * Custom hook to handle betting in a poker game
 * @param tableId The ID of the table where the action will be performed
 * @returns Object containing functions for performing bet action
 */
export const useTableBet = (tableId?: string) => {
    // Get the Node RPC client
    const { client } = useNodeRpc();

    // Create a fetcher that has access to the client
    const betFetcher = async (_url: string, { arg }: { arg: HandParams }) => {
        const { privateKey, actionIndex, amount, nonce = Date.now().toString() } = arg;

        console.log("🎲 Bet attempt");
        console.log("🎲 Using action index:", actionIndex);
        console.log("🎲 Betting amount:", amount);
        console.log("🎲 Using nonce:", nonce);

        if (!privateKey) {
            console.error("🎲 Missing private key");
            throw new Error("Missing private key");
        }

        // Format: "bet" + amount + tableId + timestamp
        const timestamp = Math.floor(Date.now() / 1000);
        
        try {
            // Check if the client is available
            if (!client) {
                throw new Error("Node RPC client not available");
            }

            if (!tableId) {
                throw new Error("Table ID is required");
            }

            console.log("🎲 Calling playerAction with params:", {
                tableId,
                action: PlayerActionType.BET,
                amount,
                nonce: typeof nonce === "number" ? nonce : parseInt(nonce.toString()),
                data: {
                    index: actionIndex,
                    timestamp,
                }
            });

            // Call playerAction method on the client
            const response = await client.playerAction(
                tableId,
                PlayerActionType.BET,
                amount,
                typeof nonce === "number" ? nonce : parseInt(nonce.toString()),
                JSON.stringify({
                    index: actionIndex,
                    timestamp
                })
            );

            console.log("🎲 Bet response:", response);
            return response;
        } catch (error) {
            console.error("🎲 Bet error:", error);
            throw error;
        }
    };

    const { trigger, isMutating, error, data } = useSWRMutation(
        tableId ? `bet_${tableId}` : null, 
        betFetcher
    );

    // Add better error handling
    if (error) {
        console.error("Bet hook error:", error instanceof Error ? error.message : String(error));
    }

    return {
        betHand: tableId 
            ? (params: HandParams) => trigger(params)
            : null,
        isLoading: isMutating,
        error
    };
};
