import { useCallback } from "react";
import { useGameStateContext } from "../../context/GameStateContext";
import { useNetwork } from "../../context/NetworkContext";
import type { PlayerActionResult } from "../../types";

// Import all action functions
import { betHand } from "./betHand";
import { callHand } from "./callHand";
import { checkHand } from "./checkHand";
import { foldHand } from "./foldHand";
import { raiseHand } from "./raiseHand";
import { muckCards } from "./muckCards";
import { showCards } from "./showCards";
import { sitIn } from "./sitIn";
import { sitOut } from "./sitOut";

type ActionType = "fold" | "call" | "check" | "bet" | "raise" | "muck" | "show" | "sit_in" | "sit_out";

interface UseOptimisticActionReturn {
    performOptimisticAction: (
        tableId: string,
        action: ActionType,
        amount?: bigint
    ) => Promise<PlayerActionResult>;
    isPending: boolean;
}

/**
 * Hook that wraps player actions with optimistic updates.
 *
 * This hook:
 * 1. Sends the action via WebSocket for immediate broadcast to all subscribers
 * 2. Executes the actual blockchain transaction
 * 3. The WebSocket server will broadcast "pending" state immediately
 * 4. When the block confirms, the server broadcasts "confirmed" state
 *
 * Usage:
 *   const { performOptimisticAction } = useOptimisticAction();
 *   await performOptimisticAction(tableId, "fold");
 *   await performOptimisticAction(tableId, "raise", 100n);
 */
export function useOptimisticAction(): UseOptimisticActionReturn {
    const { sendAction, pendingAction } = useGameStateContext();
    const { currentNetwork } = useNetwork();

    const performOptimisticAction = useCallback(
        async (
            tableId: string,
            action: ActionType,
            amount?: bigint
        ): Promise<PlayerActionResult> => {
            console.log(`🚀 [useOptimisticAction] Starting optimistic action: ${action}`);

            // Step 1: Send via WebSocket for immediate optimistic broadcast
            try {
                await sendAction(action, amount?.toString());
                console.log(`✅ [useOptimisticAction] WebSocket notification sent for: ${action}`);
            } catch (wsError) {
                // WebSocket notification failed - continue with transaction anyway
                console.warn(`⚠️ [useOptimisticAction] WebSocket notification failed:`, wsError);
            }

            // Step 2: Execute the actual blockchain transaction
            let result: PlayerActionResult;

            switch (action) {
                case "fold":
                    result = await foldHand(tableId, currentNetwork);
                    break;
                case "call":
                    // callHand signature: (tableId, amount, network) - amount is required
                    if (amount === undefined) throw new Error("Amount required for call");
                    result = await callHand(tableId, amount, currentNetwork);
                    break;
                case "check":
                    result = await checkHand(tableId, currentNetwork);
                    break;
                case "bet":
                    if (amount === undefined) throw new Error("Amount required for bet");
                    // betHand signature: (tableId, amount, network)
                    result = await betHand(tableId, amount, currentNetwork);
                    break;
                case "raise":
                    if (amount === undefined) throw new Error("Amount required for raise");
                    // raiseHand signature: (tableId, amount, network)
                    result = await raiseHand(tableId, amount, currentNetwork);
                    break;
                case "muck":
                    result = await muckCards(tableId, currentNetwork);
                    break;
                case "show":
                    result = await showCards(tableId, currentNetwork);
                    break;
                case "sit_in":
                    result = await sitIn(tableId, currentNetwork);
                    break;
                case "sit_out":
                    result = await sitOut(tableId, currentNetwork);
                    break;
                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            console.log(`✅ [useOptimisticAction] Transaction submitted: ${result.hash}`);
            return result;
        },
        [sendAction, currentNetwork]
    );

    return {
        performOptimisticAction,
        isPending: pendingAction !== null
    };
}
