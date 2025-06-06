import { useState } from "react";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { TransactionResponse } from "@bitcoinbrisbane/block52";
import { StartNewHandParams } from "../../types/index";

export function useStartNewHand(tableId: string | undefined) {
    const [isStartingNewHand, setIsStartingNewHand] = useState(false);
    const { client } = useNodeRpc();

    // Update to use newHand method from SDK
    const startNewHand = async (params: StartNewHandParams): Promise<TransactionResponse> => {
        const { seed = Math.random().toString(36).substring(2, 15) } = params;

        if (!tableId) {
            console.error("No table ID provided");
            throw new Error("Table ID is required");
        }

        if (!client) {
            console.error("Node RPC client not available");
            throw new Error("Node RPC client not available");
        }

        try {
            setIsStartingNewHand(true);
            console.log(`Starting new hand for table ${tableId} with seed: ${seed}`);

            const response = await client.newHand(tableId, 0);
            console.log("New hand started successfully:", response);
            return response;
        } catch (error) {
            console.error("Error starting new hand:", error);
            throw error;
        } finally {
            setIsStartingNewHand(false);
        }
    };

    return {
        startNewHand,
        isStartingNewHand
    };
}
