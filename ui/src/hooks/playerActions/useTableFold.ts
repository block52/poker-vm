import useSWRMutation from "swr/mutation";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { FoldOptions } from "./types";

export function useTableFold(tableId: string | undefined) {
    // Get the Node RPC client
    const { client } = useNodeRpc();

    // Create a fetcher that has access to the client
    const foldFetcher = async (_url: string, { arg }: { arg: FoldOptions }) => {
        const { privateKey, nonce = Date.now().toString(), actionIndex } = arg;

        console.log("🔴 Fold attempt");
        console.log("🔴 Using action index:", actionIndex);
        console.log("🔴 Using nonce:", nonce);

        if (!privateKey) {
            console.error("🔴 Missing private key");
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

            console.log("🔴 Calling playerAction with params:", {
                tableId,
                action: PlayerActionType.FOLD,
                amount: "0", // Fold doesn't require an amount, but API expects it
                nonce: typeof nonce === "number" ? nonce : parseInt(nonce.toString()),
                data: {
                    index: actionIndex
                }
            });

            // Call playerAction method on the client
            const response = await client.playerAction(
                tableId,
                PlayerActionType.FOLD,
                "0", // Fold doesn't require an amount, but API expects it
                typeof nonce === "number" ? nonce : parseInt(nonce.toString()),
                JSON.stringify({index: actionIndex})
            );

            console.log("🔴 Fold response:", response);
            return response;
        } catch (error) {
            console.error("🔴 Fold error:", error);
            throw error;
        }
    };

    const { trigger, isMutating, error, data } = useSWRMutation(
        tableId ? `fold_${tableId}` : null, 
        foldFetcher
    );

    // Add better error handling
    if (error) {
        console.error("Fold hook error:", error instanceof Error ? error.message : String(error));
    }

    return {
        foldHand: tableId 
            ? (options: Omit<FoldOptions, "actionIndex"> & { actionIndex?: number | null }) => 
                trigger({
                    ...options,
                    actionIndex: options.actionIndex !== undefined ? options.actionIndex : 0
                })
            : null,
        isFolding: isMutating,
        error,
        data
    };
}
