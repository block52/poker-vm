import { useEffect, useRef, useCallback } from "react";
import { useGameStateContext } from "../context/GameStateContext";
import { PlayerDTO, PlayerActionType } from "@bitcoinbrisbane/block52";
import { foldHand } from "./playerActions/foldHand";
import { sitOut } from "./playerActions/sitOut";
import { useGameOptions } from "./useGameOptions";

/**
 * Custom hook to handle automatic player timeout actions for all players
 * This hook monitors all players and performs automatic actions when they timeout:
 * - If the player can check: auto-check (handled by usePlayerTimer for current user)
 * - If the player can only fold: auto-fold
 * - If the player has repeatedly timed out: auto-sit out
 * 
 * @param tableId The ID of the table to perform actions on
 */
export const usePlayerTimeoutManager = (tableId?: string) => {
    const { gameState } = useGameStateContext();
    const { gameOptions } = useGameOptions();

    // Track timeout counts per player address to determine when to sit them out
    const timeoutCounts = useRef<Map<string, number>>(new Map());

    // Track last action timestamp to detect new turns
    const lastActionTimestamp = useRef<number>(0);

    // Track which players we've already processed for the current turn
    const processedPlayers = useRef<Set<string>>(new Set());

    // Configuration
    const TIMEOUT_DURATION = gameOptions?.timeout || 30000; // Default 30 seconds
    const MAX_TIMEOUTS_BEFORE_SITOUT = 3; // Sit out player after 3 consecutive timeouts

    // Get the most recent action timestamp
    const getCurrentActionTimestamp = useCallback((): number => {
        if (!gameState?.previousActions || gameState.previousActions.length === 0) {
            return Date.now();
        }
        const sortedActions = [...gameState.previousActions].sort((a, b) => b.timestamp - a.timestamp);
        return sortedActions[0].timestamp;
    }, [gameState?.previousActions]);

    // Check if a player has timed out
    const hasPlayerTimedOut = useCallback((player: PlayerDTO, actionTimestamp: number): boolean => {
        if (!player || gameState?.nextToAct !== player.seat) {
            return false;
        }

        const elapsed = Date.now() - actionTimestamp;
        return elapsed > TIMEOUT_DURATION;
    }, [gameState?.nextToAct, TIMEOUT_DURATION]);

    // Get player's legal actions
    const getPlayerLegalActions = useCallback((player: PlayerDTO): PlayerActionType[] => {
        if (!player?.legalActions) return [];
        return player.legalActions
            .map(action => action.action)
            .filter((action): action is PlayerActionType =>
                Object.values(PlayerActionType).includes(action as PlayerActionType)
            );
    }, []);

    // Determine what action to take for a timed-out player
    const getTimeoutAction = useCallback((player: PlayerDTO): "fold" | "sitout" | "skip" => {
        const playerAddress = player.address?.toLowerCase();
        if (!playerAddress) return "skip";

        const currentTimeouts = timeoutCounts.current.get(playerAddress) || 0;
        const legalActions = getPlayerLegalActions(player);

        // If player has timed out too many times, sit them out
        if (currentTimeouts >= MAX_TIMEOUTS_BEFORE_SITOUT) {
            return "sitout";
        }

        // If player can only fold (no check option), fold them
        if (legalActions.includes(PlayerActionType.FOLD) && !legalActions.includes(PlayerActionType.CHECK)) {
            return "fold";
        }

        // Skip auto-action for other cases (let usePlayerTimer handle check for current user)
        return "skip";
    }, [getPlayerLegalActions, MAX_TIMEOUTS_BEFORE_SITOUT]);

    // Perform the timeout action
    const performTimeoutAction = useCallback(async (player: PlayerDTO, action: "fold" | "sitout") => {
        if (!tableId || !player.address) return;

        const playerAddress = player.address.toLowerCase();

        try {
            if (action === "fold") {
                console.log(`⏰ Auto-folding player ${playerAddress} (seat ${player.seat}) due to timeout`);
                await foldHand(tableId);

                // Increment timeout count
                const currentCount = timeoutCounts.current.get(playerAddress) || 0;
                timeoutCounts.current.set(playerAddress, currentCount + 1);

            } else if (action === "sitout") {
                console.log(`🪑 Auto-sitting out player ${playerAddress} (seat ${player.seat}) due to repeated timeouts`);
                await sitOut(tableId);

                // Reset timeout count after sitting out
                timeoutCounts.current.delete(playerAddress);
            }
        } catch (error) {
            console.error(`❌ Failed to perform ${action} for player ${playerAddress}:`, error);
        }
    }, [tableId]);

    // Check for timed-out players and take action
    const checkAndHandleTimeouts = useCallback(async () => {
        if (!gameState?.players || !tableId) return;

        const currentActionTimestamp = getCurrentActionTimestamp();

        // Check if this is a new turn
        const isNewTurn = currentActionTimestamp !== lastActionTimestamp.current;
        if (isNewTurn) {
            lastActionTimestamp.current = currentActionTimestamp;
            processedPlayers.current.clear();
            console.log("🔄 New turn detected, clearing processed players");
        }

        // Find the player who should be acting
        const nextToActSeat = gameState.nextToAct;
        if (nextToActSeat === undefined || nextToActSeat === null) return;

        const currentPlayer = gameState.players.find((p: PlayerDTO) => p.seat === nextToActSeat);
        if (!currentPlayer?.address) return;

        const playerKey = `${currentPlayer.address.toLowerCase()}-${nextToActSeat}`;

        // Skip if we've already processed this player for this turn
        if (processedPlayers.current.has(playerKey)) return;

        // Check if current user - let usePlayerTimer handle current user timeouts
        const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
        const isCurrentUser = currentPlayer.address.toLowerCase() === userAddress;
        if (isCurrentUser) return;

        // Check if player has timed out
        const elapsed = Date.now() - currentActionTimestamp;
        console.log(`⏱️ Player ${currentPlayer.address.slice(0, 6)} (seat ${nextToActSeat}): ${elapsed}ms elapsed, timeout at ${TIMEOUT_DURATION}ms`);

        if (!hasPlayerTimedOut(currentPlayer, currentActionTimestamp)) return;

        console.log(`⏰ Player ${currentPlayer.address.slice(0, 6)} (seat ${nextToActSeat}) has timed out!`);

        // Mark this player as processed for this turn
        processedPlayers.current.add(playerKey);

        // Determine and perform timeout action
        const timeoutAction = getTimeoutAction(currentPlayer);
        console.log(`🎯 Timeout action for player: ${timeoutAction}`);

        if (timeoutAction !== "skip") {
            // Add a small delay to avoid race conditions
            setTimeout(() => {
                performTimeoutAction(currentPlayer, timeoutAction);
            }, 1000);
        }
    }, [
        gameState,
        tableId,
        getCurrentActionTimestamp,
        hasPlayerTimedOut,
        getTimeoutAction,
        performTimeoutAction,
        TIMEOUT_DURATION
    ]);

    // Set up timer to check for timeouts
    useEffect(() => {
        if (!gameState?.players || !tableId) return;

        const interval = setInterval(checkAndHandleTimeouts, 2000); // Check every 2 seconds

        return () => clearInterval(interval);
    }, [checkAndHandleTimeouts, gameState?.players, tableId]);

    // Reset timeout counts when players leave/rejoin
    useEffect(() => {
        if (!gameState?.players) return;

        const currentPlayerAddresses = new Set(
            gameState.players
                .map((p: PlayerDTO) => p.address?.toLowerCase())
                .filter(Boolean)
        );

        // Remove timeout counts for players who are no longer at the table
        for (const [playerAddress] of timeoutCounts.current) {
            if (!currentPlayerAddresses.has(playerAddress)) {
                timeoutCounts.current.delete(playerAddress);
            }
        }
    }, [gameState?.players]);

    // Return timeout counts for debugging/monitoring
    return {
        timeoutCounts: timeoutCounts.current,
        isActive: Boolean(gameState?.players && tableId)
    };
};