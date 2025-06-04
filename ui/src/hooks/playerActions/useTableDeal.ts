import { useState } from "react";
import { NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";
import { useGameStateContext } from "../../context/GameStateContext";

/**
 * Custom hook to handle dealing cards in a poker game
 * @param tableId The ID of the table where the action will be performed
 * @returns Object containing functions for dealing cards
 */
export function useTableDeal(tableId?: string) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { client } = useNodeRpc();
    const { gameState } = useGameStateContext();

    /**
     * Deals cards on the specified table
     * @param options Object containing action parameters
     * @returns Promise resolving to the result of the action
     */
    const dealCards = async () => {
        if (!tableId) {
            setError("Table ID is required");
            return;
        }

        // 🃏 DEBUG: Log WebSocket/game state before deal action
        console.log("🔥 [DEAL ACTION STARTING]", {
            timestamp: new Date().toISOString(),
            tableId,
            gameStateBeforeDeal: {
                round: gameState?.round,
                nextToAct: gameState?.nextToAct,
                players: gameState?.players?.map(p => ({
                    seat: p.seat,
                    address: p.address?.substring(0, 8) + "...",
                    status: p.status,
                    hasLegalActions: !!p.legalActions?.length,
                    legalActions: p.legalActions?.map(action => action.action)
                })),
                hasGameState: !!gameState,
                dealerSeat: gameState?.dealer,
                smallBlindSeat: gameState?.smallBlindPosition,
                bigBlindSeat: gameState?.bigBlindPosition
            },
            source: "useTableDeal.dealCards"
        });

        setIsLoading(true);
        setError(null);

        try {
            // Make the API call
            if (!client) {
                setError("Client is not initialized");
                return;
            }

            // Create a seed from timestamp for randomness
            const timestamp = Math.floor(Date.now() / 1000);
            const seed = `${timestamp}-${Math.random().toString(36).substring(2, 15)}`;

            // Call the deal method on the client
            const response = await client.deal(
                tableId,
                seed,
                "", // The publicKey is not actually used in the interface
                undefined // Let the client handle the nonce
            );
            
            console.log("✅ [DEAL ACTION SUCCESS]", { tableId, response });
            return response;
        } catch (err: any) {
            // 🚨 Enhanced error logging for deal action
            console.error("❌ [DEAL ACTION FAILED]", {
                timestamp: new Date().toISOString(),
                tableId,
                error: err.message,
                gameStateAtError: {
                    round: gameState?.round,
                    nextToAct: gameState?.nextToAct,
                    hasGameState: !!gameState
                },
                source: "useTableDeal.dealCards"
            });
            
            setError(err.message || "Failed to deal cards");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        dealCards,
        isDealing: isLoading,
        error
    };
}
