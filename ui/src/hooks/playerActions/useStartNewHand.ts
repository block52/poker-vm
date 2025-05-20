import { useState } from "react";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { TransactionResponse } from "@bitcoinbrisbane/block52";
import { StartNewHandParams } from "../../types/index";

export function useStartNewHand(tableId: string | undefined) {
    const [isStartingNewHand, setIsStartingNewHand] = useState(false);
    const { client } = useNodeRpc();
    
    // Update to use newHand method from SDK
    const startNewHand = async (params: StartNewHandParams): Promise<TransactionResponse> => {
        const { seed = Math.random().toString(36).substring(2, 15), nonce } = params;
        
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
            
            // Convert nonce to number if needed
            // let nonceValue: number | undefined = undefined;
            // if (nonce !== undefined) {
            //     nonceValue = typeof nonce === "number" ? nonce : parseInt(nonce.toString());
            // }
            
            // Use the SDK's newHand method instead of playerAction
            // const result = await client.newHand("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "", 0);
            const response = await client.newHand(tableId, "", 0);
            
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
