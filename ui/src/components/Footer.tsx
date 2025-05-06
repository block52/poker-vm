import { useEffect, useState } from "react";
import * as React from "react";
import { PlayerActionType, LegalActionDTO, NonPlayerActionType, PlayerDTO } from "@bitcoinbrisbane/block52";
import { PROXY_URL } from "../config/constants";
import { useTableState } from "../hooks/useTableState";
import { useParams } from "react-router-dom";
import { useTableNonce, AccountData } from "../hooks/useTableNonce";

// Import our custom hooks
import { usePlayerDTO } from "../hooks/usePlayerDTO";
import { usePlayerLegalActions } from "../hooks/playerActions/usePlayerLegalActions";
import { useTableDeal } from "../hooks/playerActions/useTableDeal";
import { useTableCheck } from "../hooks/playerActions/useTableCheck";
import { useTableFold } from "../hooks/playerActions/useTableFold";
import { useTableRaise } from "../hooks/playerActions/useTableRaise";
import { useTablePostSmallBlind } from "../hooks/playerActions/useTablePostSmallBlind";
import { useTablePostBigBlind } from "../hooks/playerActions/useTablePostBigBlind";
import { useNextToActInfo } from "../hooks/useNextToActInfo";
import { useTableCall } from "../hooks/playerActions/useTableCall";
import { useTableBet } from "../hooks/playerActions/useTableBet";
import { useTableMuck } from "../hooks/playerActions/useTableMuck";
import { useTableShow } from "../hooks/playerActions/useTableShow";
import { useStartNewHand } from "../hooks/playerActions/useStartNewHand";

import axios from "axios";

import { ethers } from "ethers";


const PokerActionPanel: React.FC = () => {
    const { id: tableId } = useParams<{ id: string }>();
    
    // Add the useStartNewHand hook
    const { startNewHand, isStartingNewHand } = useStartNewHand(tableId);
    
    // Get data from our custom hooks
    const { nonce, accountData, refreshNonce } = useTableNonce();
    const { players } = usePlayerDTO(tableId);
    const { legalActions, isPlayerTurn, playerStatus, playerSeat } = usePlayerLegalActions(tableId);
    const { dealCards, isDealing } = useTableDeal(tableId);
    const { checkHand } = useTableCheck(tableId);
    const { foldHand } = useTableFold(tableId);
    const { raiseHand } = useTableRaise(tableId);
    const { postSmallBlind } = useTablePostSmallBlind(tableId);
    const { postBigBlind } = useTablePostBigBlind(tableId);
    const { callHand } = useTableCall(tableId);
    const { betHand } = useTableBet(tableId);
    const { muckCards, isMucking } = useTableMuck(tableId);
    const { showCards, isShowing } = useTableShow(tableId);
    
    // Use the useNextToActInfo hook
    const { nextToActInfo, refresh: refreshNextToActInfo } = useNextToActInfo(tableId);
    
    // Add the useTableState hook to get table state properties
    const { 
        currentRound, 
        totalPot: tableTotalPot, 
        formattedTotalPot,
        tableType, 
        roundType,
    } = useTableState(tableId);

    // Log info from our hooks for debugging
    useEffect(() => {
        console.log("🎮 NextToActInfo:", nextToActInfo);
    }, [nextToActInfo]);
    
    const [publicKey, setPublicKey] = useState<string>();
    const [isCallAction, setIsCallAction] = useState(false);
    const [isCheckAction, setIsCheckAction] = useState(false);
    const [balance, setBalance] = useState(0);

    // Get user's address directly from localStorage
    const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
    
    // Determine if user is in the table using our hooks instead of accountUtils
    const isUserInTable = !!players?.some((player: PlayerDTO) => player.address?.toLowerCase() === userAddress);
    
    // Use nextToActInfo to determine if it's the user's turn
    const isUsersTurn = nextToActInfo?.isCurrentUserTurn || isPlayerTurn;
    
    // Replace userPlayer with direct checks from our hook data
    const userPlayer = players?.find((player: PlayerDTO) => player.address?.toLowerCase() === userAddress);
    
    // Check if fold action exists in legal actions
    const hasFoldAction = legalActions?.some((a: any) => a.action === "fold" || a.action === PlayerActionType.FOLD);

    // Check if current user has the deal action
    const currentUserCanDeal = userPlayer?.legalActions?.some((action: any) => action.action === "deal") || false;

    // Only show deal button if current user has the deal action
    const shouldShowDealButton = currentUserCanDeal;

    // New flag to determine whether to hide other action buttons when deal is available
    const hideOtherButtons = shouldShowDealButton;


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

    // Log if it's user's turn based on nextToActInfo
    useEffect(() => {
        if (nextToActInfo?.isCurrentUserTurn) {
            console.log("It's your turn to act based on nextToActInfo!");
        }
    }, [nextToActInfo]);

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
        //     nextToAct: nextToActInfo?.seat,
        //     userSeat: playerSeat
        // });
    }, [legalActions, isPlayerTurn, nextToActInfo, playerSeat]);

    const handleRaiseChange = (newAmount: number) => {
        setRaiseAmount(newAmount);
        setRaiseInputRaw(newAmount.toFixed(2));
    };

    // Player action function to handle all game actions
    const handleSetPlayerAction = async (action: PlayerActionType, amount: string) => {
        console.log("Setting player action:", action, amount);
        if (!userAddress || !tableId) {
            console.error("Missing user address or table ID", { userAddress, tableId });
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
            
            // Refresh the next-to-act info to reflect the new state
            refreshNextToActInfo?.();
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
        const publicKey = localStorage.getItem("user_eth_public_key");
        const privateKey = localStorage.getItem("user_eth_private_key");
        
        if (!publicKey || !privateKey || !callHand) {
            console.error("Wallet keys not available or hook not ready");
            return;
        }
        
        if (callAction) {
            // Use our hook to call with the correct amount
            callHand({
                userAddress: publicKey,
                privateKey,
                publicKey,
                actionIndex: callAction.index || 0,
                amount: callAction.min.toString(),
            });
        } else {
            console.error("Call action not available");
        }
    };

    const handleBet = () => {
        console.log("Betting");
        const publicKey = localStorage.getItem("user_eth_public_key");
        const privateKey = localStorage.getItem("user_eth_private_key");
        
        if (!publicKey || !privateKey || !betHand) {
            console.error("Wallet keys not available or hook not ready");
            return;
        }
        
        // Use our hook to bet with the current raiseAmount
        const amountWei = ethers.parseUnits(raiseAmount.toString(), 18).toString();
        
        betHand({
            userAddress: publicKey,
            privateKey,
            publicKey,
            actionIndex: betAction?.index || 0,
            amount: amountWei,
        });
    };

    const handleRaise = () => {
        console.log("Raising");
        const publicKey = localStorage.getItem("user_eth_public_key");
        const privateKey = localStorage.getItem("user_eth_private_key");
        
        if (!publicKey || !privateKey || !raiseHand) {
            console.error("Wallet keys not available or hook not ready");
            return;
        }
        
        // Use our hook to raise with the current raiseAmount
        const amountWei = ethers.parseUnits(raiseAmount.toString(), 18).toString();
        
        raiseHand({
            userAddress: publicKey,
            privateKey,
            publicKey,
            actionIndex: raiseAction?.index || 0,
            amount: amountWei,
        });
    };


    // Update to use our hook data for button visibility
    const shouldShowSmallBlindButton = legalActions?.some(action => action.action === "post-small-blind") && isUsersTurn;
    const shouldShowBigBlindButton = legalActions?.some(action => action.action === "post-big-blind") && isUsersTurn;
    
    // Find the specific actions we need
    const smallBlindAction = legalActions?.find(action => action.action === "post-small-blind");
    const bigBlindAction = legalActions?.find(action => action.action === "post-big-blind");
    const foldAction = legalActions?.find(action => action.action === "fold");
    
    // Debug log to understand action button visibility
    console.log("Action Button Debug:", {
        isUserInTable,
        nextToActSeat: nextToActInfo?.seat,
        userPlayerSeat: playerSeat,
        isUsersTurn,
        legalActions,
        hasPostSmallBlindAction: !!smallBlindAction,
        hasPostBigBlindAction: !!bigBlindAction,
        hasFoldAction: !!foldAction,
        playerStatus
    });
    
    // Only show action buttons if user is in the table
    const showButtons = isUserInTable;
    
    // Only show fold button if the player has the fold action and is in the table
    const canFoldAnytime = legalActions?.some((a: any) => a.action === PlayerActionType.FOLD || a.action === "fold") && playerStatus !== "folded" && showButtons;

    // Only show other action buttons if it's the player's turn, they have legal actions,
    // the game is in progress, AND there's no big blind or small blind to post (prioritize blind posting)
    const showActionButtons = isUsersTurn && legalActions && legalActions.length > 0 && showButtons;

    // Show blinds buttons when needed
    const showSmallBlindButton = shouldShowSmallBlindButton && showButtons;
    const showBigBlindButton = shouldShowBigBlindButton && showButtons;

    const activePlayers = players?.filter((p: any) => p.status !== "folded" && p.status !== "sitting-out");
    const activePlayerCount = activePlayers?.length || 0;
    const gameInProgress = activePlayerCount > 1;

   
    // Add a handler for the deal button
    const handleDeal = () => {
        console.log("Deal button clicked");
        
        // Get public and private keys
        const publicKey = localStorage.getItem("user_eth_public_key");
        const privateKey = localStorage.getItem("user_eth_private_key");
        
        if (!publicKey || !privateKey || !dealCards) {
            console.error("Wallet keys not available or hook not ready");
            return;
        }
        
        // Use the new hook to deal cards
        dealCards({
            userAddress: publicKey,
            privateKey,
            publicKey,
            actionIndex: legalActions?.find(a => a.action === "deal")?.index || 0,
        });
    };

    // Add useEffect to log the nonce information from our new hook
    useEffect(() => {
        console.log("🔢 Current nonce from hook:", nonce);
        console.log("💰 Account data from hook:", accountData);
    }, [nonce, accountData]);

    // Check if muck action exists in legal actions
    const hasMuckAction = legalActions?.some((a: any) => a.action === "muck" || a.action === PlayerActionType.MUCK);
    
    // Check if show action exists in legal actions
    const hasShowAction = legalActions?.some((a: any) => a.action === "show" || a.action === PlayerActionType.SHOW);

    // Handler for muck action
    const handleMuck = () => {
        console.log("Mucking cards");
        const publicKey = localStorage.getItem("user_eth_public_key");
        const privateKey = localStorage.getItem("user_eth_private_key");
        
        if (!publicKey || !privateKey || !muckCards) {
            console.error("Wallet keys not available or hook not ready");
            return;
        }
        
        // Use our hook to muck cards
        muckCards({
            userAddress: publicKey,
            privateKey,
            publicKey,
            actionIndex: legalActions?.find(a => a.action === PlayerActionType.MUCK || a.action === "muck")?.index || 0,
        });
    };
    
    // Handler for show action
    const handleShow = () => {
        console.log("Showing cards");
        const publicKey = localStorage.getItem("user_eth_public_key");
        const privateKey = localStorage.getItem("user_eth_private_key");
        
        if (!publicKey || !privateKey || !showCards) {
            console.error("Wallet keys not available or hook not ready");
            return;
        }
        
        // Use our hook to show cards
        showCards({
            userAddress: publicKey,
            privateKey,
            publicKey,
            actionIndex: legalActions?.find(a => a.action === PlayerActionType.SHOW || a.action === "show")?.index || 0,
        });
    };

    // Add the handleStartNewHand function after the other handler functions
    const handleStartNewHand = () => {
        console.log("Starting new hand");
        const publicKey = localStorage.getItem("user_eth_public_key");
        const privateKey = localStorage.getItem("user_eth_private_key");
        
        if (!publicKey || !privateKey || !startNewHand) {
            console.error("Wallet keys not available or hook not ready");
            return;
        }
        
        console.log(`Table ID for new hand: ${tableId}`);
        
        // Get current nonce from the hook
        console.log("Using nonce:", nonce);
        
        // Use our hook to start a new hand
        startNewHand({
            userAddress: publicKey,
            privateKey,
            publicKey,
            nonce: nonce || Date.now().toString(), // Use nonce from useTableNonce if available
            seed: Math.random().toString(36).substring(2, 15) // Generate a random seed
        })
        .then((result) => {
            console.log("New hand started successfully:", result);
            // Force refresh all game state
            refreshNonce?.();
            refreshNextToActInfo?.();
        })
        .catch(error => {
            console.error("Failed to start new hand:", error);
            alert("Failed to start new hand. Please try again.");
        });
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#1a2639] via-[#2a3f5f] to-[#1a2639] text-white p-4 pb-6 flex justify-center items-center border-t-2 border-[#3a546d] relative">
            {/* Animated light effects */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent opacity-70"></div>
                
                {/* Hexagon pattern overlay with reduced opacity */}
                <div className="absolute inset-0 opacity-5 hexagon-pattern"></div>
                
                {/* Blue shimmer effect */}
                <div className="absolute inset-0 opacity-20 shimmer-animation"
                    style={{
                        backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(59,130,246,0.1) 25%, rgba(0,0,0,0) 50%, rgba(59,130,246,0.1) 75%, rgba(0,0,0,0) 100%)",
                        backgroundSize: "200% 100%"
                    }}
                ></div>
                
                <div className="absolute top-[10%] left-[1%] w-[1px] h-[80%] bg-[#3b82f6] opacity-20 animate-pulse"></div>
                <div className="absolute top-[10%] right-[1%] w-[1px] h-[80%] bg-[#3b82f6] opacity-20 animate-pulse" style={{ animationDelay: "0.7s" }}></div>
            </div>

            <div className="flex flex-col w-[600px] space-y-3 justify-center rounded-lg relative z-10">
                {/* Deal Button - Show above other buttons when available */}
                {shouldShowDealButton && (
                    <div className="flex justify-center mb-3">
                        <button
                            onClick={handleDeal}
                            className="bg-gradient-to-r from-[#1e40af]/90 to-[#3b82f6]/90 hover:from-[#1e40af] hover:to-[#60a5fa] 
                            text-white font-bold py-3 px-8 rounded-lg shadow-md 
                            border border-[#3b82f6]/50 backdrop-blur-sm transition-all duration-300 
                            flex items-center justify-center gap-2 transform hover:scale-105 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                            disabled={isDealing}
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
                            {isDealing ? "DEALING..." : "DEAL"}
                        </button>
                    </div>
                )}

                {/* New Hand Button - Show when the round is "end" */}
                {currentRound === "end" && (
                    <div className="flex justify-center mb-3">
                        <button
                            onClick={handleStartNewHand}
                            className="bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:from-[#4f46e5] hover:to-[#4338ca] 
                            text-white font-bold py-3 px-8 rounded-lg shadow-lg 
                            border-2 border-[#818cf8] transition-all duration-300 
                            flex items-center justify-center gap-2 transform hover:scale-105"
                            disabled={isStartingNewHand}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            {isStartingNewHand ? "STARTING NEW HAND..." : "START NEW HAND"}
                        </button>
                    </div>
                )}

                {/* Muck Button - Show when action is available */}
                {hasMuckAction && (
                    <div className="flex justify-center mb-3">
                        <button
                            onClick={handleMuck}
                            className="bg-gradient-to-r from-[#4b5563] to-[#374151] hover:from-[#374151] hover:to-[#1f2937] 
                            text-white font-bold py-3 px-8 rounded-lg shadow-lg 
                            border-2 border-[#6b7280] transition-all duration-300 
                            flex items-center justify-center gap-2 transform hover:scale-105"
                            disabled={isMucking}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                            {isMucking ? "MUCKING..." : "MUCK CARDS"}
                        </button>
                    </div>
                )}
                
                {/* Show Button - Show when action is available */}
                {hasShowAction && (
                    <div className="flex justify-center mb-3">
                        <button
                            onClick={handleShow}
                            className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] hover:from-[#3b82f6] hover:to-[#60a5fa] 
                            text-white font-bold py-3 px-8 rounded-lg shadow-lg 
                            border-2 border-[#3b82f6] transition-all duration-300 
                            flex items-center justify-center gap-2 transform hover:scale-105"
                            disabled={isShowing}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                            </svg>
                            {isShowing ? "SHOWING..." : "SHOW CARDS"}
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
                                    <span className="bg-[#0f172a80] backdrop-blur-sm px-2 py-1 rounded text-[#60a5fa] text-sm border border-[#3a9188]/20">
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
                                    <span className="bg-[#0f172a80] px-2 py-1 rounded text-[#60a5fa] text-sm">
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
                                            className="cursor-pointer bg-gradient-to-r from-[#1e3a8a]/90 to-[#1e40af]/90 hover:from-[#1e40af] hover:to-[#2563eb]
                                            px-4 py-2 rounded-lg w-full border border-[#1e3a8a]/50 hover:border-[#3b82f6]/70 shadow-md backdrop-blur-sm
                                            transition-all duration-200 font-medium transform hover:scale-105 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                            onClick={handleCheck}
                                        >
                                            CHECK
                                        </button>
                                    )}
                                    {canCall && (
                                        <button
                                            className="cursor-pointer bg-gradient-to-r from-[#1e40af]/90 to-[#3b82f6]/90 hover:from-[#3b82f6] hover:to-[#60a5fa]
                                            px-4 py-2 rounded-lg w-full border border-[#1e40af]/50 hover:border-[#60a5fa]/70 shadow-md backdrop-blur-sm
                                            transition-all duration-200 font-medium transform hover:scale-105 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                            onClick={handleCall}
                                        >
                                            CALL <span className="text-[#93c5fd]">${callAmount.toFixed(2)}</span>
                                        </button>
                                    )}
                                    {(canRaise || canBet) && (
                                        <button
                                            onClick={canRaise ? handleRaise : handleBet}
                                            disabled={isRaiseAmountInvalid || !isPlayerTurn}
                                            className={`${
                                                isRaiseAmountInvalid || !isPlayerTurn ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"
                                            } bg-gradient-to-r from-[#7e22ce]/90 to-[#9333ea]/90 hover:from-[#9333ea] hover:to-[#a855f7]
    px-4 py-2 rounded-lg w-full border border-[#7e22ce]/50 hover:border-[#c084fc]/70 shadow-md backdrop-blur-sm
    transition-all duration-200 font-medium hover:shadow-[0_0_15px_rgba(192,132,252,0.2)]`}
                                        >
                                            {canRaise ? "RAISE" : "BET"} <span className="text-[#93c5fd]">${raiseAmount.toFixed(2)}</span>
                                        </button>
                                    )}
                                </div>

                                {/* Only show slider and betting options if player can bet or raise */}
                                {(canBet || canRaise) && (
                                    <>
                                        {/* Slider and Controls */}
                                        <div className="flex items-center space-x-4 bg-[#0f172a40] backdrop-blur-sm p-3 rounded-lg border border-[#3a546d]/50 shadow-inner">
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
 * 3. canDeal -> Now uses currentUserCanDeal (from legalActions)
 * 4. dealCards -> useTableDeal().dealCards (replaced dealTable)
 * 5. nonce -> useTableNonce().nonce
 * 6. refreshNonce -> useTableNonce().refreshNonce
 * 
 * All user actions now use their respective hooks:
 * - Check: useTableCheck().checkHand
 * - Fold: useTableFold().foldHand
 * - Post Small Blind: useTablePostSmallBlind().postSmallBlind
 * - Post Big Blind: useTablePostBigBlind().postBigBlind
 * - Call: useTableCall().callHand
 * - Bet: useTableBet().betHand
 * - Raise: useTableRaise().raiseHand
 * - Deal: useTableDeal().dealCards
 * 
 * TO DO:
 * - Remove the TableContext dependency completely
 * - Potentially consolidate these hooks into a more organized structure
 */
