import { useState, useEffect } from "react";
import { getClient } from "../utils/b52AccountUtils";

interface TablePlayerCount {
    tableId: string;
    currentPlayers: number;
    maxPlayers: number;
}

/**
 * Hook to fetch player counts for multiple tables
 * 
 * IMPORTANT: This hook creates separate client instances rather than using GameStateContext
 * because:
 * 1. GameStateContext is designed for a SINGLE table subscription via WebSocket
 * 2. We need to fetch data for MULTIPLE tables simultaneously  
 * 3. GameStateContext maintains a persistent WebSocket connection for real-time updates on one table
 * 4. This hook does periodic polling of multiple tables for dashboard display
 * 
 * Using separate clients here avoids interfering with the main game's WebSocket connection
 * and allows us to efficiently fetch player counts for all available tables.
 * 
 * @param tableAddresses Array of table addresses to fetch player counts for
 * @returns Map of table addresses to player counts
 */
export const useTablePlayerCounts = (tableAddresses: string[]) => {
    const [playerCounts, setPlayerCounts] = useState<Map<string, TablePlayerCount>>(new Map());
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchPlayerCounts = async () => {
            if (!tableAddresses || tableAddresses.length === 0) return;

            setIsLoading(true);
            const newCounts = new Map<string, TablePlayerCount>();

            try {
                // Create a client instance for fetching multiple table states
                // Note: We're NOT using GameStateContext here as it's for single-table WebSocket subscriptions
                const client = getClient();
                
                // Fetch game state for each table in parallel
                const promises = tableAddresses.map(async (address) => {
                    try {
                        // Get the game state for this table
                        // getGameState expects (tableAddress, playerAddress)
                        const playerAddress = localStorage.getItem("user_eth_public_key") || "";
                        const gameState = await client.getGameState(address, playerAddress);
                        
                        if (gameState) {
                            // Count non-null players
                            const activePlayers = gameState.players?.filter(p => p !== null).length || 0;
                            const maxPlayers = gameState.gameOptions?.maxPlayers || 0;
                            
                            return {
                                tableId: address,
                                currentPlayers: activePlayers,
                                maxPlayers: maxPlayers
                            };
                        }
                        
                        return {
                            tableId: address,
                            currentPlayers: 0,
                            maxPlayers: 0
                        };
                    } catch (error) {
                        console.error(`Error fetching player count for table ${address}:`, error);
                        return {
                            tableId: address,
                            currentPlayers: 0,
                            maxPlayers: 0
                        };
                    }
                });

                const results = await Promise.all(promises);
                
                // Convert to map
                results.forEach(result => {
                    newCounts.set(result.tableId, result);
                });
                
                setPlayerCounts(newCounts);
            } catch (error) {
                console.error("Error fetching player counts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlayerCounts();
        
        // Refresh every 10 seconds
        const interval = setInterval(fetchPlayerCounts, 10000);
        
        return () => clearInterval(interval);
    }, [tableAddresses.join(",")]); // Re-run when table list changes

    return { playerCounts, isLoading };
};