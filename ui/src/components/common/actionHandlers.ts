import { betHand, callHand, checkHand, dealCards, foldHand, muckCards, showCards, sitIn, sitOut, startNewHand } from "../../hooks/playerActions";
import { LegalActionDTO } from "@bitcoinbrisbane/block52";

const handleCheck = async (tableId?: string) => {
    if (!tableId) return;

    try {
        await checkHand(tableId);
    } catch (error: any) {
        console.error("Failed to check:", error);
    }
};

const handleFold = async (tableId?: string) => {
    if (!tableId) return;

    try {
        await foldHand(tableId);
    } catch (error: any) {
        console.error("Failed to fold:", error);
    }
};

const handleCall = async (callAction: LegalActionDTO | undefined, amount: number, tableId?: string) => {
    if (!tableId) return;

    if (callAction) {
        try {
            // Convert amount to microunits (6 decimals for USDC on Cosmos)
            const amountMicrounits = (amount * 1_000_000).toString();
            await callHand(tableId, amountMicrounits);
        } catch (error: any) {
            console.error("Failed to call:", error);
        }
    } else {
        console.error("Call action not available");
    }
};

const handleBet = async (betAction: LegalActionDTO | undefined, amount: number, tableId?: string) => {
    if (!tableId) return;

    // Convert amount to microunits (6 decimals for USDC on Cosmos)
    const amountMicrounits = (amount * 1_000_000).toString();

    try {
        await betHand(tableId, amountMicrounits);
    } catch (error: any) {
        console.error("Failed to bet:", error);
    }
};

// Handler for muck action
const handleMuck = async (tableId?: string) => {
    if (!tableId) return;

    try {
        await muckCards(tableId);
    } catch (error: any) {
        console.error("Failed to muck cards:", error);
    }
};

// Handler for show action
const handleShow = async (tableId?: string) => {
    if (!tableId) return;

    try {
        await showCards(tableId);
    } catch (error: any) {
        console.error("Failed to show cards:", error);
    }
};

// Handler for deal action
const handleDeal = async (tableId?: string) => {
    if (!tableId) return;

    try {
        await dealCards(tableId);
        console.log("Deal completed successfully");
    } catch (error: any) {
        console.error("Failed to deal:", error);
    }
};

// Add the handleStartNewHand function after the other handler functions
const handleStartNewHand = async (tableId?: string) => {
    if (!tableId) return;

    // Simple call - let errors bubble up naturally
    await startNewHand(tableId);
};

// Handler for sit out action
const handleSitOut = async (tableId?: string) => {
    if (!tableId) return;

    try {
        await sitOut(tableId);
        console.log("Sit out completed successfully");
    } catch (error: any) {
        console.error("Failed to sit out:", error);
    }
};

// Handler for sit in action
const handleSitIn = async (tableId?: string) => {
    if (!tableId) return;

    try {
        await sitIn(tableId);
        console.log("Sit in completed successfully");
    } catch (error: any) {
        console.error("Failed to sit in:", error);
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
