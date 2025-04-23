import { useEffect, useState } from "react";
import * as React from "react";
import { useTableContext } from "../context/TableContext";
import { PlayerActionType, LegalActionDTO } from "@bitcoinbrisbane/block52";
import { PROXY_URL } from "../config/constants";
import { useTableState } from "../hooks/useTableState";
import { useParams } from "react-router-dom";
import { useTableNonce, AccountData } from "../hooks/useTableNonce";

// Import our custom hooks
import { usePlayerDTO } from "../hooks/usePlayerDTO";
import { usePlayerLegalActions } from "../hooks/usePlayerLegalActions";
import { useDealTable } from "../hooks/useDealTable";
import { useTableCheck } from "../hooks/useTableCheck";
import { useTableFold } from "../hooks/useTableFold";
import { useTableRaise } from "../hooks/useTableRaise";
import { useTablePostSmallBlind } from "../hooks/useTablePostSmallBlind";
import { useTablePostBigBlind } from "../hooks/useTablePostBigBlind";

import axios from "axios";
import { getUserTableStatus } from "../utils/accountUtils";
import { isPlayerTurnToPostBlind } from "../utils/tableUtils";
import { ethers } from "ethers";

// Define a type for the user status
type UserTableStatus = {
    isInTable: boolean;
    isPlayerTurn: boolean;
    seat: any;
    stack: any;
    status: any;
    availableActions: any;
    canPostSmallBlind: any;
    canPostBigBlind: any;
    canCheck: any;
    canCall: any;
    canBet: any;
    canRaise: any;
    canFold: any;
    betLimits: any;
    raiseLimits: any;
    callAmount: any;
    smallBlindAmount: any;
    bigBlindAmount: any;
} | null;

const PokerActionPanel: React.FC = () => {
    const { id: tableId } = useParams<{ id: string }>();
    
    // Get data from our custom hooks
    const { nonce, accountData, refreshNonce } = useTableNonce();
    const { players } = usePlayerDTO(tableId);
    const { legalActions, isPlayerTurn, playerStatus, playerSeat } = usePlayerLegalActions(tableId);
    const { dealTable, canDeal } = useDealTable(tableId);
    const { checkHand } = useTableCheck(tableId);
    const { foldHand } = useTableFold(tableId);
    const { raiseHand } = useTableRaise(tableId);
    const { postSmallBlind } = useTablePostSmallBlind(tableId);
    const { postBigBlind } = useTablePostBigBlind(tableId);
    
    // We'll still use tableContext for now, but we'll gradually replace its functionalities
    const { 
        tableData,
        // We can replace these with our custom hooks
        // playerLegalActions, // replaced with legalActions from usePlayerLegalActions
        // isPlayerTurn,       // replaced with isPlayerTurn from usePlayerLegalActions  
        // canDeal,            // replaced with canDeal from useDealTable
        // dealTable,          // replaced with dealTable from useDealTable
        // nonce,              // replaced with nonce from useTableNonce
        // refreshNonce,       // replaced with refreshNonce from useTableNonce
    } = useTableContext();
    
    // Add the useTableState hook to get table state properties
    const { 
        currentRound, 
        totalPot: tableTotalPot, 
        formattedTotalPot,
        tableType, 
        roundType 
    } = useTableState(tableId);
    
    // Log info from our hooks for debugging
    useEffect(() => {
        console.log("🔢 Current nonce from hook:", nonce);
        console.log("💰 Account data from hook:", accountData);
        console.log("👥 Players from usePlayerDTO:", players);
        console.log("🎮 Legal actions from usePlayerLegalActions:", legalActions);
        console.log("🎲 Can deal from useDealTable:", canDeal);
    }, [nonce, accountData, players, legalActions, canDeal]);
    
    const [publicKey, setPublicKey] = useState<string>();
    const [isCallAction, setIsCallAction] = useState(false);
    const [isCheckAction, setIsCheckAction] = useState(false);
    const [balance, setBalance] = useState(0);

    // Get user's seat from localStorage or tableData
    const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
    const userPlayer = tableData?.data?.players?.find((player: any) => player.address?.toLowerCase() === userAddress?.toLowerCase());
    const userSeat = userPlayer?.seat;

    // Check if fold action exists in legal actions
    const hasFoldAction = legalActions?.some((a: any) => a.action === "fold" || a.action === PlayerActionType.FOLD);

    // Check if current user has the deal action
    const currentUserCanDeal = userPlayer?.legalActions?.some((action: any) => action.action === "deal") || false;

    // Only show deal button if global canDeal is true AND current user has the deal action
    const shouldShowDealButton = canDeal && currentUserCanDeal;

    // New flag to determine whether to hide other action buttons when deal is available
    const hideOtherButtons = shouldShowDealButton;

    // const { data } = useUserBySeat(publicKey || "", userSeat);
    const [userStatus, setUserStatus] = useState<UserTableStatus>(null);

    // Get current player's possible actions
    const nextToAct = tableData?.nextToAct;
    const currentPlayer = tableData?.players?.find((p: any) => p.seat === nextToAct);
    const currentPlayerActions = currentPlayer?.legalActions || [];

    // Check if each action is available based on legalActions
    const canFold = legalActions?.some((a: any) => a.action === PlayerActionType.FOLD);
    const canCall = legalActions?.some((a: any) => a.action === PlayerActionType.CALL);
    const canRaise = legalActions?.some((a: any) => a.action === PlayerActionType.RAISE);
    const canCheck = legalActions?.some((a: any) => a.action === PlayerActionType.CHECK);
    const canBet = legalActions?.some((a: any) => a.action === PlayerActionType.BET);

    // Get min/max values for bet and raise
    const betAction = legalActions?.find((a: any) => a.action === PlayerActionType.BET);
    const raiseAction = legalActions?.find((a: any) => a.action === PlayerActionType.RAISE);
    const callAction = legalActions?.find((a: any) => a.action === PlayerActionType.CALL);

    // Convert values to ETH for display
    const minBet = betAction ? Number(ethers.formatUnits(betAction.min || "0", 18)) : 0;
    const maxBet = betAction ? Number(ethers.formatUnits(betAction.max || "0", 18)) : 0;
    const minRaise = raiseAction ? Number(ethers.formatUnits(raiseAction.min || "0", 18)) : 0;
    const maxRaise = raiseAction ? Number(ethers.formatUnits(raiseAction.max || "0", 18)) : 0;
    const callAmount = callAction ? Number(ethers.formatUnits(callAction.min || "0", 18)) : 0;

    //
    const [raiseAmount, setRaiseAmount] = useState<number>(minRaise);
    const [raiseInputRaw, setRaiseInputRaw] = useState<string>(minRaise.toFixed(2)); // or minBet
    const [lastAmountSource, setLastAmountSource] = useState<"slider" | "input" | "button">("slider");

    const isRaiseAmountInvalid = canRaise ? raiseAmount < minRaise || raiseAmount > maxRaise : canBet ? raiseAmount < minBet || raiseAmount > maxBet : false;

    // Get total pot for percentage calculations
    const totalPot = Number(formattedTotalPot) || 0;

    useEffect(() => {
        if (tableData) {
            // console.log("Table Data:asdfasd", tableData);
            const status = getUserTableStatus(tableData);
            // console.log("User Status:", status);
            setUserStatus(status || null);

            // Check if it's the current user's turn directly from tableData
            const nextToActPlayer = tableData.players?.find((player: any) => player.seat === tableData.nextToAct);

            if (nextToActPlayer && nextToActPlayer.address?.toLowerCase() === userAddress) {
                // console.log("It's your turn to act!");

                // Check if this is a small blind posting situation
                const isSmallBlindPosition = tableData.smallBlindPosition === nextToActPlayer.seat;
                // console.log("Is small blind position:", isSmallBlindPosition);

                // Set minimal user status if needed
                if (!status) {
                    setUserStatus({
                        isInTable: true,
                        isPlayerTurn: true,
                        seat: nextToActPlayer.seat,
                        availableActions: nextToActPlayer.legalActions || [],
                        // Add other necessary properties with default values
                        stack: nextToActPlayer.stack || "0",
                        status: "active",
                        canPostSmallBlind: isSmallBlindPosition,
                        canPostBigBlind: tableData.bigBlindPosition === nextToActPlayer.seat,
                        canCheck: nextToActPlayer.legalActions?.some((a: any) => a.action === PlayerActionType.CHECK),
                        canCall: nextToActPlayer.legalActions?.some((a: any) => a.action === PlayerActionType.CALL),
                        canBet: nextToActPlayer.legalActions?.some((a: any) => a.action === PlayerActionType.BET),
                        canRaise: nextToActPlayer.legalActions?.some((a: any) => a.action === PlayerActionType.RAISE),
                        canFold: nextToActPlayer.legalActions?.some((a: any) => a.action === PlayerActionType.FOLD),
                        betLimits: null,
                        raiseLimits: null,
                        callAmount: "0",
                        smallBlindAmount: tableData.smallBlind || "0",
                        bigBlindAmount: tableData.bigBlind || "0"
                    });
                }
            }
        }
    }, [tableData]);

    useEffect(() => {
        const localKey = localStorage.getItem("user_eth_public_key");
        if (!localKey) return setPublicKey(undefined);

        setPublicKey(localKey);
    }, [publicKey]);

    // Log the player's legal actions
    useEffect(() => {
        // console.log("Footer - Player's legal actions:", {
        //     actions: playerLegalActions,
        //     isPlayerTurn,
        //     nextToAct: tableData?.nextToAct,
        //     userSeat
        // });
    }, [legalActions, isPlayerTurn, tableData, userSeat]);

    const handleRaiseChange = (newAmount: number) => {
        setRaiseAmount(newAmount);
        setRaiseInputRaw(newAmount.toFixed(2));
    };

    // Player action function to handle all game actions
    const handleSetPlayerAction = async (action: PlayerActionType, amount: string) => {
        console.log("Setting player action:", action, amount);
        if (!userAddress || !tableData?.data?.address) {
            console.error("Missing user address or table ID", { userAddress, tableId: tableData?.data?.address });
            return;
        }

        try {
            console.log(`Executing player action: ${action} with amount: ${amount}`);

            // Get the private key from localStorage
            const privateKey = localStorage.getItem("user_eth_private_key");
            if (!privateKey) {
                console.error("Private key not found");
                return;
            }

            // Create a wallet instance to sign the message
            const wallet = new ethers.Wallet(privateKey);

            // Create the message to sign - Add delimiters for clarity and reliability
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const tableId = tableData.data.address;

            // Ensure action is properly formatted and consistent with API expectations
            // Convert action to lowercase string as expected by the API
            let formattedAction = "";

            // Handle the action format based on the type
            if (typeof action === "string") {
                formattedAction = action.toLowerCase();
            } else if (typeof action === "number") {
                // If it's a numeric enum, map it to the expected string
                switch (action) {
                    case PlayerActionType.FOLD:
                        formattedAction = "fold";
                        break;
                    case PlayerActionType.CHECK:
                        formattedAction = "check";
                        break;
                    case PlayerActionType.CALL:
                        formattedAction = "call";
                        break;
                    case PlayerActionType.BET:
                        formattedAction = "bet";
                        break;
                    case PlayerActionType.RAISE:
                        formattedAction = "raise";
                        break;
                    case PlayerActionType.SMALL_BLIND:
                        formattedAction = "post small blind";
                        break;
                    case PlayerActionType.BIG_BLIND:
                        formattedAction = "post big blind";
                        break;
                    default:
                        formattedAction = (action as any).toString().toLowerCase();
                }
            } else {
                formattedAction = (action as any).toString().toLowerCase();
            }

            console.log(`Formatted action: ${formattedAction}`);

            const message = `${formattedAction}:${amount}:${tableId}:${timestamp}`;

            // Sign the message
            const signature = await wallet.signMessage(message);

            console.log("Message signed:", message);
            console.log("Signature:", signature);

            // Debug log for the entire payload we're about to send
            const payload = {
                userAddress,
                action: formattedAction,
                amount,
                signature,
                publicKey: userAddress, // Add publicKey which is needed by the API
                timestamp
            };

            console.log("Full API payload:", JSON.stringify(payload, null, 2));

            // Send the action to the backend

            const response = await axios.post(`${PROXY_URL}/table/${tableId}/playeraction`, payload);

            console.log("Player action response:", response.data);

            // Check if there is an error in the response
            if (response.data.error) {
                console.error(`Action error: ${response.data.error}`);
                // You could also display this error to the user via a toast notification
                alert(`Action failed: ${response.data.error}`);
            }

            // Reset UI states after action

            setIsCallAction(false);
            setIsCheckAction(false);
        } catch (error: any) {
            console.error("Error executing player action:", error);
            // Log the error stack trace for debugging
            console.error("Error stack:", error.stack);

            // Show the detailed error
            if (error.response) {
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
                // Display a more detailed error message to the user
                alert(`Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else {
                // Generic error message
                alert(`Error executing action: ${error.message}`);
            }
        }
    };

    //Min Raise Text Prefill
    useEffect(() => {
        if (canRaise && minRaise > 0) {
            setRaiseAmount(minRaise);
            setRaiseInputRaw(minRaise.toFixed(2));
        } else if (canBet && minBet > 0) {
            setRaiseAmount(minBet);
            setRaiseInputRaw(minBet.toFixed(2));
        }
    }, [canRaise, canBet, minRaise, minBet]);

    // Handler functions for different actions - Now use our custom hooks
    const handlePostSmallBlind = () => {
        console.log("Posting small blind");
        const publicKey = localStorage.getItem("user_eth_public_key");
        const privateKey = localStorage.getItem("user_eth_private_key");
        
        if (!publicKey || !privateKey || !postSmallBlind) {
            console.error("Wallet keys not available or hook not ready");
            return;
        }
        
        // Use our hook to post small blind
        postSmallBlind({
            userAddress: publicKey,
            privateKey,
            publicKey,
            actionIndex: legalActions?.[0]?.index || 0,
        });
    };

    const handlePostBigBlind = () => {
        console.log("Posting big blind");
        const publicKey = localStorage.getItem("user_eth_public_key");
        const privateKey = localStorage.getItem("user_eth_private_key");
        
        if (!publicKey || !privateKey || !postBigBlind) {
            console.error("Wallet keys not available or hook not ready");
            return;
        }
        
        // Use our hook to post big blind
        postBigBlind({
            userAddress: publicKey,
            privateKey,
            publicKey,
            actionIndex: legalActions?.[0]?.index || 0,
        });
    };

    const handleCheck = () => {
        console.log("Checking");
        const publicKey = localStorage.getItem("user_eth_public_key");
        const privateKey = localStorage.getItem("user_eth_private_key");
        
        if (!publicKey || !privateKey || !checkHand) {
            console.error("Wallet keys not available or hook not ready");
            return;
        }
        
        // Use our hook to check
        checkHand({
            userAddress: publicKey,
            privateKey,
            publicKey,
            actionIndex: legalActions?.find(a => a.action === PlayerActionType.CHECK)?.index || 0,
        });
    };

    const handleFold = () => {
        console.log("Folding");
        const publicKey = localStorage.getItem("user_eth_public_key");
        const privateKey = localStorage.getItem("user_eth_private_key");
        
        if (!publicKey || !privateKey || !foldHand) {
            console.error("Wallet keys not available or hook not ready");
            return;
        }
        
        // Use our hook to fold
        foldHand({
            userAddress: publicKey,
            privateKey,
            publicKey,
            actionIndex: legalActions?.find(a => a.action === PlayerActionType.FOLD)?.index || 0,
        });
    };

    const handleCall = () => {
        console.log("Calling");
        if (callAction) {
            // Use the callAction.min value directly from the action object
            // This ensures we're using the exact value expected by the contract
            console.log("Calling with amount:", callAction.min);
            handleSetPlayerAction(PlayerActionType.CALL, callAction.min.toString());
        } else {
            console.error("Call action not available");
        }
    };

    const handleBet = () => {
        console.log("Betting button clicked");
        // Log the bet limits from the legal actions
        console.log("Bet legal action:", betAction);
        console.log("Min bet:", minBet, "Max bet:", maxBet);

        // Set initial bet amount to minimum
        console.log("betting");
        submitBetOrRaise();

        // Show the bet input modal/section
        console.log("Showing bet input section");
    };

    const handleRaise = () => {
        console.log("Raising");
        submitBetOrRaise();
    };

    const submitBetOrRaise = () => {
        if (raiseAmount <= 0) {
            console.error("Cannot bet or raise with zero or negative amount");
            return;
        }

        const amountWei = ethers.parseUnits(raiseAmount.toString(), 18).toString();

        if (canRaise) {
            if (raiseAmount < minRaise) {
                console.warn(`Raise amount ${raiseAmount} < minRaise ${minRaise}. Forcing to min.`);
                const minRaiseWei = ethers.parseUnits(minRaise.toString(), 18).toString();
                handleSetPlayerAction(PlayerActionType.RAISE, minRaiseWei);
            } else if (raiseAmount > maxRaise) {
                console.warn(`Raise amount ${raiseAmount} > maxRaise ${maxRaise}. Forcing to max.`);
                const maxRaiseWei = ethers.parseUnits(maxRaise.toString(), 18).toString();
                handleSetPlayerAction(PlayerActionType.RAISE, maxRaiseWei);
            } else {
                handleSetPlayerAction(PlayerActionType.RAISE, amountWei);
            }
            return;
        }

        if (canBet) {
            if (raiseAmount < minBet) {
                console.warn(`Bet amount ${raiseAmount} < minBet ${minBet}. Forcing to min.`);
                const minBetWei = ethers.parseUnits(minBet.toString(), 18).toString();
                handleSetPlayerAction(PlayerActionType.BET, minBetWei);
            } else if (raiseAmount > maxBet) {
                console.warn(`Bet amount ${raiseAmount} > maxBet ${maxBet}. Forcing to max.`);
                const maxBetWei = ethers.parseUnits(maxBet.toString(), 18).toString();
                handleSetPlayerAction(PlayerActionType.BET, maxBetWei);
            } else {
                handleSetPlayerAction(PlayerActionType.BET, amountWei);
            }
        }
    };

    //Raise State snapshop for capturing edge cases and verify behaviour
    useEffect(() => {
        console.log("Raise State Snapshot", {
            raiseAmount,
            raiseInputRaw,
            minBet,
            maxBet,
            minRaise,
            maxRaise,
            canBet,
            canRaise,
            isRaiseAmountInvalid
        });
    }, [raiseAmount, raiseInputRaw, minBet, maxBet, minRaise, maxRaise]);

    // Make sure we're passing the actual table data object, not the wrapper
    const actualTableData = tableData?.data;

    // Use our helper functions to determine if blind buttons should be shown
    const shouldShowSmallBlindButton = legalActions?.some(action => action.action === "post-small-blind") && isPlayerTurn;
    const shouldShowBigBlindButton = legalActions?.some(action => action.action === "post-big-blind") && isPlayerTurn;

    // Add a more robust check for whether it's actually the player's turn
    useEffect(() => {
        // Log detailed information about the current game state
        // console.log("Detailed game state check:", {
        //     tableData,
        //     playerLegalActions,
        //     isPlayerTurn,
        //     activePlayers: tableData?.data?.players?.filter((p: any) =>
        //         p.status !== 'folded' && p.status !== 'sitting-out'),
        //     userAddress,
        //     nextToAct: tableData?.data?.nextToAct
        // });

        // If there are no legal actions or all players except one have folded,
        // we shouldn't show action buttons even if isPlayerTurn is true
        const activePlayers = tableData?.data?.players?.filter((p: any) => p.status !== "folded" && p.status !== "sitting-out");

        if (activePlayers?.length <= 1) {
            console.log("Only one active player left - no actions needed");
        }
    }, [tableData, legalActions, isPlayerTurn, userAddress]);

    // Update the showActionButtons logic to be more robust
    const hasLegalActions = legalActions && legalActions.length > 0;
    const activePlayers = tableData?.data?.players?.filter((p: any) => p.status !== "folded" && p.status !== "sitting-out");
    const gameInProgress = activePlayers && activePlayers.length > 1;

    // Always show fold button regardless of other conditions if the player has legal actions
    const canFoldAnytime = legalActions?.some((a: any) => a.action === PlayerActionType.FOLD || a.action === "fold") && userPlayer?.status !== "folded";

    console.log("canFoldAnytime calculation:", {
        legalActions,
        hasFoldAction: legalActions?.some((a: any) => a.action === PlayerActionType.FOLD || a.action === "fold"),
        playerNotFolded: userPlayer?.status !== "folded",
        result: canFoldAnytime
    });

    // Only show other action buttons if it's the player's turn, they have legal actions,
    // the game is in progress, AND there's no big blind or small blind to post (prioritize blind posting)
    const showActionButtons = isPlayerTurn && hasLegalActions && gameInProgress;

    // Show blinds buttons when needed
    const showSmallBlindButton = shouldShowSmallBlindButton;
    const showBigBlindButton = shouldShowBigBlindButton;
    
    // Find the specific actions we need
    const smallBlindAction = legalActions?.find(action => action.action === "post-small-blind");
    const bigBlindAction = legalActions?.find(action => action.action === "post-big-blind");
    const foldAction = legalActions?.find(action => action.action === "fold");
    
    // Debug log to understand small blind button visibility
    console.log("Action Button Debug:", {
        legalActions,
        hasPostSmallBlindAction: !!smallBlindAction,
        hasPostBigBlindAction: !!bigBlindAction,
        hasFoldAction: !!foldAction,
        isPlayerTurn,
        showSmallBlindButton,
        showBigBlindButton,
        playerStatus
    });

    // Add this function to handle big blind posting
    const emergencyPostBigBlind = () => {
        // console.log("Emergency Big Blind function called");

        if (!tableData || !tableData.data) {
            console.error("No table data available");
            return;
        }

        const bigBlindAmount = tableData.data.bigBlind || "0";
        // console.log("Big blind amount:", bigBlindAmount);

        // Call the action handler directly
        handleSetPlayerAction(PlayerActionType.BIG_BLIND, bigBlindAmount);
    };

    // Add this at the top of your component
    useEffect(() => {
        // Create a global keyboard shortcut for posting big blind
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === "b" && shouldShowBigBlindButton) {
                console.log("Big blind keyboard shortcut triggered");

                if (!tableData || !tableData.data) {
                    console.error("No table data available");
                    return;
                }

                const bigBlindAmount = tableData.data.bigBlind || "0";
                // console.log("Big blind amount:", bigBlindAmount);

                // Call the action handler directly
                handleSetPlayerAction(PlayerActionType.BIG_BLIND, bigBlindAmount);
            }
        };

        window.addEventListener("keydown", handleKeyPress);

        return () => {
            window.removeEventListener("keydown", handleKeyPress);
        };
    }, [tableData, shouldShowBigBlindButton]);

    // Add a handler for the deal button
    const handleDeal = () => {
        console.log("Deal button clicked");
        if (dealTable) {
            dealTable();
        }
    };

    // Add useEffect to log the nonce information from our new hook
    useEffect(() => {
        console.log("🔢 Current nonce from hook:", nonce);
        console.log("💰 Account data from hook:", accountData);
    }, [nonce, accountData]);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#1e2a3a] via-[#2c3e50] to-[#1e2a3a] text-white p-4 pb-6 flex justify-center items-center border-t-2 border-[#3a546d] relative">
            {/* Animated light effects */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#64ffda] to-transparent opacity-70"></div>
                <div className="absolute top-[10%] left-[1%] w-[1px] h-[80%] bg-[#64ffda] opacity-20 animate-pulse"></div>
                <div className="absolute top-[10%] right-[1%] w-[1px] h-[80%] bg-[#64ffda] opacity-20 animate-pulse" style={{ animationDelay: "0.7s" }}></div>
            </div>

            <div className="flex flex-col w-[600px] space-y-3 justify-center rounded-lg relative z-10">
                {/* Deal Button - Show above other buttons when available */}
                {shouldShowDealButton && (
                    <div className="flex justify-center mb-3">
                        <button
                            onClick={handleDeal}
                            className="bg-gradient-to-r from-[#2c7873] to-[#1e5954] hover:from-[#1e5954] hover:to-[#0f2e2b] 
                            text-white font-bold py-3 px-8 rounded-lg shadow-lg 
                            border-2 border-[#3a9188] transition-all duration-300 
                            flex items-center justify-center gap-2 transform hover:scale-105"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            DEAL
                        </button>
                    </div>
                )}

                {/* Only show other buttons if deal button is not showing */}
                {!hideOtherButtons && (
                    <>
                        {/* Player Action Buttons Container */}
                        <div className="flex justify-center items-center gap-2">
                            {showSmallBlindButton && (playerStatus !== "folded") && (
                                <button
                                    onClick={handlePostSmallBlind}
                                    className="bg-gradient-to-r from-[#2c7873] to-[#1e5954] hover:from-[#1e5954] hover:to-[#0f2e2b] 
                                    text-white font-medium py-2 px-4 rounded-lg shadow-md transition-all duration-200 
                                    border border-[#3a9188] hover:border-[#64ffda] flex items-center transform hover:scale-105 mr-2"
                                >
                                    <span className="mr-1">Post Small Blind</span>
                                    <span className="bg-[#0f172a80] px-2 py-1 rounded text-[#64ffda] text-sm">
                                        ${Number(ethers.formatUnits(smallBlindAction?.min || "0", 18)).toFixed(2)}
                                    </span>
                                </button>
                            )}

                            {showBigBlindButton && (playerStatus !== "folded") && (
                                <button
                                    onClick={handlePostBigBlind}
                                    className="bg-gradient-to-r from-[#2c7873] to-[#1e5954] hover:from-[#1e5954] hover:to-[#0f2e2b] 
                                    text-white font-medium py-2 px-4 rounded-lg shadow-md transition-all duration-200 
                                    border border-[#3a9188] hover:border-[#64ffda] flex items-center transform hover:scale-105 mr-2"
                                >
                                    <span className="mr-1">Post Big Blind</span>
                                    <span className="bg-[#0f172a80] px-2 py-1 rounded text-[#64ffda] text-sm">
                                        ${Number(ethers.formatUnits(bigBlindAction?.min || "0", 18)).toFixed(2)}
                                    </span>
                                </button>
                            )}
                            {canFoldAnytime && (!showActionButtons || (showSmallBlindButton || showBigBlindButton)) && (
                                        <button
                                            className="cursor-pointer bg-gradient-to-r from-[#7f1d1d] to-[#991b1b] hover:from-[#991b1b] hover:to-[#b91c1c]
                    px-6 py-2 rounded-lg border border-[#7f1d1d] hover:border-[#ef4444] shadow-md
                    transition-all duration-200 font-medium transform hover:scale-105 min-w-[100px]"
                                            onClick={handleFold}
                                        >
                                            FOLD
                                        </button>
                                    )}
                                    {/* Show a message if the player has folded */}
                                    {userPlayer?.status === "folded" && (
                                        <div className="text-gray-400 py-2 px-4 bg-gray-800 bg-opacity-50 rounded-lg">You have folded this hand</div>
                                    )}
                        </div>

                        {/* Only show other action buttons if it's the player's turn, they have legal actions, and it's not time to post blinds */}
                        {showActionButtons && !showSmallBlindButton && !showBigBlindButton ? (
                            <>
                                <div className="flex justify-between gap-2">
                                    {canFoldAnytime && (
                                        <button
                                            className="cursor-pointer bg-gradient-to-r from-[#7f1d1d] to-[#991b1b] hover:from-[#991b1b] hover:to-[#b91c1c]
                    px-6 py-2 rounded-lg border border-[#7f1d1d] hover:border-[#ef4444] shadow-md
                    transition-all duration-200 font-medium transform hover:scale-105 min-w-[100px]"
                                            onClick={handleFold}
                                        >
                                            FOLD
                                        </button>
                                    )}
                                    {/* Show a message if the player has folded */}
                                    {userPlayer?.status === "folded" && (
                                        <div className="text-gray-400 py-2 px-4 bg-gray-800 bg-opacity-50 rounded-lg">You have folded this hand</div>
                                    )}

                                    {canCheck && (
                                        <button
                                            className="cursor-pointer bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] hover:from-[#1e40af] hover:to-[#2563eb]
                                            px-4 py-2 rounded-lg w-full border border-[#1e3a8a] hover:border-[#3b82f6] shadow-md
                                            transition-all duration-200 font-medium transform hover:scale-105"
                                            onClick={handleCheck}
                                        >
                                            CHECK
                                        </button>
                                    )}
                                    {canCall && (
                                        <button
                                            className="cursor-pointer bg-gradient-to-r from-[#065f46] to-[#047857] hover:from-[#047857] hover:to-[#059669]
                                            px-4 py-2 rounded-lg w-full border border-[#065f46] hover:border-[#10b981] shadow-md
                                            transition-all duration-200 font-medium transform hover:scale-105"
                                            onClick={handleCall}
                                        >
                                            CALL <span className="text-[#64ffda]">${callAmount.toFixed(2)}</span>
                                        </button>
                                    )}
                                    {(canRaise || canBet) && (
                                        <button
                                            onClick={submitBetOrRaise}
                                            disabled={isRaiseAmountInvalid || !isPlayerTurn}
                                            className={`${
                                                isRaiseAmountInvalid || !isPlayerTurn ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"
                                            } bg-gradient-to-r from-[#7e22ce] to-[#9333ea] hover:from-[#9333ea] hover:to-[#a855f7]
    px-4 py-2 rounded-lg w-full border border-[#7e22ce] hover:border-[#c084fc] shadow-md
    transition-all duration-200 font-medium`}
                                        >
                                            {canRaise ? "RAISE" : "BET"} <span className="text-[#64ffda]">${raiseAmount.toFixed(2)}</span>
                                        </button>
                                    )}
                                </div>

                                {/* Only show slider and betting options if player can bet or raise */}
                                {(canBet || canRaise) && (
                                    <>
                                        {/* Slider and Controls */}
                                        <div className="flex items-center space-x-4 bg-[#0f172a40] p-2 rounded-lg border border-[#3a546d]">
                                            <button
                                                className="bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#334155] hover:to-[#475569]
    py-1 px-4 rounded-lg border border-[#3a546d] hover:border-[#64ffda]
    transition-all duration-200"
                                                onClick={() => handleRaiseChange(Math.max(raiseAmount - 0.1, canBet ? minBet : minRaise))}
                                                disabled={!isPlayerTurn}
                                            >
                                                -
                                            </button>

                                            {/* Slider with dynamic fill */}
                                            <input
                                                type="range"
                                                min={canBet ? minBet : minRaise}
                                                max={canBet ? maxBet : maxRaise}
                                                step={0.01}
                                                value={raiseAmount}
                                                onChange={e => {
                                                    handleRaiseChange(Number(e.target.value));
                                                    setLastAmountSource("slider");
                                                }}
                                                className="flex-1 accent-[#64ffda] h-2 rounded-full transition-all duration-200"
                                                style={{
                                                    background: `linear-gradient(to right, #64ffda 0%, #64ffda ${
                                                        ((raiseAmount - (canBet ? minBet : minRaise)) /
                                                            ((canBet ? maxBet : maxRaise) - (canBet ? minBet : minRaise))) *
                                                        100
                                                    }%, #1e293b ${
                                                        ((raiseAmount - (canBet ? minBet : minRaise)) /
                                                            ((canBet ? maxBet : maxRaise) - (canBet ? minBet : minRaise))) *
                                                        100
                                                    }%, #1e293b 100%)`
                                                }}
                                                disabled={!isPlayerTurn}
                                            />
                                            <button
                                                className="bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#334155] hover:to-[#475569]
    py-1 px-4 rounded-lg border border-[#3a546d] hover:border-[#64ffda]
    transition-all duration-200"
                                                onClick={() => handleRaiseChange(Math.min(raiseAmount + 0.1, canBet ? maxBet : maxRaise))}
                                                disabled={!isPlayerTurn}
                                            >
                                                +
                                            </button>

                                            {/* Inline Input Box and Min/Max */}
                                            <div className="flex flex-col items-end gap-1 w-[120px]">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={raiseInputRaw}
                                                    onChange={e => {
                                                        const raw = e.target.value;

                                                        // Always allow clearing the field
                                                        if (raw === "") {
                                                            setRaiseInputRaw("");
                                                            setRaiseAmount(0);
                                                            return;
                                                        }

                                                        // Allow typing incomplete decimals like "2.", "2.0", or "2.08"
                                                        if (/^\d*\.?\d{0,2}$/.test(raw)) {
                                                            setRaiseInputRaw(raw);

                                                            // Only parse if it's a valid number (e.g. "2", "2.0", "2.08")
                                                            if (!isNaN(Number(raw)) && /^\d*\.?\d{1,2}$/.test(raw)) {
                                                                setRaiseAmount(parseFloat(raw));
                                                                setLastAmountSource("input");
                                                            }
                                                        }
                                                    }}
                                                    className={`px-2 py-1 rounded text-sm w-full bg-[#1e293b] transition-all duration-200 border ${
                                                        isRaiseAmountInvalid ? "border-red-500 text-red-400 focus:ring-red-500" : "border-[#3a546d] text-white"
                                                    }`}
                                                    disabled={!isPlayerTurn}
                                                />

                                                <div
                                                    className={`text-[10px] w-full text-right leading-snug ${
                                                        isRaiseAmountInvalid ? "text-red-400" : "text-gray-400"
                                                    }`}
                                                >
                                                    <div>Min: ${canBet ? minBet.toFixed(2) : minRaise.toFixed(2)}</div>
                                                    <div>Max: ${canBet ? maxBet.toFixed(2) : maxRaise.toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Additional Options */}
                                        <div className="flex justify-between gap-2 mb-1">
                                            <button
                                                className="bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#334155] hover:to-[#475569]
                                                px-2 py-1.5 rounded-lg w-full border border-[#3a546d] hover:border-[#64ffda] shadow-md
                                                transition-all duration-200 text-xs transform hover:scale-105"
                                                onClick={() => {
                                                    const newAmt = Math.max(totalPot / 4, canBet ? minBet : minRaise);
                                                    handleRaiseChange(newAmt);
                                                    setLastAmountSource("button");
                                                }}
                                                disabled={!isPlayerTurn}
                                            >
                                                1/4 Pot
                                            </button>
                                            <button
                                                className="bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#334155] hover:to-[#475569]
                                                px-2 py-1.5 rounded-lg w-full border border-[#3a546d] hover:border-[#64ffda] shadow-md
                                                transition-all duration-200 text-xs transform hover:scale-105"
                                                onClick={() => {
                                                    const newAmt = Math.max(totalPot / 2, canBet ? minBet : minRaise);
                                                    handleRaiseChange(newAmt);
                                                    setLastAmountSource("button");
                                                }}
                                                disabled={!isPlayerTurn}
                                            >
                                                1/2 Pot
                                            </button>
                                            <button
                                                className="bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#334155] hover:to-[#475569]
                                                px-2 py-1.5 rounded-lg w-full border border-[#3a546d] hover:border-[#64ffda] shadow-md
                                                transition-all duration-200 text-xs transform hover:scale-105"
                                                onClick={() => {
                                                    const newAmt = Math.max((totalPot * 3) / 4, canBet ? minBet : minRaise);
                                                    handleRaiseChange(newAmt);
                                                    setLastAmountSource("button");
                                                }}
                                                disabled={!isPlayerTurn}
                                            >
                                                3/4 Pot
                                            </button>
                                            <button
                                                className="bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#334155] hover:to-[#475569]
                                                px-2 py-1.5 rounded-lg w-full border border-[#3a546d] hover:border-[#64ffda] shadow-md
                                                transition-all duration-200 text-xs transform hover:scale-105"
                                                onClick={() => {
                                                    const newAmt = Math.max(totalPot, canBet ? minBet : minRaise);
                                                    handleRaiseChange(newAmt);
                                                    setLastAmountSource("button");
                                                }}
                                                disabled={!isPlayerTurn}
                                            >
                                                Pot
                                            </button>
                                            <button
                                                className="bg-gradient-to-r from-[#7e22ce] to-[#9333ea] hover:from-[#9333ea] hover:to-[#a855f7]
                                                px-2 py-1.5 rounded-lg w-full border border-[#7e22ce] hover:border-[#c084fc] shadow-md
                                                transition-all duration-200 text-xs font-medium transform hover:scale-105"
                                                onClick={() => {
                                                    const newAmt = canBet ? maxBet : maxRaise;
                                                    handleRaiseChange(newAmt);
                                                    setLastAmountSource("button");
                                                }}
                                                disabled={!isPlayerTurn}
                                            >
                                                ALL-IN
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
};

export default PokerActionPanel;

/*
 * ======================== MIGRATION SUMMARY ========================
 * We've successfully migrated these features from TableContext to custom hooks:
 * 
 * 1. playerLegalActions -> usePlayerLegalActions().legalActions
 * 2. isPlayerTurn -> usePlayerLegalActions().isPlayerTurn
 * 3. canDeal -> useDealTable().canDeal
 * 4. dealTable -> useDealTable().dealTable
 * 5. nonce -> useTableNonce().nonce
 * 6. refreshNonce -> useTableNonce().refreshNonce
 * 
 * All user actions now use their respective hooks:
 * - Check: useTableCheck().checkHand
 * - Fold: useTableFold().foldHand
 * - Post Small Blind: useTablePostSmallBlind().postSmallBlind
 * - Post Big Blind: useTablePostBigBlind().postBigBlind
 * - Raise/Bet: useTableRaise().raiseHand (still using handleSetPlayerAction for raising/betting)
 * 
 * TO DO:
 * - Complete the raise/bet action migration to use the hooks
 * - Refactor the UI code to work entirely with hooks
 * - Remove the TableContext dependency completely
 * - Potentially consolidate these hooks into a more organized structure
 */
