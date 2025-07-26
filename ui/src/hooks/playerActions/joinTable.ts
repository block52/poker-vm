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

    console.log("🎮 Join table attempt");
    console.log("🎮 Buy-in amount:", options.buyInAmount);

    // Convert the buyInAmount from string to bigint
    const buyInAmountBigInt = BigInt(options.buyInAmount);

    // Use the client's playerJoin method (let SDK handle nonce internally)
    if (!tableId) {
        throw new Error("Table ID is required to join a table");
    }

    // If seatNumber is not provided, default to 0
    if (options.seatNumber === undefined || options.seatNumber === null) {
        const response = await client.playerJoinRandomSeat(
            tableId,
            buyInAmountBigInt
        );
        console.log("🎮 Join table response:", response);
        return response;
    }

    const response = await client.playerJoin(
        tableId,
        buyInAmountBigInt,
        options.seatNumber
    );

    console.log("🎮 Join table response:", response);
    return response;
}
