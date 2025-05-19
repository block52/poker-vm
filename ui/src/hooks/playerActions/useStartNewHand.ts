import { useState } from "react";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { TransactionResponse, NonPlayerActionType, PlayerActionType } from "@bitcoinbrisbane/block52";
import { StartNewHandParams } from "../../types/index";

export function useStartNewHand(tableId: string | undefined) {
    const [isStartingNewHand, setIsStartingNewHand] = useState(false);
    const { client } = useNodeRpc();
    
    // Create a function that uses playerAction with NEW_HAND action type
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
            
            // Use playerAction with NEW_HAND action type
            // Pass seed as the data parameter and "0" as the amount (not used for NEW_HAND)
            // Cast to PlayerActionType to satisfy the type system
            const response = await client.playerAction(
                tableId, 
                NonPlayerActionType.NEW_HAND as unknown as PlayerActionType, 
                "0", 
                nonceValue,
                seed
            );
            
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
