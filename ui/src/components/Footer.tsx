import { useEffect, useState, useMemo, useCallback } from "react";
import * as React from "react";
import { NonPlayerActionType, PlayerActionType, PlayerDTO, PlayerStatus } from "@bitcoinbrisbane/block52";
import { useTableState } from "../hooks/useTableState";
import { useParams } from "react-router-dom";

// Import our custom hooks
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
import { useTableSitIn } from "../hooks/playerActions/useTableSitIn";
import { useTableSitOut } from "../hooks/playerActions/useTableSitOut";
import { DEFAULT_BIG_BLIND, useGameOptions } from "../hooks/useGameOptions";
import { useGameStateContext } from "../context/GameStateContext";

import { ethers } from "ethers";

const PokerActionPanel: React.FC = () => {
    const { id: tableId } = useParams<{ id: string }>();

    // Add the useStartNewHand hook
    const { startNewHand, isStartingNewHand } = useStartNewHand(tableId);

    // Get game state directly from Context - no additional WebSocket connections
    const { gameState } = useGameStateContext();
    const players = gameState?.players || null;
    const { legalActions, isPlayerTurn, playerStatus } = usePlayerLegalActions();
    const { gameOptions } = useGameOptions(tableId);
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
    const { seat: nextToActSeat, player: nextToActPlayer, isCurrentUserTurn, availableActions: nextToActAvailableActions, timeRemaining } = useNextToActInfo(tableId);

    // Add the useTableState hook to get table state properties
    const { currentRound, formattedTotalPot } = useTableState(tableId);

    const [publicKey, setPublicKey] = useState<string>();
    const [privateKey, setPrivateKey] = useState<string>();

    // Use useMemo for localStorage access
    const userAddress = useMemo(() => localStorage.getItem("user_eth_public_key")?.toLowerCase(), []);

    // Determine if user is in the table using our hooks instead of accountUtils
    const isUserInTable = useMemo(() => !!players?.some((player: PlayerDTO) => player.address?.toLowerCase() === userAddress), [players, userAddress]);

    // Use nextToActInfo to determine if it's the user's turn
    const isUsersTurn = isCurrentUserTurn || isPlayerTurn;

    // Replace userPlayer with direct checks from our hook data
    const userPlayer = players?.find((player: PlayerDTO) => player.address?.toLowerCase() === userAddress);

    // Helper function to check if an action exists in legal actions (handles both string and enum types)
    const hasAction = (actionType: string | PlayerActionType | NonPlayerActionType) => {
        return legalActions?.some(action => action.action === actionType || action.action?.toString() === actionType?.toString());
    };

    // Check if actions are available using the helper function
    const hasDealAction = hasAction(NonPlayerActionType.DEAL);
    const hasSmallBlindAction = hasAction(PlayerActionType.SMALL_BLIND);
    const hasBigBlindAction = hasAction(PlayerActionType.BIG_BLIND);
    const hasFoldAction = hasAction(PlayerActionType.FOLD);
    const hasCheckAction = hasAction(PlayerActionType.CHECK);
    const hasCallAction = hasAction(PlayerActionType.CALL);
    const hasBetAction = hasAction(PlayerActionType.BET);
    const hasRaiseAction = hasAction(PlayerActionType.RAISE);
    const hasMuckAction = hasAction(PlayerActionType.MUCK);
    const hasShowAction = hasAction(PlayerActionType.SHOW);

    // Only show deal button if player has the deal action
    const shouldShowDealButton = hasDealAction;

    // New flag to determine whether to hide other action buttons when deal is available
    const hideOtherButtons = shouldShowDealButton;

    // Find the specific actions
    const getActionByType = (actionType: string | PlayerActionType | NonPlayerActionType) => {
        return legalActions?.find(action => action.action === actionType || action.action?.toString() === actionType?.toString());
    };

    const smallBlindAction = getActionByType(PlayerActionType.SMALL_BLIND);
    const bigBlindAction = getActionByType(PlayerActionType.BIG_BLIND);
    const callAction = getActionByType(PlayerActionType.CALL);
    const betAction = getActionByType(PlayerActionType.BET);
    const raiseAction = getActionByType(PlayerActionType.RAISE);

    // Convert values to USDC for faster display
    const minBet = useMemo(() => (betAction ? Number(ethers.formatUnits(betAction.min || "0", 18)) : 0), [betAction]);
    const maxBet = useMemo(() => (betAction ? Number(ethers.formatUnits(betAction.max || "0", 18)) : 0), [betAction]);
    const minRaise = useMemo(() => (raiseAction ? Number(ethers.formatUnits(raiseAction.min || "0", 18)) : 0), [raiseAction]);
    const maxRaise = useMemo(() => (raiseAction ? Number(ethers.formatUnits(raiseAction.max || "0", 18)) : 0), [raiseAction]);
    const callAmount = useMemo(() => (callAction ? Number(ethers.formatUnits(callAction.min || "0", 18)) : 0), [callAction]);

    // Big Blind Value
    const bigBlindStep = useMemo(() => {
        const step = Number(ethers.formatUnits(gameOptions.bigBlind ?? BigInt(DEFAULT_BIG_BLIND), 18));
        return step;
    }, [gameOptions.bigBlind]);

    // Slider Input State
    const [raiseAmount, setRaiseAmount] = useState<number>(minRaise);
    const [raiseInputRaw, setRaiseInputRaw] = useState<string>(minRaise.toFixed(2)); // or minBet
    const [, setLastAmountSource] = useState<"slider" | "input" | "button">("slider");

    const isRaiseAmountInvalid = hasRaiseAction
        ? raiseAmount < minRaise || raiseAmount > maxRaise
        : hasBetAction
        ? raiseAmount < minBet || raiseAmount > maxBet
        : false;

    // Get total pot for percentage calculations
    const totalPot = Number(formattedTotalPot) || 0;

    // Add the useTableSitIn and useTableSitOut hooks
    const { sitIn, isLoading: isSittingIn } = useTableSitIn(tableId);
    const { sitOut, isLoading: isSittingOut } = useTableSitOut(tableId);

    useEffect(() => {
        const localKey = localStorage.getItem("user_eth_public_key");
        if (!localKey) return setPublicKey(undefined);

        setPublicKey(localKey);
    }, [publicKey]);

    useEffect(() => {
        const localKey = localStorage.getItem("user_eth_private_key");
        if (!localKey) return setPrivateKey(undefined);

        setPrivateKey(localKey);
    }, [privateKey]);

    const handleRaiseChange = (newAmount: number) => {
        setRaiseAmount(newAmount);
        setRaiseInputRaw(newAmount.toFixed(2));
    };

    // Min Raise Text Prefill
    useEffect(() => {
        if (hasRaiseAction && minRaise > 0) {
            setRaiseAmount(minRaise);
            setRaiseInputRaw(minRaise.toFixed(2));
        } else if (hasBetAction && minBet > 0) {
            setRaiseAmount(minBet);
            setRaiseInputRaw(minBet.toFixed(2));
        }
    }, [hasRaiseAction, hasBetAction, minRaise, minBet]);

    // Handler functions for different actions - Now use our custom hooks
    const handlePostSmallBlind = useCallback(() => {
        if (!postSmallBlind) {
            console.error("Hook not ready");
            return;
        }
        // Use our hook to post small blind
        postSmallBlind({});
    }, [postSmallBlind]);

    const handlePostBigBlind = useCallback(() => {
        if (!postBigBlind) {
            console.error("Hook not ready");
            return;
        }

        // Use our hook to post big blind
        postBigBlind({});
    }, [postBigBlind]);

    const handleCheck = useCallback(() => {
        if (!checkHand) {
            console.error("Hook not ready");
            return;
        }

        // Use our hook to check
        checkHand({
            amount: "0" // Check doesn't require an amount
        });
    }, [checkHand]);

    const handleFold = useCallback(() => {
        if (!foldHand) {
            console.error("Hook not ready");
            return;
        }

        // Use our hook to fold
        foldHand();
    }, [foldHand]);

    const handleCall = useCallback(() => {
        if (!privateKey || !callHand) {
            console.error("Private key not available or hook not ready");
            return;
        }

        if (callAction) {
            // Use our hook to call with the correct amount
            callHand({
                amount: "0" // callAction.min.toString() // Call doesn't require an amount, the PVM should handle it
            });
        } else {
            console.error("Call action not available");
        }
    }, [privateKey, callHand, callAction]);

    const handleBet = useCallback(() => {
        if (!betHand) {
            console.error("Hook not ready");
            return;
        }

        // Use our hook to bet with the current raiseAmount
        const amountWei = ethers.parseUnits(raiseAmount.toString(), 18).toString();

        betHand({
            amount: amountWei
        });
    }, [betHand, raiseAmount]);

    const handleRaise = useCallback(() => {
        if (!raiseHand) {
            console.error("Private key not available or hook not ready");
            return;
        }

        // Use our hook to raise with the current raiseAmount
        const amountWei = ethers.parseUnits(raiseAmount.toString(), 18).toString();

        raiseHand({
            amount: amountWei
        });
    }, [raiseHand, raiseAmount]);

    // Update to use our hook data for button visibility
    const shouldShowSmallBlindButton = hasSmallBlindAction && isUsersTurn;
    const shouldShowBigBlindButton = hasBigBlindAction && isUsersTurn;

    // Only show action buttons if user is in the table
    const showButtons = isUserInTable;

    // Only show fold button if the player has the fold action and is in the table
    const canFoldAnytime = useMemo(() => hasFoldAction && playerStatus !== PlayerStatus.FOLDED && showButtons, [hasFoldAction, playerStatus, showButtons]);

    // Only show other action buttons if it's the player's turn, they have legal actions,
    // the game is in progress, AND there's no big blind or small blind to post (prioritize blind posting)
    const showActionButtons = isUsersTurn && legalActions && legalActions.length > 0 && showButtons;

    // Show blinds buttons when needed
    const showSmallBlindButton = shouldShowSmallBlindButton && showButtons;
    const showBigBlindButton = shouldShowBigBlindButton && showButtons;

    // Add a handler for the deal button
    const handleDeal = () => {
        // Get private key
        if (!dealCards) {
            console.error("Private key not available or hook not ready");
            return;
        }

        // Use the hook to deal cards
        dealCards();
    };

    // Handler for muck action
    const handleMuck = () => {
        if (!muckCards || !privateKey) {
            console.error("Hook not ready or private key not available");
            return;
        }

        // Use our hook to muck cards
        muckCards({
            privateKey,
            actionIndex: getActionByType(PlayerActionType.MUCK)?.index || getActionByType("muck")?.index || 0
        });
    };

    // Handler for show action
    const handleShow = () => {
        if (!showCards || !privateKey) {
            console.error("Hook not ready or private key not available");
            return;
        }

        // Use our hook to show cards
        showCards({
            privateKey,
            actionIndex: getActionByType(PlayerActionType.SHOW)?.index || getActionByType("show")?.index || 0
        });
    };

    // Add the handleStartNewHand function after the other handler functions
    const handleStartNewHand = () => {
        if (!privateKey || !startNewHand) {
            console.error("Private key not available or hook not ready");
            return;
        }

        // Use our hook to start a new hand
        startNewHand({
            seed: Math.random().toString(36).substring(2, 15) // Generate a random seed
        })
            .then(result => {
                console.log("New hand started successfully:", result);
            })
            .catch(error => {
                console.error("Failed to start new hand:", error);
                alert("Failed to start new hand. Please try again.");
            });
    };

    // Add handler functions for sit-in and sit-out actions
    const handleSitIn = useCallback(() => {
        if (!sitIn) {
            console.error("Hook not ready");
            return;
        }

        sitIn()
            .then(() => {
                console.log("Successfully sat in");
            })
            .catch(error => {
                console.error("Failed to sit in:", error);
            });
    }, [sitIn]);

    const handleSitOut = useCallback(() => {
        if (!sitOut) {
            console.error("Hook not ready");
            return;
        }

        sitOut()
            .then(() => {
                console.log("Successfully sat out");
            })
            .catch(error => {
                console.error("Failed to sit out:", error);
            });
    }, [sitOut]);

    // Check if player is sitting out
    const isPlayerSittingOut = useMemo(() => userPlayer?.status === PlayerStatus.SITTING_OUT, [userPlayer]);

    return (
        <div className="fixed bottom-20 left-0 right-0 text-white p-4 pb-6 flex justify-center items-center relative">
            <div className="flex flex-col w-[850px] space-y-3 justify-center rounded-lg relative z-10">
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
                            {showSmallBlindButton && playerStatus !== "folded" && (
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

                            {showBigBlindButton && playerStatus !== "folded" && (
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
                            {canFoldAnytime && (!showActionButtons || showSmallBlindButton || showBigBlindButton) && (
                                <button
                                    className="cursor-pointer bg-gradient-to-r from-[#1e293b] to-[#334155]
hover:from-[#991b1b] hover:to-[#b91c1c]
active:bg-white/10 active:scale-105
px-6 py-2 rounded-lg border border-[#3a546d]
hover:border-[#ef4444] hover:shadow-[0_0_10px_rgba(239,68,68,0.4)]
transition-all duration-200 font-medium min-w-[100px]"
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
                                            className="cursor-pointer bg-gradient-to-r from-[#1e293b] to-[#334155]
hover:from-[#991b1b] hover:to-[#b91c1c]
active:bg-white/10 active:scale-105
px-6 py-2 rounded-lg border border-[#3a546d]
hover:border-[#ef4444] hover:shadow-[0_0_10px_rgba(239,68,68,0.4)]
transition-all duration-200 font-medium min-w-[100px]"
                                            onClick={handleFold}
                                        >
                                            FOLD
                                        </button>
                                    )}
                                    {/* Show a message if the player has folded */}
                                    {userPlayer?.status === "folded" && (
                                        <div className="text-gray-400 py-2 px-4 bg-gray-800 bg-opacity-50 rounded-lg">You have folded this hand</div>
                                    )}

                                    {hasCheckAction && (
                                        <button
                                            className="cursor-pointer bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#1e3a8a]/90 hover:to-[#1e40af]/90 active:from-[#1e40af] active:to-[#2563eb]
                                            px-4 py-2 rounded-lg w-full border border-[#3a546d] hover:border-[#1e3a8a]/50 active:border-[#3b82f6]/70 shadow-md backdrop-blur-sm
                                            transition-all duration-200 font-medium transform active:scale-105 active:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                            onClick={handleCheck}
                                        >
                                            CHECK
                                        </button>
                                    )}
                                    {hasCallAction && (
                                        <button
                                            className="cursor-pointer bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#1e40af]/90 hover:to-[#3b82f6]/90 active:from-[#3b82f6] active:to-[#60a5fa]
                                            px-4 py-2 rounded-lg w-full border border-[#3a546d] hover:border-[#1e40af]/50 active:border-[#60a5fa]/70 shadow-md backdrop-blur-sm
                                            transition-all duration-200 font-medium transform active:scale-105 active:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                            onClick={handleCall}
                                        >
                                            CALL <span className="text-[#ffffff]">${callAmount.toFixed(2)}</span>
                                        </button>
                                    )}
                                    {(hasRaiseAction || hasBetAction) && (
                                        <button
                                            onClick={hasRaiseAction ? handleRaise : handleBet}
                                            disabled={isRaiseAmountInvalid || !isPlayerTurn}
                                            className={`${
                                                isRaiseAmountInvalid || !isPlayerTurn ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"
                                            } bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#7e22ce]/90 hover:to-[#9333ea]/90 active:from-[#9333ea] active:to-[#a855f7]
    px-4 py-2 rounded-lg w-full border border-[#3a546d] active:border-[#7e22ce]/50 active:border-[#c084fc]/70 shadow-md backdrop-blur-sm
    transition-all duration-200 font-medium active:shadow-[0_0_15px_rgba(192,132,252,0.2)]`}
                                        >
                                            {hasRaiseAction ? "RAISE" : "BET"} <span className="text-[#ffffff]">${raiseAmount.toFixed(2)}</span>
                                        </button>
                                    )}
                                </div>

                                {/* Only show slider and betting options if player can bet or raise */}
                                {(hasBetAction || hasRaiseAction) && (
                                    <>
                                        {/* Slider and Controls */}
                                        <div className="flex items-center space-x-4 bg-[#0f172a40] backdrop-blur-sm p-3 rounded-lg border border-[#3a546d]/50 shadow-inner">
                                            <button
                                                className="bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#334155] hover:to-[#475569]
    py-1 px-4 rounded-lg border border-[#3a546d] hover:border-[#64ffda]
    transition-all duration-200"
                                                onClick={() => handleRaiseChange(Math.max(raiseAmount - bigBlindStep, hasBetAction ? minBet : minRaise))}
                                                disabled={!isPlayerTurn}
                                            >
                                                -
                                            </button>

                                            {/* Slider with dynamic fill */}
                                            <input
                                                type="range"
                                                min={hasBetAction ? minBet : minRaise}
                                                max={hasBetAction ? maxBet : maxRaise}
                                                step={0.01}
                                                value={raiseAmount}
                                                onChange={e => {
                                                    handleRaiseChange(Number(e.target.value));
                                                    setLastAmountSource("slider");
                                                }}
                                                className="flex-1 accent-[#64ffda] h-2 rounded-full transition-all duration-200"
                                                style={{
                                                    background: `linear-gradient(to right, #64ffda 0%, #64ffda ${
                                                        ((raiseAmount - (hasBetAction ? minBet : minRaise)) /
                                                            ((hasBetAction ? maxBet : maxRaise) - (hasBetAction ? minBet : minRaise))) *
                                                        100
                                                    }%, #1e293b ${
                                                        ((raiseAmount - (hasBetAction ? minBet : minRaise)) /
                                                            ((hasBetAction ? maxBet : maxRaise) - (hasBetAction ? minBet : minRaise))) *
                                                        100
                                                    }%, #1e293b 100%)`
                                                }}
                                                disabled={!isPlayerTurn}
                                            />
                                            <button
                                                className="bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#334155] hover:to-[#475569]
    py-1 px-4 rounded-lg border border-[#3a546d] hover:border-[#64ffda]
    transition-all duration-200"
                                                onClick={() => handleRaiseChange(Math.min(raiseAmount + bigBlindStep, hasBetAction ? maxBet : maxRaise))}
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
                                                    <div>Min: ${hasBetAction ? minBet.toFixed(2) : minRaise.toFixed(2)}</div>
                                                    <div>Max: ${hasBetAction ? maxBet.toFixed(2) : maxRaise.toFixed(2)}</div>
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
                                                    const newAmt = Math.max(totalPot / 4, hasBetAction ? minBet : minRaise);
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
                                                    const newAmt = Math.max(totalPot / 2, hasBetAction ? minBet : minRaise);
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
                                                    const newAmt = Math.max((totalPot * 3) / 4, hasBetAction ? minBet : minRaise);
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
                                                    const newAmt = Math.max(totalPot, hasBetAction ? minBet : minRaise);
                                                    handleRaiseChange(newAmt);
                                                    setLastAmountSource("button");
                                                }}
                                                disabled={!isPlayerTurn}
                                            >
                                                Pot
                                            </button>
                                            <button
                                                className="bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#7e22ce] hover:to-[#9333ea] active:from-[#9333ea] active:to-[#a855f7]
                                                px-2 py-1.5 rounded-lg w-full border border-[#3a546d] hover:border-[#7e22ce] active:border-[#c084fc] shadow-md
                                                transition-all duration-200 text-xs font-medium transform active:scale-105"
                                                onClick={() => {
                                                    const newAmt = hasBetAction ? maxBet : maxRaise;
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

                {/* Sit In / Sit Out Buttons - Bottom Right Area */}
                {isUserInTable && (
                    <div className="fixed bottom-4 right-4 flex gap-2 z-30">
                        {isPlayerSittingOut ? (
                            <button
                                onClick={handleSitIn}
                                className="bg-gradient-to-r from-[#2c7873] to-[#1e5954] hover:from-[#1e5954] hover:to-[#0f2e2b] 
                                text-white font-medium py-2 px-6 rounded-lg shadow-lg transition-all duration-200 
                                border border-[#3a9188] hover:border-[#64ffda] flex items-center text-sm transform hover:scale-105"
                                disabled={isSittingIn}
                            >
                                {isSittingIn ? "SITTING IN..." : "I AM BACK"}
                            </button>
                        ) : (
                            <button
                                onClick={handleSitOut}
                                className="bg-gradient-to-r from-[#4b5563] to-[#374151] hover:from-[#374151] hover:to-[#1f2937] 
                                text-white font-medium py-2 px-6 rounded-lg shadow-lg transition-all duration-200 
                                border border-[#6b7280] hover:border-[#9ca3af] flex items-center text-sm transform hover:scale-105"
                                disabled={isSittingOut}
                            >
                                {isSittingOut ? "SITTING OUT..." : "SIT OUT"}
                            </button>
                        )}
                    </div>
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
