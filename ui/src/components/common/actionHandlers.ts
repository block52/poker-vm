// import { ethers } from "ethers";
// import { checkHand, foldHand, postBigBlind, postSmallBlind, raiseHand } from "../../hooks/playerActions";

import { dealCards, muckCards, showCards, startNewHand } from "../../hooks/playerActions";

// // Handler functions for different actions - simplified
// const handlePostSmallBlind = async () => {
//     if (!tableId) return;

//     const smallBlindAmount = smallBlindAction?.min || gameOptions?.smallBlind;
//     if (!smallBlindAmount) return;

//     // Simple call - let errors bubble up naturally
//     await postSmallBlind(tableId, smallBlindAmount);
// };

// const handlePostBigBlind = async () => {
//     if (!tableId) return;

//     const bigBlindAmount = bigBlindAction?.min || gameOptions?.bigBlind;
//     if (!bigBlindAmount) return;

//     // Simple call - let errors bubble up naturally
//     await postBigBlind(tableId, bigBlindAmount);
// };

// const handleCheck = async () => {
//     if (!tableId) {
//         console.error("Table ID not available");
//         return;
//     }

//     try {
//         await checkHand(tableId);
//     } catch (error: any) {
//         console.error("Failed to check:", error);
//     }
// };

// const handleFold = async () => {
//     if (!tableId) {
//         console.error("Table ID not available");
//         return;
//     }

//     try {
//         await foldHand(tableId);
//     } catch (error: any) {
//         console.error("Failed to fold:", error);
//     }
// };

// const handleCall = async () => {
//     if (!tableId) {
//         console.error("Private key or table ID not available");
//         return;
//     }

//     if (callAction) {
//         try {
//             // Use our function to bet with the current raiseAmount
//             const amountWei = ethers.parseUnits(callAmount.toString(), 18).toString();
//             await callHand(tableId, amountWei);
//         } catch (error: any) {
//             console.error("Failed to call:", error);
//         }
//     } else {
//         console.error("Call action not available");
//     }
// };

// const handleBet = async () => {
//     if (!tableId) {
//         console.error("Table ID not available");
//         return;
//     }

//     // Use our function to bet with the current raiseAmount
//     const amountWei = ethers.parseUnits(raiseAmount.toString(), 18).toString();

//     try {
//         await betHand(tableId, amountWei);
//     } catch (error: any) {
//         console.error("Failed to bet:", error);
//     }
// };

// const handleRaise = async () => {
//     if (!tableId) {
//         console.error("Table ID not available");
//         return;
//     }

//     // Use our function to raise with the current raiseAmount
//     const amountWei = ethers.parseUnits(raiseAmount.toString(), 18).toString();

//     try {
//         await raiseHand(tableId, amountWei);
//     } catch (error: any) {
//         console.error("Failed to raise:", error);
//     }
// };

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
    handleShow,
    handleMuck,
    handleDeal,
    handleStartNewHand,
};

// export {
//     handlePostSmallBlind,
//     handlePostBigBlind,
//     handleCheck,
//     handleFold,
//     handleCall,
//     handleBet,
//     handleRaise
// };