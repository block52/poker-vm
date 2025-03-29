/**
 * Gets the legal actions for a specific player from the table data
 * @param tableData The table data from context
 * @param playerAddress The Ethereum address of the player
 * @returns Array of legal actions or null if player not found
 */
export const getPlayersLegalActions = (tableData: any, playerAddress?: string): any[] | null => {
    // console.log("getPlayersLegalActions called with:", {
    //     hasTableData: !!tableData,
    //     playerAddress
    // });

    if (!tableData || !tableData.players || !playerAddress) {
        // console.log("Missing required data for getPlayersLegalActions");
        return null;
    }

    // Find the player in the table data
    const player = tableData.players.find((p: any) => p.address.toLowerCase() === playerAddress.toLowerCase());

    if (!player) {
        // console.log("Player not found in table data:", playerAddress);
        return null;
    }

    // Check if the player is active and not already folded
    const isPlayerActive = player.status === "active" || player.status === undefined;

    // Start with the player's existing legal actions
    let actions = player.legalActions || [];

    // Ensure fold action is available for all active players
    if (isPlayerActive && !actions.some((a: any) => a.action === "fold")) {
        // Add fold as a legal action if it's not already there
        actions = [...actions, { action: "fold", min: "0", max: "0" }];
    }

    return actions;
};

/**
 * Checks if it's the player's turn to act
 * @param tableData The table data from context
 * @param playerAddress The Ethereum address of the player
 * @returns Boolean indicating if it's the player's turn
 */
export const isPlayersTurn = (tableData: any, playerAddress?: string): boolean => {
    if (!tableData || !tableData.players || !playerAddress) {
        return false;
    }

    // Find the player in the table data
    const player = tableData.players.find((p: any) => p.address.toLowerCase() === playerAddress.toLowerCase());

    if (!player) {
        return false;
    }

    // Check if the nextToAct matches the player's seat
    return tableData.nextToAct === player.seat;
};
