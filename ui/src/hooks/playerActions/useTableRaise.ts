import useSWRMutation from "swr/mutation";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { HandParams } from "./types";

/**
 * Hook to handle the raise action on a poker table
 * @param tableId The ID of the table
 * @returns Object with raiseHand function and loading state
 */
export function useTableRaise(tableId?: string) {
    // Get the Node RPC client
    const { client } = useNodeRpc();

    // Create a fetcher that has access to the client
    const raiseFetcher = async (_url: string, { arg }: { arg: HandParams }) => {
        const { privateKey, actionIndex, amount, nonce = Date.now().toString() } = arg;

        console.log("💰 Raise attempt");
        console.log("💰 Using action index:", actionIndex);
        console.log("💰 Raising amount:", amount);
        console.log("💰 Using nonce:", nonce);

        if (!privateKey) {
            console.error("💰 Missing private key");
            throw new Error("Missing private key");
        }

        if (!amount) {
            console.error("💰 Missing amount");
            throw new Error("Raise amount is required");
        }

        // Format: "raise" + amount + tableId + timestamp
        const timestamp = Math.floor(Date.now() / 1000);
        
        try {
            // Check if the client is available
            if (!client) {
                throw new Error("Node RPC client not available");
            }

            if (!tableId) {
                throw new Error("Table ID is required");
            }

            console.log("💰 Calling playerAction with params:", {
                tableId,
                action: PlayerActionType.RAISE,
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
                PlayerActionType.RAISE,
                amount,
                typeof nonce === "number" ? nonce : parseInt(nonce.toString()),
                JSON.stringify({index: actionIndex})
            );

            console.log("💰 Raise response:", response);
            return response;
        } catch (error) {
            console.error("💰 Raise error:", error);
            throw error;
        }
    };

    const { trigger, isMutating, error, data } = useSWRMutation(
        tableId ? `raise_${tableId}` : null, 
        raiseFetcher
    );

    // Add better error handling
    if (error) {
        console.error("Raise hook error:", error instanceof Error ? error.message : String(error));
    }

    return {
        raiseHand: tableId 
            ? (params: HandParams) => trigger(params)
            : null,
        isRaising: isMutating,
        error
    };
}
