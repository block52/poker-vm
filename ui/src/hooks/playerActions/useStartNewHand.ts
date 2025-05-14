import { useState } from "react";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { TransactionResponse } from "@bitcoinbrisbane/block52";

interface StartNewHandParams {
    nonce?: number | string;
    seed?: string;
}

export function useStartNewHand(tableId: string | undefined) {
    const [isStartingNewHand, setIsStartingNewHand] = useState(false);
    const { client } = useNodeRpc();
    
    // Create a simple function that calls client.newHand
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
            let nonceValue: number | undefined = undefined;
            if (nonce !== undefined) {
                nonceValue = typeof nonce === "number" ? nonce : parseInt(nonce.toString());
            }
            
            // Call the newHand method directly from the client
            const response = await client.newHand(tableId, seed, nonceValue);
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
