import useSWRMutation from "swr/mutation";
import { NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { DealOptions } from "./types";

export function useTableDeal(tableId: string | undefined) {
    // Get the Node RPC client
    const { client } = useNodeRpc();

    // Create a fetcher that has access to the client
    const dealFetcher = async (_url: string, { arg }: { arg: DealOptions }) => {
        const { userAddress, privateKey, publicKey, nonce = Date.now().toString(), actionIndex } = arg;

        console.log("🃏 Deal cards attempt");
        console.log("🃏 Using action index:", actionIndex, typeof actionIndex);

        if (!userAddress || !privateKey) {
            console.error("🃏 Missing address or private key");
            throw new Error("Missing user address or private key");
        }

        // Ensure address is lowercase to avoid case-sensitivity issues
        const normalizedAddress = userAddress.toLowerCase();
        console.log("🃏 Using normalized address:", normalizedAddress);

        // Create a seed from timestamp for randomness
        const timestamp = Math.floor(Date.now() / 1000);
        const seed = `${timestamp}-${Math.random().toString(36).substring(2, 15)}`;
        
        try {
            // Check if the client is available
            if (!client) {
                throw new Error("Node RPC client not available");
            }

            if (!tableId) {
                throw new Error("Table ID is required");
            }

            // Use the client's deal method
            const response = await client.deal(
                tableId,
                seed,
                (publicKey || userAddress).toLowerCase(),
                typeof nonce === "number" ? nonce : parseInt(nonce.toString())
            );

            console.log("🃏 Deal response:", response);
            return response;
        } catch (error) {
            console.error("🃏 Deal error:", error);
            throw error;
        }
    };

    const { trigger, isMutating, error, data } = useSWRMutation(
        tableId ? `deal_${tableId}` : null, 
        dealFetcher
    );

    // Add better error handling
    if (error) {
        console.error("Deal hook error:", error instanceof Error ? error.message : String(error));
    }

    // Return deal handler that accepts action index
    const result = {
        dealCards: tableId
            ? (options: Omit<DealOptions, "actionIndex"> & { actionIndex?: number | null }) =>
                  trigger({
                      ...options
                  })
            : null,
        isDealing: isMutating,
        error,
        data
    };

    console.log("[useTableDeal] Returns:", {
        hasDealCardsFunction: !!result.dealCards,
        isDealing: result.isDealing,
        hasError: !!result.error,
        hasData: !!result.data,
        tableId,
        hasClient: !!client
    });

    return result;
}
