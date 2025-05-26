import React from "react";
import { useGameState } from "./useGameState";
import { ethers } from "ethers";
import { PlayerDTO } from "@bitcoinbrisbane/block52";
import { TableInfo, VacantSeatResponse } from "../types/index";

const defaultTableInfo: TableInfo = {
    smallBlind: "0",
    bigBlind: "0",
    smallBlindDisplay: "0.00",
    bigBlindDisplay: "0.00",
    dealerPosition: 0,
    smallBlindPosition: 0,
    bigBlindPosition: 0,
    players: []
};

/**
 * Custom hook to manage data for vacant seats
 * @param tableId The ID of the table
 * @returns Object containing seat vacancy data
 */
export const useVacantSeatData = (tableId?: string): VacantSeatResponse => {
    // Get game state from centralized hook
    const { gameState, isLoading, error } = useGameState(tableId);

    const userAddress = React.useMemo(() => {
        return localStorage.getItem("user_eth_public_key")?.toLowerCase() || null;
    }, []);

    // Check if user is already playing at the table
    const isUserAlreadyPlaying = React.useMemo(() => {
        if (!userAddress || !gameState) return false;

        if (!gameState.players) return false;

        return gameState.players.some((player: PlayerDTO) => player.address?.toLowerCase() === userAddress);
    }, [gameState, userAddress]);

    // Get blind values from table data
    const tableInfo = React.useMemo(() => {
        if (!gameState) return defaultTableInfo;

        const smallBlind = gameState.gameOptions?.smallBlind || "0";
        const bigBlind = gameState.gameOptions?.bigBlind || "0";

        const response: TableInfo = {
            smallBlind,
            bigBlind,
            smallBlindDisplay: ethers.formatUnits(smallBlind, 18),
            bigBlindDisplay: ethers.formatUnits(smallBlind, 18),
            dealerPosition: gameState.dealer,
            smallBlindPosition: gameState.smallBlindPosition,
            bigBlindPosition: gameState.bigBlindPosition,
            players: gameState.players || []
        };

        return response;
    }, [gameState]);

    // Function to check if a specific seat is vacant
    const isSeatVacant = React.useCallback(
        (seatIndex: number) => {
            if (!gameState) return true;

            if (!gameState.players) return true;

            // Check if any player occupies this seat
            const isOccupied = gameState.players.some(
                (player: PlayerDTO) => player.seat === seatIndex && player.address && player.address !== ethers.ZeroAddress
            );

            return !isOccupied;
        },
        [gameState]
    );

    // Function to check if a user can join a specific seat
    const canJoinSeat = React.useCallback(
        (seatIndex: number) => {
            // User can join if:
            // 1. The seat is vacant
            // 2. The user is not already playing
            return isSeatVacant(seatIndex) && !isUserAlreadyPlaying;
        },
        [isSeatVacant, isUserAlreadyPlaying]
    );

    return {
        isUserAlreadyPlaying,
        tableInfo,
        isSeatVacant,
        canJoinSeat,
        isLoading,
        error
    };
};
