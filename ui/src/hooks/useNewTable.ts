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
            
            // Build game options string in the exact format expected by the backend
            // The backend's parseSchema method expects the GameType enum values directly
            // No mapping needed - just use the enum value as-is
            const gameOptionsString = [
                `type=${gameOptions.type}`,
                `minBuyIn=${gameOptions.minBuyIn}`,
                `maxBuyIn=${gameOptions.maxBuyIn}`,
                `minPlayers=${gameOptions.minPlayers}`,
                `maxPlayers=${gameOptions.maxPlayers}`
            ].join("&");
            
            console.log("🚀 Creating New Table with SDK:");
            console.log(`Owner: ${owner}`);
            console.log(`Nonce: ${nonce}`);
            console.log(`Game Options: ${gameOptionsString}`);
            
            // IMPORTANT: We pass a timestamp instead of the actual account nonce here
            // This ensures each table gets a unique address even if multiple tables are created quickly
            // Using nonce 0 would cause issues with table uniqueness and joining
            // The timestamp guarantees uniqueness while the actual transaction nonce is handled internally by the SDK
            const timestamp = Date.now();
            console.log(`Using timestamp for uniqueness: ${timestamp}`);
            
            // Use the SDK's newTable method with the game options as the schema address
            // The schema address in this case is the game options string
            // The third parameter is the timestamp for uniqueness, not the account nonce
            const tableAddress = await client.newTable(gameOptionsString, owner, timestamp);
            
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