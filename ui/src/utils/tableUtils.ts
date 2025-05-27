/**
 * Utility functions for poker table operations
 */

import { ethers } from "ethers";
import { formatWinningAmount } from "./numberUtils";
import { TableData } from "../types/index";
import { PlayerDTO } from "@bitcoinbrisbane/block52";

/**
 * Determines which player is next to act based on table data
 * @param tableData The current table state data
 * @returns Object with information about the next player to act
 */
export const whoIsNextToAct = (tableData: TableData) => {
    if (!tableData) return null;

    // Get the seat number of the next player to act
    const nextToActSeat = tableData.nextToAct;

    // If no next player is specified, return null
    if (nextToActSeat === undefined || nextToActSeat === null) {
        return null;
    }

    // Find the player object for the next to act seat
    const nextPlayer = tableData.players?.find((player: PlayerDTO) => player.seat === nextToActSeat);

    // Get the current user's address
    const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();

    // Check if it's the current user's turn
    const isCurrentUserTurn = nextPlayer?.address?.toLowerCase() === userAddress;

    return {
        seat: nextToActSeat,
        player: nextPlayer,
        isCurrentUserTurn,
        availableActions: nextPlayer?.legalActions || [],
        timeRemaining: nextPlayer?.timeout || 0
    };
};

/**
 * Gets the current round of the poker game
 * @param tableData The current table state data
 * @returns The current round (preflop, flop, turn, river)
 */
export const getCurrentRound = (tableData: TableData): string => {
    return tableData?.round || "unknown";
};

/**
 * Gets the total pot amount
 * @param tableData The current table state data
 * @returns The total pot amount in wei format
 */
export const getTotalPot = (tableData: TableData): string => {
    if (!tableData?.pots || tableData.pots.length === 0) {
        return "0";
    }

    // Sum all pots
    return tableData.pots.reduce((sum: bigint, pot: string) => sum + BigInt(pot), BigInt(0)).toString();
};

/**
 * Gets the position name for a seat
 * @param tableData The current table state data
 * @param seat The seat number
 * @returns The position name (Dealer, SB, BB, etc.)
 */
export const getPositionName = (tableData: TableData, seat: number): string => {
    if (!tableData) return "";

    if (seat === tableData.dealer) return "Dealer (D)";
    if (seat === tableData.smallBlindPosition) return "Small Blind (SB)";
    if (seat === tableData.bigBlindPosition) return "Big Blind (BB)";

    return "";
};

/**
 * Gets the position for the dealer button
 * @param tableData The current table state data
 * @returns The position coordinates for the dealer button
 */
export const getDealerPosition = (tableData: TableData): { left: string; top: string } => {
    if (!tableData) return { left: "50%", top: "50%" };

    const dealerSeat = tableData.dealer;
    if (dealerSeat === undefined || dealerSeat === null) return { left: "50%", top: "50%" };

    // Look at the VacantPlayer.tsx logs to find the actual pixel positions
    // Map seat numbers to their pixel positions based on the logs
    const seatPositions = {
        0: { left: "400px", top: "380px" },
        1: { left: "200px", top: "380px" },
        2: { left: "-120px", top: "230px" },
        3: { left: "-120px", top: "30px" },
        4: { left: "200px", top: "-110px" },
        5: { left: "600px", top: "-110px" },
        6: { left: "930px", top: "30px" },
        7: { left: "930px", top: "230px" },
        8: { left: "650px", top: "380px" }
    };

    // Get position for the dealer seat
    const position = seatPositions[dealerSeat as keyof typeof seatPositions];
    if (!position) return { left: "50%", top: "50%" };

    // Extract numeric values from the position strings
    const left = parseInt(position.left, 10);
    const top = parseInt(position.top, 10);

    // Offset the indicator slightly from the player position
    return {
        left: `${left + 100}px`,
        top: `${top - 30}px`
    };
};

/**
 * Gets the position for the big blind indicator
 * @param tableData The current table state data
 * @returns The position coordinates for the big blind indicator
 */
export const getBigBlindPosition = (tableData: TableData): { left: string; top: string } => {
    if (!tableData) return { left: "50%", top: "50%" };

    const bigBlindSeat = tableData.bigBlindPosition;
    if (bigBlindSeat === undefined || bigBlindSeat === null) return { left: "50%", top: "50%" };

    // Look at the VacantPlayer.tsx logs to find the actual pixel positions
    // Map seat numbers to their pixel positions based on the logs
    const seatPositions = {
        0: { left: "400px", top: "380px" },
        1: { left: "200px", top: "380px" },
        2: { left: "-120px", top: "230px" },
        3: { left: "-120px", top: "30px" },
        4: { left: "200px", top: "-110px" },
        5: { left: "600px", top: "-110px" },
        6: { left: "930px", top: "30px" },
        7: { left: "930px", top: "230px" },
        8: { left: "650px", top: "380px" }
    };

    // Get position for the big blind seat
    const position = seatPositions[bigBlindSeat as keyof typeof seatPositions];
    if (!position) return { left: "50%", top: "50%" };

    // Extract numeric values from the position strings
    const left = parseInt(position.left, 10);
    const top = parseInt(position.top, 10);

    // Offset the indicator slightly from the player position
    // Added 15px more to the right for the big blind
    return {
        left: `${left + 80}px`,
        top: `${top - 50}px`
    };
};

/**
 * Gets the position for the small blind indicator
 * @param tableData The current table state data
 * @param playerPosition The position mapping for players
 * @returns The position coordinates for the small blind indicator
 */
export const getSmallBlindPosition = (tableData: TableData): { left: string; top: string } => {
    if (!tableData) return { left: "50%", top: "50%" };

    const smallBlindSeat = tableData.smallBlindPosition;
    if (smallBlindSeat === undefined || smallBlindSeat === null) return { left: "50%", top: "50%" };

    // Look at the VacantPlayer.tsx logs to find the actual pixel positions
    // Map seat numbers to their pixel positions based on the logs
    const seatPositions = {
        0: { left: "400px", top: "380px" },
        1: { left: "200px", top: "380px" }, // Adjusted based on OppositePlayer position
        2: { left: "-120px", top: "230px" },
        3: { left: "-120px", top: "30px" },
        4: { left: "200px", top: "-110px" },
        5: { left: "600px", top: "-110px" },
        6: { left: "930px", top: "30px" },
        7: { left: "930px", top: "230px" },
        8: { left: "650px", top: "380px" }
    };

    // Get position for the small blind seat
    const position = seatPositions[smallBlindSeat as keyof typeof seatPositions];
    if (!position) return { left: "50%", top: "50%" };

    // Extract numeric values from the position strings
    const left = parseInt(position.left, 10);
    const top = parseInt(position.top, 10);

    // Offset the indicator slightly from the player position
    return {
        left: `${left + 30}px`,
        top: `${top - 30}px`
    };
};

/**
 * Checks if a player has already posted their blind
 * @param tableData The current table state data
 * @param playerAddress The address of the player to check
 * @param blindType The type of blind to check ('small' or 'big')
 * @returns Boolean indicating if the player has posted the specified blind
 */
export const hasPostedBlind = (tableData: any, playerAddress: string, blindType: "small" | "big"): boolean => {
    if (!tableData || !playerAddress) return false;

    // Normalize the player address for comparison
    const normalizedAddress = playerAddress.toLowerCase();

    // Check if there's a previous action of posting the specified blind by this player
    const hasPosted = tableData.previousActions?.some(
        (action: any) =>
            action.playerId?.toLowerCase() === normalizedAddress &&
            action.action === (blindType === "small" ? "post small blind" : "post big blind") &&
            action.round === tableData.round
    );

    // Also check the lastAction field on the player object
    const player = tableData.players?.find((p: PlayerDTO) => p.address?.toLowerCase() === normalizedAddress);
    const hasPostedInLastAction = player?.lastAction?.action === (blindType === "small" ? "post small blind" : "post big blind");

    return hasPosted || hasPostedInLastAction;
};

/**
 * Checks if it's a player's turn to post a blind
 * @param tableData The current table state data
 * @param playerAddress The address of the player to check
 * @param blindType The type of blind to check ('small' or 'big')
 * @returns Boolean indicating if it's the player's turn to post the specified blind
 */
export const isPlayerTurnToPostBlind = (tableData: TableData, playerAddress: string, blindType: "small" | "big"): boolean => {
    // console.log("tableData", tableData);
    if (!tableData || !playerAddress) return false;

    // Normalize the player address for comparison
    const normalizedAddress = playerAddress.toLowerCase();

    // Get the player object
    const player = tableData.players?.find((p: PlayerDTO) => p.address?.toLowerCase() === normalizedAddress);
    if (!player) return false;

    // Check if this player is in the small/big blind position
    const isInBlindPosition = blindType === "small" ? player.seat === tableData.smallBlindPosition : player.seat === tableData.bigBlindPosition;

    // Check if it's this player's turn to act
    const isPlayerTurn = tableData.nextToAct === player.seat;

    // Check if the player has already posted this blind
    const alreadyPosted = hasPostedBlind(tableData, playerAddress, blindType);

    // Check if the player has the legal action to post this blind
    const canPostBlind = player.legalActions?.some((action: any) => action.action === (blindType === "small" ? "post small blind" : "post big blind"));

    // It's the player's turn to post a blind if they're in position, it's their turn,
    // they haven't posted yet, and they have the legal action to do so
    return isInBlindPosition && isPlayerTurn && !alreadyPosted && canPostBlind;
};

/**
 * Gets the winner information from the table data if available
 * @param tableData The table data object
 * @returns An object with winner information or null if no winner
 */
export const getWinnerInfo = (tableData: any) => {
    if (!tableData || !tableData.winners || tableData.winners.length === 0) {
        return null;
    }

    const winners = tableData.winners;
    const result = [];

    for (const winner of winners) {
        // Find the player's seat from their address
        const playerSeat = tableData.players.find((p: PlayerDTO) => p.address?.toLowerCase() === winner.address?.toLowerCase())?.seat;

        if (playerSeat !== undefined) {
            // Format the winning amount to a readable format (ETH to dollars)
            const winAmount = Number(ethers.formatUnits(winner.amount.toString(), 18));
            const formattedAmount = formatWinningAmount(winAmount.toString());

            result.push({
                seat: playerSeat,
                address: winner.address,
                amount: winner.amount,
                formattedAmount
            });
        }
    }

    return result.length > 0 ? result : null;
};

/**
 * Converts a backend seat number to a display seat number
 * Since the backend is already using 1-based seat numbers,
 * this function now simply returns the input
 * @param seatIndex The backend seat index (already 1-based)
 * @returns The 1-based seat number for display
 */
export const toDisplaySeat = (seatIndex: number): number => {
    return seatIndex;
};

/**
 * Converts a 1-based seat number (UI) to the backend seat index (also 1-based)
 * @param seatNumber The 1-based seat number
 * @returns The backend 1-based seat index
 */
export const toInternalSeat = (seatNumber: number): number => {
    return seatNumber;
};
