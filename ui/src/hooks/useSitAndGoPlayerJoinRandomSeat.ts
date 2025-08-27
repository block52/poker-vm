import { useState, useCallback } from "react";
import { getClient } from "../utils/b52AccountUtils";

interface SitAndGoJoinOptions {
    tableId: string;
    amount: string;
}

interface UseSitAndGoPlayerJoinRandomSeatReturn {
    joinSitAndGo: (options: SitAndGoJoinOptions) => Promise<any>;
    isJoining: boolean;
    error: Error | null;
}

/**
 * Custom hook for joining Sit & Go games using the SDK's playerJoinRandomSeat method
 * @returns Object with joinSitAndGo function, loading state, and error
 */
export const useSitAndGoPlayerJoinRandomSeat = (): UseSitAndGoPlayerJoinRandomSeatReturn => {
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const joinSitAndGo = useCallback(async (options: SitAndGoJoinOptions): Promise<any> => {
        setIsJoining(true);
        setError(null);

        try {
            // Get the singleton client instance
            const client = getClient();
            
            console.log("🎮 [SIT & GO JOIN] Starting join process with random seat");
            console.log(`📍 Table ID: ${options.tableId}`);
            console.log(`💰 Amount (raw): ${options.amount}`);
            
            // For Sit & Go games, the amount should match exactly what backend expects
            // If minBuyIn/maxBuyIn is "1", the backend expects exactly "1" not "1000000000000000000"
            let finalAmount = options.amount;
            
            // Check if amount is in Wei format (18 digits) but backend expects simple "1"
            if (options.amount === "1000000000000000000") {
                console.log("⚠️ Detected Wei format for $1, converting to simple '1' for Sit & Go");
                finalAmount = "1";
            }
            
            console.log(`💸 Final amount to send: ${finalAmount}`);
            console.log("🎲 Using playerJoinRandomSeat - SDK will select available seat");
            
            // Call playerJoinRandomSeat from SDK - it will find an available seat automatically
            // The SDK method signature: playerJoinRandomSeat(gameAddress: string, amount: string, nonce?: number)
            const response = await client.playerJoinRandomSeat(
                options.tableId,
                finalAmount
                // nonce is optional - SDK will handle it automatically
            );
            
            console.log("✅ [SIT & GO JOIN] Successfully joined at random seat:", response);
            return response;
            
        } catch (err: any) {
            const errorMessage = err.message || "Failed to join Sit & Go game";
            console.error("❌ [SIT & GO JOIN] Error:", err);
            setError(new Error(errorMessage));
            throw err;
        } finally {
            setIsJoining(false);
        }
    }, []);

    return {
        joinSitAndGo,
        isJoining,
        error
    };
};