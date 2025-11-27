import { betHand, callHand, checkHand, dealCards, foldHand, muckCards, showCards, sitIn, sitOut, startNewHand } from "../../hooks/playerActions";
import type { NetworkEndpoints } from "../../context/NetworkContext";

/**
 * All handlers now return Promise<string | null> where:
 * - string is the transaction hash on success
 * - null is returned on error or if tableId is missing
 *
 * Amounts are accepted as bigint (in micro-units, 10^6 precision).
 */

const handleCheck = async (tableId: string | undefined, network: NetworkEndpoints): Promise<string | null> => {
    if (!tableId) return null;

    try {
        const result = await checkHand(tableId, network);
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to check:", error);
        return null;
    }
};

const handleFold = async (tableId: string | undefined, network: NetworkEndpoints): Promise<string | null> => {
    if (!tableId) return null;

    try {
        const result = await foldHand(tableId, network);
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to fold:", error);
        return null;
    }
};

/**
 * Handle call action
 * @param amount - Amount in micro-units as bigint (10^6 precision)
 */
const handleCall = async (amount: bigint, tableId: string | undefined, network: NetworkEndpoints): Promise<string | null> => {
    if (!tableId) return null;

    try {
        const result = await callHand(tableId, amount, network);
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to call:", error);
        return null;
    }
};

/**
 * Handle bet action
 * @param amount - Amount in micro-units as bigint (10^6 precision)
 */
const handleBet = async (amount: bigint, tableId: string | undefined, network: NetworkEndpoints): Promise<string | null> => {
    if (!tableId) return null;

    try {
        const result = await betHand(tableId, amount, network);
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to bet:", error);
        return null;
    }
};

// Handler for muck action
const handleMuck = async (tableId: string | undefined, network: NetworkEndpoints): Promise<string | null> => {
    if (!tableId) return null;

    try {
        const result = await muckCards(tableId, network);
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to muck cards:", error);
        return null;
    }
};

// Handler for show action
const handleShow = async (tableId: string | undefined, network: NetworkEndpoints): Promise<string | null> => {
    if (!tableId) return null;

    try {
        const result = await showCards(tableId, network);
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to show cards:", error);
        return null;
    }
};

// Handler for deal action
const handleDeal = async (tableId: string | undefined, network: NetworkEndpoints): Promise<string | null> => {
    if (!tableId) return null;

    try {
        const result = await dealCards(tableId, network);
        console.log("Deal completed successfully");
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to deal:", error);
        return null;
    }
};

// Add the handleStartNewHand function after the other handler functions
const handleStartNewHand = async (tableId: string | undefined, network: NetworkEndpoints): Promise<string | null> => {
    if (!tableId) return null;

    try {
        // Simple call - let errors bubble up naturally
        const result = await startNewHand(tableId, network);
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to start new hand:", error);
        return null;
    }
};

// Handler for sit out action
const handleSitOut = async (tableId: string | undefined, network: NetworkEndpoints): Promise<string | null> => {
    if (!tableId) return null;

    try {
        const result = await sitOut(tableId, network);
        console.log("Sit out completed successfully");
        return result?.hash || null;
    } catch (error: any) {
        console.error("Failed to sit out:", error);
        return null;
    }
};

// Handler for sit in action
const handleSitIn = async (tableId: string | undefined, network: NetworkEndpoints): Promise<string | null> => {
    if (!tableId) return null;

    try {
        const result = await sitIn(tableId, network);
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
