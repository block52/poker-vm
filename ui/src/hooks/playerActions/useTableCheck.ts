import useSWRMutation from "swr/mutation";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { HandParams } from "./types";

/**
 * Hook to handle the check action on a poker table
 * @param tableId The ID of the table
 * @returns Object with checkHand function and loading state
 */
export function useTableCheck(tableId?: string) {
    // Get the Node RPC client
    const { client } = useNodeRpc();

    // Create a fetcher that has access to the client
    const checkFetcher = async (_url: string, { arg }: { arg: HandParams }) => {
        const { privateKey, actionIndex, amount, nonce = Date.now().toString() } = arg;

        console.log("✅ Check attempt");
        console.log("✅ Using action index:", actionIndex);
        console.log("✅ Using nonce:", nonce);

        if (!privateKey) {
            console.error("✅ Missing private key");
            throw new Error("Missing private key");
        }
        
        try {
            // Check if the client is available
            if (!client) {
                throw new Error("Node RPC client not available");
            }

            if (!tableId) {
                throw new Error("Table ID is required");
            }

            console.log("✅ Calling playerAction with params:", {
                tableId,
                action: PlayerActionType.CHECK,
                amount: amount || "0", // Check doesn't require an amount, but API expects it
                nonce: typeof nonce === "number" ? nonce : parseInt(nonce.toString()),
                data: {
                    index: actionIndex
                }
            });

            // Call playerAction method on the client
            const response = await client.playerAction(
                tableId,
                PlayerActionType.CHECK,
                amount || "0", // Check doesn't require an amount, but API expects it
                typeof nonce === "number" ? nonce : parseInt(nonce.toString()),
                JSON.stringify({index: actionIndex})
            );

            console.log("✅ Check response:", response);
            return response;
        } catch (error) {
            console.error("✅ Check error:", error);
            throw error;
        }
    };

    const { trigger, isMutating, error, data } = useSWRMutation(
        tableId ? `check_${tableId}` : null, 
        checkFetcher
    );

    // Add better error handling
    if (error) {
        console.error("Check hook error:", error instanceof Error ? error.message : String(error));
    }

    return {
        checkHand: tableId 
            ? (params: HandParams) => trigger(params)
            : null,
        isChecking: isMutating,
        error
    };
}
