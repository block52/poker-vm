import { useState } from "react";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";

interface MuckCardsParams {
    privateKey: string;
    actionIndex: number;
}

export function useTableMuck(tableId?: string) {
    const [isMucking, setIsMucking] = useState(false);
    const { client } = useNodeRpc();

    const muckCards = async (params: MuckCardsParams) => {
        if (!tableId) {
            console.error("No table ID provided");
            return;
        }

        if (!client) {
            console.error("RPC client not initialized");
            return;
        }

        setIsMucking(true);

        try {
            // Use the SDK's playerAction method directly
            const response = await client.playerAction(
                tableId,
                PlayerActionType.MUCK,
                "0", // No amount needed for mucking
                undefined, // Let the client handle the nonce
                params.actionIndex.toString() // Pass the action index as data
            );

            return response;
        } catch (error) {
            console.error("Error mucking cards:", error);
            throw error;
        } finally {
            setIsMucking(false);
        }
    };

    return {
        muckCards,
        isMucking
    };
}
