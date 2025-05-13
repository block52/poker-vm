import { useState } from "react";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";

interface ShowCardsParams {
    privateKey: string;
    actionIndex: number;
}

export function useTableShow(tableId?: string) {
    const [isShowing, setIsShowing] = useState(false);
    const { client } = useNodeRpc();

    const showCards = async (params: ShowCardsParams) => {
        if (!tableId) {
            console.error("No table ID provided");
            return;
        }

        if (!client) {
            console.error("RPC client not initialized");
            return;
        }

        setIsShowing(true);

        try {
            // Use the SDK's playerAction method directly
            const response = await client.playerAction(
                tableId,
                PlayerActionType.SHOW,
                "0", // No amount needed for showing
                undefined, // Let the client handle the nonce
                params.actionIndex.toString() // Pass the action index as data
            );

            return response;
        } catch (error) {
            console.error("Error showing cards:", error);
            throw error;
        } finally {
            setIsShowing(false);
        }
    };

    return {
        showCards,
        isShowing
    };
}
