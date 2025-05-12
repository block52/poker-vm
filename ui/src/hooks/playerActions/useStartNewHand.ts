import useSWRMutation from "swr/mutation";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { StartNewHandOptions } from "./types";

export function useStartNewHand(tableId: string | undefined) {
    // Get the Node RPC client
    const { client } = useNodeRpc();

    // Create a fetcher that has access to the client
    const startNewHandFetcher = async (_url: string, { arg }: { arg: StartNewHandOptions }) => {
        const { privateKey, nonce = Date.now().toString(), seed = Math.random().toString(36).substring(2, 15) } = arg;

        console.log("🔄 Start new hand attempt");
        console.log("🔄 Using nonce:", nonce);
        console.log("🔄 Using seed:", seed);

        if (!privateKey) {
            console.error("🔄 Missing private key");
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

            console.log("🔄 Table ID for new hand:", tableId);
            
            console.log("🔄 Calling newHand with params:", {
                tableId,
                seed,
                nonce: typeof nonce === "number" ? nonce : parseInt(nonce.toString())
            });

            // Call newHand method on the client
            const response = await client.newHand(
                tableId,
                seed,
                typeof nonce === "number" ? nonce : parseInt(nonce.toString())
            );

            console.log("🔄 New hand response:", response);
            return response;
        } catch (error) {
            console.error("🔄 New hand error:", error);
            throw error;
        }
    };

    const { trigger, isMutating, error, data } = useSWRMutation(
        tableId ? `new_hand_${tableId}` : null, 
        startNewHandFetcher
    );

    // Add better error handling
    if (error) {
        console.error("New hand hook error:", error instanceof Error ? error.message : String(error));
    }

    // Return start new hand handler
    const result = {
        startNewHand: tableId
            ? (options: StartNewHandOptions) =>
                  trigger({
                      ...options
                  })
            : null,
        isStartingNewHand: isMutating,
        error,
        data
    };

    console.log("[useStartNewHand] Returns:", {
        hasStartNewHandFunction: !!result.startNewHand,
        isStartingNewHand: result.isStartingNewHand,
        hasError: !!result.error,
        hasData: !!result.data,
        tableId,
        hasClient: !!client
    });

    return result;
}
