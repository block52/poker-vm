import { ethers } from "ethers";

export const getSignature = async (
    privateKey: string,
    nonce: number | string,
    from?: string,
    to?: string,
    amount?: string,
    action?: string
): Promise<string> => {
    try {
        const wallet = new ethers.Wallet(privateKey);

        // If additional params are provided, create a complete message
        if (from && to && amount && action) {
            const message = `${from}${to}${amount}${action}${nonce}`;
            return await wallet.signMessage(message);
        }

        // Otherwise just sign the nonce
        return await wallet.signMessage(nonce.toString());
    } catch (error) {
        console.error("Error getting signature:", error);
        throw new Error("Failed to sign message");
    }
};

/**
 * Get public key from private key
 * @param privateKey The private key
 * @returns The uncompressed public key
 */
export const getPublicKey = (privateKey: string): string => {
    try {
        const wallet = new ethers.Wallet(privateKey);
        return wallet.signingKey.publicKey;
    } catch (error) {
        console.error("Error getting public key:", error);
        throw new Error("Failed to get public key");
    }
};

/**
 * Check if the current user is in the table and has specific legal actions
 * @param tableData The table data from context
 * @returns Object with user's seat, available actions, and other relevant data
 */
export const getUserTableStatus = (tableData: any) => {
    // console.log("getUserTableStatus called with tableData:", tableData);

    if (!tableData) {
        // console.log("tableData is null or undefined, returning null");
        return null;
    }

    // Extract the actual table data from the nested structure
    const actualTableData = tableData.data || tableData;
    // console.log("Extracted actual table data:", actualTableData);

    const userAddress = localStorage.getItem("user_eth_public_key");
    // console.log("User address from localStorage:", userAddress);

    if (!userAddress) {
        // console.log("No user address found in localStorage, returning null");
        return null;
    }

    // Try to find player in different possible locations
    const playersArray = actualTableData.players || [];

    // Find the player in the table
    const player = playersArray.find((p: any) => p.address?.toLowerCase() === userAddress.toLowerCase());
    // console.log("Found player:", player);

    if (!player) {
        // console.log("Player not found in table data, returning null");
        return null;
    }

    // Check if it's the player's turn
    const nextToAct = actualTableData.nextToAct;
    const isPlayerTurn = nextToAct === player.seat;

    // Get available actions
    const availableActions = player.legalActions || [];

    // Check for specific actions
    const canPostSmallBlind = availableActions.some((a: any) => a.action === "post small blind");
    const canPostBigBlind = availableActions.some((a: any) => a.action === "post big blind");
    const canCheck = availableActions.some((a: any) => a.action === "check");
    const canCall = availableActions.some((a: any) => a.action === "call");
    const canBet = availableActions.some((a: any) => a.action === "bet");
    const canRaise = availableActions.some((a: any) => a.action === "raise");
    const canFold = availableActions.some((a: any) => a.action === "fold");

    // Check if player is in small blind position
    const isSmallBlindPosition = actualTableData.smallBlindPosition === player.seat;
    // console.log("Is small blind position:", isSmallBlindPosition);

    // Get action limits if available
    const getActionLimits = (actionType: string) => {
        const action = availableActions.find((a: any) => a.action === actionType);
        return action
            ? {
                  min: action.min,
                  max: action.max
              }
            : null;
    };

    const result = {
        isInTable: true,
        isPlayerTurn,
        seat: player.seat,
        stack: player.stack,
        status: player.status,
        availableActions,
        canPostSmallBlind: canPostSmallBlind || isSmallBlindPosition,
        canPostBigBlind,
        canCheck,
        canCall,
        canBet,
        canRaise,
        canFold,
        betLimits: getActionLimits("bet"),
        raiseLimits: getActionLimits("raise"),
        callAmount: getActionLimits("call")?.min || "0",
        smallBlindAmount: getActionLimits("post small blind")?.min || actualTableData.smallBlind || "0",
        bigBlindAmount: getActionLimits("post big blind")?.min || actualTableData.bigBlind || "0",
        isSmallBlindPosition
    };

    // console.log("Returning user status:", result);
    return result;
};

/**
 * Check if the current user is playing at the table
 * @param tableData The table data from context
 * @returns Boolean indicating if the user is playing
 */
export const isUserPlaying = (tableData: any): boolean => {
    if (!tableData || !tableData.players) return false;

    const userAddress = localStorage.getItem("user_eth_public_key");
    if (!userAddress) return false;

    // Check if the user's address is in the players array
    return tableData.players.some((player: any) => player.address.toLowerCase() === userAddress.toLowerCase());
};
