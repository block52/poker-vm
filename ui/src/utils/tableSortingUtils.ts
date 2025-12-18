/**
 * Utility functions for sorting poker tables
 */

/**
 * Sort tables by available seats (least empty seats first, full tables last)
 * 
 * @param tables - Array of tables to sort
 * @returns Sorted array with tables having fewer empty seats first, full tables last
 * 
 * @example
 * // Table with 8/9 players (1 available seat) appears before table with 1/9 players (8 available seats)
 * // Full tables (9/9, 4/4, etc.) appear at the very bottom
 */
export function sortTablesByAvailableSeats<T extends { maxPlayers?: number; currentPlayers?: number }>(
    tables: T[]
): T[] {
    return [...tables].sort((a, b) => {
        const aMaxPlayers = a.maxPlayers || 9;
        const bMaxPlayers = b.maxPlayers || 9;
        const aCurrentPlayers = a.currentPlayers || 0;
        const bCurrentPlayers = b.currentPlayers || 0;
        
        const aAvailableSeats = aMaxPlayers - aCurrentPlayers;
        const bAvailableSeats = bMaxPlayers - bCurrentPlayers;
        
        // Full tables go to the bottom
        const aIsFull = aCurrentPlayers >= aMaxPlayers;
        const bIsFull = bCurrentPlayers >= bMaxPlayers;
        
        if (aIsFull && !bIsFull) return 1;
        if (!aIsFull && bIsFull) return -1;
        
        // For non-full tables, sort by available seats (ascending - fewer empty seats first)
        return aAvailableSeats - bAvailableSeats;
    });
}
