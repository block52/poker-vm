import { getClient } from "../../utils/b52AccountUtils";
import { JoinTableOptions } from "./types";

/**
 * Joins a poker table with the specified options.
 * 
 * @param {string} tableId - The ID of the table to join.
 * @param {JoinTableOptions} options - Options for joining the table, including buy-in amount and seat number.
 * @returns {Promise<any>} - The response from the join operation.
 * @throws {Error} - If the table ID is not provided or if an error occurs during the join operation.
 */
export async function joinTable(tableId: string, options: JoinTableOptions): Promise<any> {
    // Get the singleton client instance
    const client = getClient();

    console.log("🎮 joinTable hook - Full details:");
    console.log("  tableId:", tableId);
    console.log("  options.amount (string):", options.amount);
    console.log("  options.seatNumber:", options.seatNumber);
    console.log("  amount type:", typeof options.amount);
    console.log("  amount length:", options.amount.length);

    // Use the client's playerJoin method (let SDK handle nonce internally)
    if (!tableId) {
        throw new Error("Table ID is required to join a table");
    }

    // If seatNumber is not provided, default to 0
    if (options.seatNumber === undefined || options.seatNumber === null) {
        console.log("🎮 Calling SDK playerJoinRandomSeat with:");
        console.log("  tableId:", tableId);
        console.log("  amount:", options.amount);
        
        // DEBUG: Let's see what the SDK method looks like
        console.log("🔍 SDK client methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(client)));
        console.log("🔍 playerJoinRandomSeat type:", typeof client.playerJoinRandomSeat);
        
        const response = await client.playerJoinRandomSeat(
            tableId,
            options.amount
        );
        console.log("🎮 SDK playerJoinRandomSeat response:", response);
        return response;
    }

    console.log("🎮 Calling SDK playerJoin with:");
    console.log("  tableId:", tableId);
    console.log("  amount:", options.amount);
    console.log("  seatNumber:", options.seatNumber);
    
    const response = await client.playerJoin(
        tableId,
        options.amount,
        options.seatNumber
    );

    console.log("🎮 SDK playerJoin response:", response);
    return response;
}
