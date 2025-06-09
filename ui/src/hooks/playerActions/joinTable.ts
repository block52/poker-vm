import { getClient } from "../../utils/b52AccountUtils";
import { JoinTableOptions } from "./types";

/**
 * Join a poker table with the specified buy-in amount and seat preference.
 * 
 * Seat Selection Logic:
 * - If VITE_RANDOMISE_SEAT_SELECTION=true: Uses Math.random() to select a random seat (0 to maxPlayers-1)
 * - If VITE_RANDOMISE_SEAT_SELECTION=false: Uses the seatNumber passed from the component
 * - If no seatNumber is provided and random selection is disabled, defaults to seat 0
 * 
 * @param tableId - The ID of the table to join
 * @param options - Join table options including buyInAmount and optional seatNumber
 * @param maxPlayers - Maximum number of players at the table (from game options)
 * @returns Promise with the join table response
 * @throws Error if private key is missing or if the join operation fails
 */
export async function joinTable(tableId: string, options: JoinTableOptions, maxPlayers: number = 9) {
    const { buyInAmount, actionIndex = 0, seatNumber } = options;

    // Get the singleton client instance
    const client = getClient();

    // Determine seat selection based on environment variable
    const shouldRandomiseSeat = import.meta.env.VITE_RANDOMISE_SEAT_SELECTION === "true";
    let finalSeatNumber: number;

    if (shouldRandomiseSeat) {
        // Use random seat selection (0 to maxPlayers-1)
        finalSeatNumber = Math.floor(Math.random() * maxPlayers);
        console.log("🎮 Using randomised seat selection:", finalSeatNumber, `(max players: ${maxPlayers})`);
    } else {
        // Use the seat number provided by the component, or default to 0
        finalSeatNumber = seatNumber !== undefined ? seatNumber : 0;
        console.log("🎮 Using specified seat number:", finalSeatNumber);
    }

    console.log("🎮 Join table attempt");
    console.log("🎮 Using action index:", actionIndex);
    console.log("🎮 Buy-in amount:", buyInAmount);
    console.log("🎮 Seat randomisation enabled:", shouldRandomiseSeat);

    // Convert the buyInAmount from string to bigint
    const buyInAmountBigInt = BigInt(buyInAmount);
    
    // Use the client's playerJoin method (let SDK handle nonce internally)
    const response = await client.playerJoin(
        tableId,
        buyInAmountBigInt,
        finalSeatNumber
    );

    console.log("🎮 Join table response:", response);
    return response;
}
