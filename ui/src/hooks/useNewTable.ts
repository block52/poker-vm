import { useState, useCallback } from "react";
import { GameType } from "@bitcoinbrisbane/block52";
import { getClient } from "../utils/b52AccountUtils";

// Type for creating new table options
export interface CreateTableOptions {
    type: GameType;
    minBuyIn: number;
    maxBuyIn: number;
    minPlayers: number;
    maxPlayers: number;
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
            
            // Calculate blind values based on game type
            let calculatedSmallBlind: number;
            let calculatedBigBlind: number;
            let startingChips: number = 0;
            
            if (gameOptions.type === GameType.SIT_AND_GO || gameOptions.type === GameType.TOURNAMENT) {
                // For Sit & Go and Tournament: Fixed starting blinds regardless of buy-in
                // Buy-in represents tournament entry fee, not chip value
                calculatedSmallBlind = 10;  // Standard SNG starting small blind
                calculatedBigBlind = 20;     // Standard SNG starting big blind
                startingChips = 1500;        // Standard starting stack for SNG
                
                console.log("🎮 Sit & Go Tournament Settings:");
                console.log(`  Entry Fee: $${gameOptions.minBuyIn}`);
                console.log(`  Starting Stack: ${startingChips} chips`);
                console.log(`  Starting Blinds: ${calculatedSmallBlind}/${calculatedBigBlind}`);
            } else {
                // For Cash games: blinds are percentage of buy-in
                calculatedSmallBlind = Math.max(1, Math.floor(gameOptions.minBuyIn / 100));
                calculatedBigBlind = calculatedSmallBlind * 2;
                
                console.log("💵 Cash Game Settings:");
                console.log(`  Buy-in Range: $${gameOptions.minBuyIn} - $${gameOptions.maxBuyIn}`);
                console.log(`  Blinds: $${calculatedSmallBlind}/$${calculatedBigBlind}`);
            }
            
            // Build game options DTO object for the new API with all required fields
            const gameOptionsDTO: any = {
                type: gameOptions.type,
                minBuyIn: gameOptions.minBuyIn.toString(),
                maxBuyIn: gameOptions.maxBuyIn.toString(),
                minPlayers: gameOptions.minPlayers,
                maxPlayers: gameOptions.maxPlayers,
                smallBlind: calculatedSmallBlind.toString(),
                bigBlind: calculatedBigBlind.toString(),
                timeout: 30 // Standard 30 second timeout for decisions
            };
            
            // Add starting chips for tournament modes
            if (gameOptions.type === GameType.SIT_AND_GO || gameOptions.type === GameType.TOURNAMENT) {
                gameOptionsDTO.startingChips = startingChips.toString();
            }
            
            console.log("📊 Final game parameters:");
            console.log(`  Game Type: ${gameOptions.type}`);
            console.log(`  Players: ${gameOptions.minPlayers}-${gameOptions.maxPlayers}`);
            console.log(`  Timeout: 30 seconds`);
            
            console.log("🚀 Creating New Table with SDK:");
            console.log(`Owner: ${owner}`);
            console.log(`Nonce: ${nonce}`);
            console.log(`Game Options:`, gameOptionsDTO);
            
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