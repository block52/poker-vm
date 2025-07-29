import { ethers } from "ethers";
import { betHand, callHand, checkHand, dealCards, foldHand, muckCards, showCards, startNewHand } from "../../hooks/playerActions";
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
            // Use our function to bet with the current raiseAmount
            const amountWei = ethers.parseUnits(amount.toString(), 18).toString();
            await callHand(tableId, amountWei);
        } catch (error: any) {
            console.error("Failed to call:", error);
        }
    } else {
        console.error("Call action not available");
    }
};

const handleBet = async (betAction: LegalActionDTO | undefined, amount: number, tableId?: string) => {
    if (!tableId) return;

    // Use our function to bet with the current raiseAmount
    const amountWei = ethers.parseUnits(amount.toString(), 18).toString();

    try {
        await betHand(tableId, amountWei);
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

export {
    handleBet,
    handleCall,
    handleCheck,
    handleDeal,
    handleFold,
    handleMuck,
    handleShow,
    handleStartNewHand,
};
