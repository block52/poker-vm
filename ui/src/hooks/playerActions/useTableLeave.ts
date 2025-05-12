import useSWRMutation from "swr/mutation";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { LeaveTableOptions } from "./types";

export function useTableLeave(tableId: string | undefined) {
    // Get the Node RPC client
    const { client } = useNodeRpc();

    // Create a fetcher that has access to the client
    const leaveFetcher = async (_url: string, { arg }: { arg: LeaveTableOptions }) => {
        const { privateKey, amount = "0", nonce = Date.now().toString(), actionIndex } = arg;

        console.log("👋 Leave table attempt");
        console.log("👋 Using amount:", amount);
        console.log("👋 Using nonce:", nonce);

        if (!privateKey) {
            console.error("👋 Missing private key");
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

            // Convert the amount from string to bigint
            const amountBigInt = BigInt(amount);
            
            console.log("👋 Calling playerLeave with params:", {
                tableId,
                amount: amountBigInt.toString(),
                nonce: typeof nonce === "number" ? nonce : parseInt(nonce.toString())
            });

            // Call playerLeave method on the client
            const response = await client.playerLeave(
                tableId,
                amountBigInt,
                typeof nonce === "number" ? nonce : parseInt(nonce.toString())
            );

            console.log("👋 Leave table response:", response);
            return response;
        } catch (error) {
            console.error("👋 Leave table error:", error);
            throw error;
        }
    };

    const { trigger, isMutating, error, data } = useSWRMutation(
        tableId ? `leave_${tableId}` : null, 
        leaveFetcher
    );

    // Add better error handling
    if (error) {
        console.error("Leave table hook error:", error instanceof Error ? error.message : String(error));
    }

    // Get player's stack from the table data if needed
    const leaveTableWithStack = async (options: LeaveTableOptions = {}) => {
        return trigger(options);
    };

    return {
        leaveTable: tableId ? leaveTableWithStack : null,
        isLeaving: isMutating,
        error,
        data
    };
}
