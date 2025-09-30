import React from "react";
import { useGameStateContext } from "../context/GameStateContext";
import { ethers } from "ethers";
import { PlayerDTO } from "@bitcoinbrisbane/block52";
import { VacantSeatResponse } from "../types/index";

/**
 * Custom hook to manage data for vacant seats
 * @param tableId The ID of the table (not used - Context manages subscription)
 * @returns Object containing seat vacancy data
 */
export const useVacantSeatData = (): VacantSeatResponse => {
    // Get game state directly from Context - no additional WebSocket connections
    const { gameState, isLoading, error } = useGameStateContext();
    
    const userAddress = React.useMemo(() => {
        return localStorage.getItem("user_eth_public_key")?.toLowerCase() || null;
    }, []);

    // Memoize players array and maxPlayers to avoid repeated property access
    const { players, maxPlayers } = React.useMemo(() => ({
        players: gameState?.players || [],
        maxPlayers: gameState?.gameOptions?.maxPlayers || 6
    }), [gameState]);

    // Check if user is already playing at the table
    const isUserAlreadyPlaying = React.useMemo(() => {
        return !!(userAddress && players.length > 0 && 
            players.some((player: PlayerDTO) => player.address?.toLowerCase() === userAddress));
    }, [players, userAddress]);

    // Function to check if a specific seat is vacant
    const isSeatVacant = React.useCallback(
        (seatIndex: number) => {
            return !players.some(
                (player: PlayerDTO) => player.seat === seatIndex && 
                player.address && 
                player.address !== ethers.ZeroAddress
            );
        },
        [players]
    );

    // Get array of all empty seat indexes - optimized to avoid repeated function calls
    const emptySeatIndexes = React.useMemo(() => {
        if (players.length === 0) {
            // If no players, all seats are empty
            return Array.from({ length: maxPlayers }, (_, i) => i + 1);
        }
        
        const occupiedSeats = new Set(
            players
                .filter(player => player.address && player.address !== ethers.ZeroAddress)
                .map(player => player.seat)
        );
        
        const emptySeatNumbers: number[] = [];
        for (let seatIndex = 1; seatIndex <= maxPlayers; seatIndex++) {
            if (!occupiedSeats.has(seatIndex)) {
                emptySeatNumbers.push(seatIndex);
            }
        }
        
        return emptySeatNumbers;
    }, [players, maxPlayers]);

    // Function to check if a user can join a specific seat
    const canJoinSeat = React.useCallback(
        (seatIndex: number) => {
            return !isUserAlreadyPlaying && isSeatVacant(seatIndex);
        },
        [isSeatVacant, isUserAlreadyPlaying]
    );

    // Get array of all empty seat indexes that the user can join
    const availableSeatIndexes = React.useMemo(() => {
        return isUserAlreadyPlaying ? [] : emptySeatIndexes;
    }, [emptySeatIndexes, isUserAlreadyPlaying]);

    return {
        isUserAlreadyPlaying,
        isSeatVacant,
        canJoinSeat,
        emptySeatIndexes,        // NEW: Array of all empty seat numbers
        availableSeatIndexes,    // NEW: Array of seats user can actually join
        isLoading,
        error
    };
};