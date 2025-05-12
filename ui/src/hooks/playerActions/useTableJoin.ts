// ui/src/hooks/useTableJoin.ts
import useSWRMutation from "swr/mutation";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { JoinTableOptions } from "./types";

async function joinTableFetcher(_url: string, { arg }: { arg: JoinTableOptions }) {
    const { buyInAmount, privateKey, nonce = Date.now().toString(), actionIndex = 0, seatNumber } = arg;

    if (!privateKey) {
        throw new Error("Missing private key");
    }

    // Get the client from the window object (will be set in useTableJoin)
    const client = (window as any).__nodeRpcClient;
    if (!client) {
        throw new Error("Node RPC client not available");
    }

    const tableId = _url.split("_")[1]; // Extract table ID from the key

    console.log("🎮 Join table attempt");
    console.log("🎮 Using action index:", actionIndex);
    console.log("🎮 Buy-in amount:", buyInAmount);
    console.log("🎮 Seat number:", seatNumber !== undefined ? seatNumber : "auto-assign");
    console.log("🎮 Using nonce:", nonce);

    try {
        // Convert the buyInAmount from string to bigint
        const buyInAmountBigInt = BigInt(buyInAmount);
        
        // Use the client's playerJoin method
        const response = await client.playerJoin(
            tableId,
            buyInAmountBigInt,
            seatNumber !== undefined ? seatNumber : 0, // Use specified seat or default to 0
            typeof nonce === "number" ? nonce : parseInt(nonce.toString())
        );

        console.log("🎮 Join table response:", response);
        return response;
    } catch (error) {
        console.error("🎮 Join table error:", error);
        throw error;
    }
}

export function useTableJoin(tableId: string | undefined) {
    // Get the Node RPC client
    const { client } = useNodeRpc();
    
    // Store the client in a global variable so it can be accessed in the fetcher
    // This is a workaround since we can't pass the client directly to the fetcher
    if (client) {
        (window as any).__nodeRpcClient = client;
    }

    const { trigger, isMutating, error, data } = useSWRMutation(
        tableId ? `join_${tableId}` : null, 
        joinTableFetcher
    );

    // Add better error handling
    if (error) {
        console.error("Join table hook error:", error instanceof Error ? error.message : String(error));
    }

    return {
        joinTable: tableId 
            ? (params: JoinTableOptions) => trigger(params)
            : null,
        isJoining: isMutating,
        error,
        data
    };
}
