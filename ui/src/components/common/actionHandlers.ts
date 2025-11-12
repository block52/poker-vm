import { betHand, callHand, checkHand, dealCards, foldHand, muckCards, showCards, sitIn, sitOut, startNewHand } from "../../hooks/playerActions";
import { LegalActionDTO } from "@bitcoinbrisbane/block52";

/**
 * All handlers now return Promise<string | null> where:
 * - string is the transaction hash on success
 * - null is returned on error or if tableId is missing
 */

const handleCheck = async (tableId?: string): Promise<string | null> => {
    if (!tableId) return null;

    try {
        const result = await checkHand(tableId);
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to check:", error);
        return null;
    }
};

const handleFold = async (tableId?: string): Promise<string | null> => {
    if (!tableId) return null;

    try {
        const result = await foldHand(tableId);
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to fold:", error);
        return null;
    }
};

const handleCall = async (callAction: LegalActionDTO | undefined, amount: number, tableId?: string): Promise<string | null> => {
    if (!tableId) return null;

    if (callAction) {
        try {
            // Convert amount to microunits (6 decimals for USDC on Cosmos)
            const amountMicrounits = (amount * 1_000_000).toString();
            const result = await callHand(tableId, amountMicrounits);
            return result?.hash || null;
        } catch (error: any) {
            console.error("Failed to call:", error);
            return null;
        }
    } else {
        console.error("Call action not available");
        return null;
    }
};

const handleBet = async (betAction: LegalActionDTO | undefined, amount: number, tableId?: string): Promise<string | null> => {
    if (!tableId) return null;

    // Convert amount to microunits (6 decimals for USDC on Cosmos)
    const amountMicrounits = (amount * 1_000_000).toString();

    try {
        const result = await betHand(tableId, amountMicrounits);
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to bet:", error);
        return null;
    }
};

// Handler for muck action
const handleMuck = async (tableId?: string): Promise<string | null> => {
    if (!tableId) return null;

    try {
        const result = await muckCards(tableId);
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to muck cards:", error);
        return null;
    }
};

// Handler for show action
const handleShow = async (tableId?: string): Promise<string | null> => {
    if (!tableId) return null;

    try {
        const result = await showCards(tableId);
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to show cards:", error);
        return null;
    }
};

// Handler for deal action
const handleDeal = async (tableId?: string): Promise<string | null> => {
    if (!tableId) return null;

    try {
        const result = await dealCards(tableId);
        console.log("Deal completed successfully");
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to deal:", error);
        return null;
    }
};

// Add the handleStartNewHand function after the other handler functions
const handleStartNewHand = async (tableId?: string): Promise<string | null> => {
    if (!tableId) return null;

    try {
        // Simple call - let errors bubble up naturally
        const result = await startNewHand(tableId);
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to start new hand:", error);
        return null;
    }
};

// Handler for sit out action
const handleSitOut = async (tableId?: string): Promise<string | null> => {
    if (!tableId) return null;

    try {
        const result = await sitOut(tableId);
        console.log("Sit out completed successfully");
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to sit out:", error);
        return null;
    }
};

// Handler for sit in action
const handleSitIn = async (tableId?: string): Promise<string | null> => {
    if (!tableId) return null;

    try {
        const result = await sitIn(tableId);
        console.log("Sit in completed successfully");
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to sit in:", error);
        return null;
    }
};

export {
    handleBet,
    handleCall,
    handleCheck,
    handleDeal,
    handleFold,
    handleMuck,
    handleShow,
    handleSitIn,
    handleSitOut,
    handleStartNewHand,
};
