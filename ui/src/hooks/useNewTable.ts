import { useState, useCallback } from "react";
import { GameOptionsDTO, GameType } from "@bitcoinbrisbane/block52";
import { getClient } from "../utils/b52AccountUtils";
import { ethers } from "ethers";

// Type for creating new table options
export interface CreateTableOptions {
    type: GameType;
    minBuyIn: number;
    maxBuyIn: number;
    minPlayers: number;
    maxPlayers: number;
    smallBlind: number;
    bigBlind: number;
}

// Type for useNewTable hook return
export interface UseNewTableReturn {
    createTable: (owner: string, nonce: number, gameOptions: CreateTableOptions) => Promise<string | null>;
    isCreating: boolean;
    error: Error | null;
    newTableAddress: string | null;
}

/**
 * Custom hook to create a new table using the SDK's NodeRpcClient
 * @returns Object with createTable function, loading state, and error
 */
export const useNewTable = (): UseNewTableReturn => {
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [newTableAddress, setNewTableAddress] = useState<string | null>(null);

    const createTable = useCallback(async (
        owner: string, 
        nonce: number,
        gameOptions: CreateTableOptions
    ): Promise<string | null> => {
        setIsCreating(true);
        setError(null);
        setNewTableAddress(null);

        try {
            // Get the singleton client instance
            const client = getClient();

            const minBuyIn: bigint = ethers.parseEther(gameOptions.minBuyIn.toString());
            const maxBuyIn: bigint = ethers.parseEther(gameOptions.maxBuyIn.toString());

            let smallBlind: bigint = ethers.parseEther(gameOptions.smallBlind.toString());
            let bigBlind: bigint = ethers.parseEther(gameOptions.bigBlind.toString());

            if (gameOptions.type === GameType.SIT_AND_GO || gameOptions.type === GameType.TOURNAMENT) {
                // For Sit & Go and Tournament: Fixed starting blinds regardless of buy-in
                // Buy-in represents tournament entry fee, not chip value
                smallBlind = ethers.parseEther("100");
                bigBlind = ethers.parseEther("200");

                console.log("🎮 Sit & Go Tournament Settings:");
                console.log(`  Entry Fee: $${gameOptions.minBuyIn}`);
                console.log(`  Starting Blinds: ${smallBlind}/${bigBlind}`);
            }

            // Build game options DTO object for the new API with all required fields
            const gameOptionsDTO: GameOptionsDTO = {
                type: gameOptions.type,
                minBuyIn: minBuyIn.toString(),
                maxBuyIn: maxBuyIn.toString(),
                minPlayers: gameOptions.minPlayers,
                maxPlayers: gameOptions.maxPlayers,
                smallBlind: smallBlind.toString(),
                bigBlind: bigBlind.toString(),
                timeout: 300000 // Standard 30,000 millisecond timeout for decisions
            };
            
            console.log("📊 Final game parameters:");
            console.log(`  Game Type: ${gameOptions.type}`);
            console.log(`  Players: ${gameOptions.minPlayers}-${gameOptions.maxPlayers}`);
            console.log(`  Buy-In: $${gameOptions.minBuyIn} - $${gameOptions.maxBuyIn}`);
            console.log(`  Blinds: ${ethers.formatEther(smallBlind)}/${ethers.formatEther(bigBlind)}`);
            console.log("  Timeout: 30 seconds");
            
            console.log("🚀 Creating New Table with SDK:");
            console.log(`Owner: ${owner}`);
            console.log(`Nonce: ${nonce}`);
            console.log("Game Options:", gameOptionsDTO);
            
            // IMPORTANT: We pass a timestamp instead of the actual account nonce here
            // This ensures each table gets a unique address even if multiple tables are created quickly
            // Using nonce 0 would cause issues with table uniqueness and joining
            // The timestamp guarantees uniqueness while the actual transaction nonce is handled internally by the SDK
            const timestamp = Date.now();
            console.log(`Using timestamp for uniqueness: ${timestamp}`);
            
            // Use the SDK's newTable method with the game options DTO
            // The third parameter is the timestamp for uniqueness, not the account nonce
            const tableAddress = await client.newTable(gameOptionsDTO, owner, timestamp);
            
            if (tableAddress) {
                console.log(`✅ Table created successfully: ${tableAddress}`);
                setNewTableAddress(tableAddress);
            }
            
            return tableAddress;
        } catch (err: any) {
            const errorMessage = err.message || "Failed to create table";
            setError(new Error(errorMessage));
            console.error("Error creating table:", err);
            return null;
        } finally {
            setIsCreating(false);
        }
    }, []);

    return {
        createTable,
        isCreating,
        error,
        newTableAddress
    };
};