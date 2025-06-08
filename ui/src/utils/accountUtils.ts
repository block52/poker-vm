import { ethers } from "ethers";
import { TableData, TableStatus } from "../types/index";
import { LegalActionDTO, PlayerActionType, PlayerDTO } from "@bitcoinbrisbane/block52";

// TODO: Seems to be the same action type?
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
export const getUserTableStatus = (tableData: any): TableStatus | undefined => {

    if (!tableData) {
        return undefined;
    }

    // Extract the actual table data from the nested structure
    const actualTableData = tableData.data || tableData;

    const userAddress = localStorage.getItem("user_eth_public_key");
    if (!userAddress) {
        return undefined;
    }

    // Try to find player in different possible locations
    const playersArray = actualTableData.players || [];

    // Find the player in the table
    const player = playersArray.find((p: PlayerDTO) => p.address?.toLowerCase() === userAddress.toLowerCase());

    if (!player) {
        return undefined;
    }

    // Check if it's the player's turn
    const nextToAct = actualTableData.nextToAct;
    const isPlayerTurn = nextToAct === player.seat;

    // Get available actions
    const availableActions = player.legalActions || [];

    // Check for specific actions
    const canPostSmallBlind = availableActions.some((a: LegalActionDTO) => a.action === PlayerActionType.SMALL_BLIND);
    const canPostBigBlind = availableActions.some((a: LegalActionDTO) => a.action === PlayerActionType.BIG_BLIND);
    const canCheck = availableActions.some((a: LegalActionDTO) => a.action === PlayerActionType.CHECK);
    const canCall = availableActions.some((a: LegalActionDTO) => a.action === PlayerActionType.CALL);
    const canBet = availableActions.some((a: LegalActionDTO) => a.action === PlayerActionType.BET);
    const canRaise = availableActions.some((a: LegalActionDTO) => a.action === PlayerActionType.RAISE);
    const canFold = availableActions.some((a: LegalActionDTO) => a.action === PlayerActionType.FOLD);

    // Check if player is in small blind position
    const isSmallBlindPosition = actualTableData.smallBlindPosition === player.seat;
    // console.log("Is small blind position:", isSmallBlindPosition);

    // Get action limits if available
    const getActionLimits = (actionType: string) => {
        const action = availableActions.find((a: LegalActionDTO) => a.action === actionType);
        return action
            ? {
                min: action.min,
                max: action.max
            }
            : null;
    };

    const result: TableStatus = {
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
export const isUserPlaying = (tableData: TableData): boolean => {
    if (!tableData || !tableData.players) return false;

    const userAddress = localStorage.getItem("user_eth_public_key");
    if (!userAddress) return false;

    // Check if the user's address is in the players array
    return tableData.players.some((player: PlayerDTO) => player.address.toLowerCase() === userAddress.toLowerCase());
};

export const getNonce = async (): Promise<number> => {
    const nonce = Date.now();
    return nonce;
}

/**
 * Format player ID for display
 * @param playerId The player's ID or address
 * @returns Formatted string with first 6 and last 4 characters
 */
export const formatPlayerId = (playerId: string) => {
    return `${playerId.slice(0, 6)}...${playerId.slice(-4)}`;
};

/**
 * Format amount from wei to dollars
 * @param amount The amount in wei
 * @returns Formatted string with dollar sign and 2 decimal places
 */
export const formatAmount = (amount: string) => {
    return `$${(Number(amount) / 10**18).toFixed(2)}`;
};