import { useCallback, useMemo } from "react";
import { useCosmosContext } from "./useCosmosContext";
import { joinTable } from "./playerActions/joinTable";
import { leaveTable } from "./playerActions/leaveTable";
import { foldHand } from "./playerActions/foldHand";
import { callHand } from "./playerActions/callHand";
import { betHand } from "./playerActions/betHand";
import { raiseHand } from "./playerActions/raiseHand";
import { checkHand } from "./playerActions/checkHand";
import { sitOut } from "./playerActions/sitOut";
import { sitIn } from "./playerActions/sitIn";

// Environment variable to control which backend to use
const USE_COSMOS = import.meta.env.VITE_USE_COSMOS === "true";

interface GameActionHook {
    // Player actions
    performPokerAction: (gameId: string, action: string, amount?: bigint) => Promise<string>;
    joinGame: (gameId: string, seat: number, buyInAmount: bigint) => Promise<string>;
    leaveGame: (gameId: string) => Promise<string>;
    
    // Game state
    getGameState: (gameId: string) => Promise<any>;
    getLegalActions: (gameId: string, playerAddress: string) => Promise<any>;
    
    // Connection status
    isConnected: boolean;
    backendType: "cosmos" | "proxy";
}

/**
 * Universal hook that can use either Cosmos blockchain or proxy backend
 * depending on environment configuration
 */
export const useGameActions = (): GameActionHook => {
    const cosmosContext = useCosmosContext();

    const backendType = useMemo(() => USE_COSMOS ? "cosmos" : "proxy", []);
    
    const performPokerAction = useCallback(async (gameId: string, action: string, amount: bigint = 0n): Promise<string> => {
        if (USE_COSMOS) {
            return await cosmosContext.performPokerAction(gameId, action, amount);
        } else {
            // Map actions to existing proxy functions
            const amountStr = amount.toString();
            
            switch (action.toLowerCase()) {
                case "fold": {
                    const foldResult = await foldHand(gameId);
                    return foldResult?.hash || "proxy-fold-" + Date.now();
                }
                    
                case "call": {
                    const callResult = await callHand(gameId, amountStr);
                    return callResult?.hash || "proxy-call-" + Date.now();
                }
                    
                case "bet": {
                    const betResult = await betHand(gameId, amountStr);
                    return betResult?.hash || "proxy-bet-" + Date.now();
                }
                    
                case "raise": {
                    const raiseResult = await raiseHand(gameId, amountStr);
                    return raiseResult?.hash || "proxy-raise-" + Date.now();
                }
                    
                case "check": {
                    const checkResult = await checkHand(gameId);
                    return checkResult?.hash || "proxy-check-" + Date.now();
                }
                    
                case "sitout": {
                    const sitoutResult = await sitOut(gameId);
                    return sitoutResult?.hash || "proxy-sitout-" + Date.now();
                }
                    
                case "sitin": {
                    const sitinResult = await sitIn(gameId);
                    return sitinResult?.hash || "proxy-sitin-" + Date.now();
                }
                    
                default:
                    throw new Error(`Unknown action: ${action}`);
            }
        }
    }, [cosmosContext]);

    const joinGame = useCallback(async (gameId: string, seat: number, buyInAmount: bigint): Promise<string> => {
        if (USE_COSMOS) {
            return await cosmosContext.joinGame(gameId, seat, buyInAmount);
        } else {
            // Use the existing proxy-based join with correct parameters
            const result = await joinTable(gameId, {
                amount: buyInAmount.toString(),
                seatNumber: seat
            });
            return result?.hash || "proxy-join-" + Date.now();
        }
    }, [cosmosContext]);

    const leaveGame = useCallback(async (gameId: string): Promise<string> => {
        if (USE_COSMOS) {
            // For Cosmos, we might need to implement a leave game message
            // For now, we can sit out the player
            return await cosmosContext.performPokerAction(gameId, "sitout");
        } else {
            // Use the existing proxy-based leave with correct parameters
            const result = await leaveTable(gameId, "0"); // value parameter required
            return result?.hash || "proxy-leave-" + Date.now();
        }
    }, [cosmosContext]);

    const getGameState = useCallback(async (gameId: string): Promise<any> => {
        if (USE_COSMOS) {
            return await cosmosContext.getGameState(gameId);
        } else {
            // For proxy, we get game state from the existing context/hooks
            // This is handled by useTableData and other hooks
            console.warn("getGameState not implemented for proxy backend - use existing hooks");
            return null;
        }
    }, [cosmosContext]);

    const getLegalActions = useCallback(async (gameId: string, playerAddress: string): Promise<any> => {
        if (USE_COSMOS) {
            return await cosmosContext.getLegalActions(gameId, playerAddress);
        } else {
            // For proxy, legal actions are handled by usePlayerLegalActions hook
            console.warn("getLegalActions not implemented for proxy backend - use usePlayerLegalActions hook");
            return [];
        }
    }, [cosmosContext]);

    const isConnected = useMemo(() => {
        if (USE_COSMOS) {
            return cosmosContext.isConnected;
        } else {
            // For proxy, we consider it "connected" if we can make HTTP requests
            return true;
        }
    }, [cosmosContext.isConnected]);

    return {
        performPokerAction,
        joinGame,
        leaveGame,
        getGameState,
        getLegalActions,
        isConnected,
        backendType,
    };
};