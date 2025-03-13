import { ethers } from "ethers";
import { PlayerActionType } from "@bitcoinbrisbane/block52";

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
    if (!tableData) return null;
    console.log("Table Data userstatus:", tableData);
    
    const userAddress = localStorage.getItem('user_eth_public_key');
    if (!userAddress) return null;
    
    // Find the player in the table
    const player = tableData?.tableDataPlayers?.find((p: any) => 
        p.address.toLowerCase() === userAddress.toLowerCase()
    );
    console.log("Player:", player);
    
    if (!player) return null;
    
    // Check if it's the player's turn
    const isPlayerTurn = tableData.nextToAct === player.seat;
    
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
    
    // Get action limits if available
    const getActionLimits = (actionType: string) => {
        const action = availableActions.find((a: any) => a.action === actionType);
        return action ? {
            min: action.min,
            max: action.max
        } : null;
    };
    
    return {
        isInTable: true,
        isPlayerTurn,
        seat: player.seat,
        stack: player.stack,
        status: player.status,
        availableActions,
        canPostSmallBlind,
        canPostBigBlind,
        canCheck,
        canCall,
        canBet,
        canRaise,
        canFold,
        betLimits: getActionLimits("bet"),
        raiseLimits: getActionLimits("raise"),
        callAmount: getActionLimits("call")?.min || "0",
        smallBlindAmount: getActionLimits("post small blind")?.min || "0",
        bigBlindAmount: getActionLimits("post big blind")?.min || "0"
    };
}; 