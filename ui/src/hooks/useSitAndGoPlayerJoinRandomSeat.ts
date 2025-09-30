import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { getClient } from "../utils/b52AccountUtils";

interface SitAndGoJoinOptions {
    tableId: string;
    amount: number;  // Changed from string to number - user input as dollars
}

interface UseSitAndGoPlayerJoinRandomSeatReturn {
    joinSitAndGo: (options: SitAndGoJoinOptions) => Promise<any>;
    isJoining: boolean;
    error: Error | null;
}

/**
 * Custom hook for joining Sit & Go games using the SDK's playerJoinRandomSeat method
 * 
 * AMOUNT HANDLING PATTERN:
 * 1. INPUT: User inputs are received as numbers (e.g., 10 = $10 USDC)
 * 2. CONVERSION IN HOOK: This hook converts the number to wei using ethers.parseEther()
 *    Example: 10 becomes BigInt(10000000000000000000) 
 * 3. STRING CONVERSION: BigInt is converted to string at the last moment before SDK call
 *    Example: "10000000000000000000"
 * 4. SDK TRANSMISSION: The SDK receives the string and passes it to the backend as-is
 * 
 * @param options.amount - The buy-in amount as a number in dollars (e.g., 1 for $1, 10 for $10)
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
            console.log(`💰 Amount (input as number): $${options.amount}`);
            
            // STEP 1: Receive amount as number (dollars)
            const amountInDollars: number = options.amount;
            console.log(`📊 Step 1 - User input: $${amountInDollars}`);
            
            // STEP 2: Convert to BigInt with 18 decimals (wei)
            const amountInWei: bigint = ethers.parseEther(amountInDollars.toString());
            console.log(`📊 Step 2 - Converted to BigInt: ${amountInWei}n (${amountInWei.toString().length} digits)`);
            
            // STEP 3: Convert BigInt to string only at the last moment for SDK
            const amountAsString: string = amountInWei.toString();
            console.log(`📊 Step 3 - Final string for SDK: "${amountAsString}"`);
            console.log(`💸 Is this 1 ETH in wei? ${amountAsString === "1000000000000000000"}`);
            console.log("🎲 Using playerJoinRandomSeat - SDK will select available seat");
            
            // Call playerJoinRandomSeat from SDK - it will find an available seat automatically
            // The SDK method signature: playerJoinRandomSeat(gameAddress: string, amount: string, nonce?: number)
            const response = await client.playerJoinRandomSeat(
                options.tableId,
                amountAsString  // Pass the string representation of wei amount
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