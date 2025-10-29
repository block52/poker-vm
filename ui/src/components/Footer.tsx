import React, { useEffect, useState, useMemo } from "react";
import { NonPlayerActionType, PlayerActionType, PlayerDTO, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { useParams } from "react-router-dom";
import { colors } from "../utils/colorConfig";
import { ethers } from "ethers";
import { calculatePotBetAmount } from "../utils/calculatePotBetAmount";

// Import hooks from barrel file
import { useTableState, useNextToActInfo, useGameOptions, betHand, postBigBlind, postSmallBlind, raiseHand } from "../hooks";

// Import specific hooks not in barrel
import { usePlayerLegalActions } from "../hooks/playerActions/usePlayerLegalActions";
import { useGameStateContext } from "../context/GameStateContext";

// Import action handlers (removing unused ones)
import { handleCall, handleCheck, handleDeal, handleFold, handleMuck, handleShow, handleStartNewHand } from "./common/actionHandlers";
import { getActionByType, hasAction } from "../utils/actionUtils";
import { getRaiseToAmount } from "../utils/raiseUtils";
import "./Footer.css";
import { convertAmountToBigInt, formatWeiToDollars } from "../utils/numberUtils";

const PokerActionPanel: React.FC = React.memo(() => {
    const { id: tableId } = useParams<{ id: string }>();

    // Detect mobile landscape orientation
    const [isMobileLandscape, setIsMobileLandscape] = useState(window.innerWidth <= 926 && window.innerWidth > window.innerHeight);

    useEffect(() => {
        const checkOrientation = () => {
            setIsMobileLandscape(window.innerWidth <= 926 && window.innerWidth > window.innerHeight);
        };

        window.addEventListener("resize", checkOrientation);
        window.addEventListener("orientationchange", checkOrientation);

        return () => {
            window.removeEventListener("resize", checkOrientation);
            window.removeEventListener("orientationchange", checkOrientation);
        };
    }, []);

    // Get game state directly from Context - no additional WebSocket connections
    const { gameState } = useGameStateContext();
    const players = gameState?.players || null;
    const { legalActions, isPlayerTurn, playerStatus } = usePlayerLegalActions();
    const { gameOptions } = useGameOptions();

    // Use the useNextToActInfo hook
    const { isCurrentUserTurn } = useNextToActInfo(tableId);

    // Add the useTableState hook to get table state properties
    const { pot } = useTableState();

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

    // Check if actions are available using the helper function
    const hasSmallBlindAction = hasAction(legalActions, PlayerActionType.SMALL_BLIND);
    const hasBigBlindAction = hasAction(legalActions, PlayerActionType.BIG_BLIND);
    const hasFoldAction = hasAction(legalActions, PlayerActionType.FOLD);
    const hasCheckAction = hasAction(legalActions, PlayerActionType.CHECK);
    const hasCallAction = hasAction(legalActions, PlayerActionType.CALL);
    const hasBetAction = hasAction(legalActions, PlayerActionType.BET);
    const hasRaiseAction = hasAction(legalActions, PlayerActionType.RAISE);
    const hasMuckAction = hasAction(legalActions, PlayerActionType.MUCK);
    const hasShowAction = hasAction(legalActions, PlayerActionType.SHOW);
    const hasDealAction = hasAction(legalActions, NonPlayerActionType.DEAL);

    // Show deal button if player has the deal action
    const shouldShowDealButton = hasDealAction && isUsersTurn;

    // Hide other buttons when deal is available since dealing should be prioritized
    const hideOtherButtons = shouldShowDealButton;

    const smallBlindAction = getActionByType(legalActions, PlayerActionType.SMALL_BLIND);
    const bigBlindAction = getActionByType(legalActions, PlayerActionType.BIG_BLIND);
    const callAction = getActionByType(legalActions, PlayerActionType.CALL);
    const betAction = getActionByType(legalActions, PlayerActionType.BET);
    const raiseAction = getActionByType(legalActions, PlayerActionType.RAISE);

    // Convert values to USDC for faster display
    // const minBet = useMemo(() => (betAction ? Number(ethers.formatUnits(betAction.min || "0", 18)) : 0), [betAction]);
    // const maxBet = useMemo(() => (betAction ? Number(ethers.formatUnits(betAction.max || "0", 18)) : 0), [betAction]);
    // const minRaise = useMemo(() => (raiseAction ? Number(ethers.formatUnits(raiseAction.min || "0", 18)) : 0), [raiseAction]);
    // const maxRaise = useMemo(() => (raiseAction ? Number(ethers.formatUnits(raiseAction.max || "0", 18)) : 0), [raiseAction]);
    // const callAmount = useMemo(() => (callAction ? Number(ethers.formatUnits(callAction.min || "0", 18)) : 0), [callAction]);

    // // Do as bigint
    const minBet = useMemo(() => (betAction ? BigInt(ethers.formatUnits(betAction.min || "0", 18)) : 0n), [betAction]);
    const maxBet = useMemo(() => (betAction ? BigInt(ethers.formatUnits(betAction.max || "0", 18)) : 0n), [betAction]);
    const minRaise = useMemo(() => (raiseAction ? BigInt(ethers.formatUnits(raiseAction.min || "0", 18)) : 0n), [raiseAction]);
    const maxRaise = useMemo(() => (raiseAction ? BigInt(ethers.formatUnits(raiseAction.max || "0", 18)) : 0n), [raiseAction]);
    const callAmount = useMemo(() => (callAction ? BigInt(ethers.formatUnits(callAction.min || "0", 18)) : 0n), [callAction]);

    const getStep = (): number => {
        const step = hasBetAction ? minBet : hasRaiseAction ? minRaise : 0n;
        return Number(step);
    };

    // const getStep = (): bigint => {
    //     return hasBetAction ? bigintMinBet : hasRaiseAction ? bigintMinRaise : 0n;
    // };

    // These are the default amounts - initialize with proper minimum
    const initialAmount: bigint = hasBetAction ? (minBet > 0n ? minBet : 0n) : minRaise > 0n ? minRaise : 0n;
    const [raiseAmount, setRaiseAmount] = useState<number>(Number(initialAmount));
    // const [, setRaiseInputRaw] = useState<string>(Number(initialAmount).toFixed(2));
    // const [, setLastAmountSource] = useState<"slider" | "input" | "button">("slider");

    // Handle raise amount changes from slider or input
    // const raiseActionAmount = getRaiseToAmount(minRaise, gameState?.previousActions || [], gameState?.round ?? TexasHoldemRound.ANTE, userAddress || "");

    const isRaiseAmountInvalid: boolean = hasRaiseAction
        ? raiseAmount < minRaise || raiseAmount > maxRaise
        : hasBetAction
        ? raiseAmount < minBet || raiseAmount > maxBet
        : false;

    // Get total pot for percentage calculations
    const totalPot = Number(pot) || 0;

    // Dynamic class names based on validation state
    const inputFieldClassName = useMemo(() => `input-field ${isRaiseAmountInvalid ? "invalid" : ""}`, [isRaiseAmountInvalid]);
    const minMaxTextClassName = useMemo(() => `min-max-text ${isRaiseAmountInvalid ? "invalid" : ""}`, [isRaiseAmountInvalid]);

    // Memoize expensive computations
    // const formattedSmallBlindAmount: string = useMemo(() => Number(ethers.formatUnits(smallBlindAction?.min || "0", 18)).toFixed(2), [smallBlindAction?.min]);
    // const formattedBigBlindAmount: string = useMemo(() => Number(ethers.formatUnits(bigBlindAction?.min || "0", 18)).toFixed(2), [bigBlindAction?.min]);
    // const formattedCallAmount: string = useMemo(() => callAmount.toFixed(2), [callAmount]);
    // const formattedMaxBetAmount: string = useMemo(() => (hasBetAction ? maxBet.toFixed(2) : maxRaise.toFixed(2)), [hasBetAction, maxBet, maxRaise]);

    const formattedSmallBlindAmount: string = useMemo(() => formatWeiToDollars(smallBlindAction?.min), [smallBlindAction?.min]);
    const formattedBigBlindAmount: string = useMemo(() => formatWeiToDollars(bigBlindAction?.min), [bigBlindAction?.min]);
    const formattedCallAmount: string = useMemo(() => formatWeiToDollars(callAmount), [callAmount]);
    const formattedRaiseAmount: string = useMemo(() => formatWeiToDollars(raiseAmount.toString()), [raiseAmount]);

    // const formattedMinBetAmount: string = useMemo(() => formatWeiToDollars(minBet), [minBet]);
    const formattedMaxBetAmount: string = useMemo(
        () => (hasBetAction ? formatWeiToDollars(maxBet) : formatWeiToDollars(maxRaise)),
        [hasBetAction, maxBet, maxRaise]
    );

    // Remove hover event handlers since we're using CSS hover states

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

    // Handlers for adjusting raise amount on the slider or buttons
    const handleRaiseChange = (delta: number): void => {
        const currentRaiseAmount = BigInt(raiseAmount) || minRaise;
        let newRaiseAmount = currentRaiseAmount + BigInt(delta);

        if (newRaiseAmount < minRaise) {
            newRaiseAmount = minRaise;
        }

        if (newRaiseAmount > maxRaise) {
            newRaiseAmount = maxRaise;
        }

        setRaiseAmount(Number(newRaiseAmount));
    };

    const setRaiseAmountAbsolute = (amount: number): void => {
        setRaiseAmount(amount);
    };

    // Min Raise Text Prefill - Always set to minimum when actions become available
    useEffect(() => {
        if (hasRaiseAction && minRaise > 0n) {
            setRaiseAmount(Number(minRaise));
            // setRaiseInputRaw(minRaise.toFixed(2));
        } else if (hasBetAction && minBet > 0n) {
            setRaiseAmount(Number(minBet));
            // setRaiseInputRaw(minBet.toFixed(2));
        }
    }, [hasRaiseAction, hasBetAction, minRaise, minBet]);

    // Handler functions for different actions - simplified
    const handlePostSmallBlind = async () => {
        if (!tableId) return;

        const smallBlindAmount = smallBlindAction?.min || gameOptions?.smallBlind;
        if (!smallBlindAmount) return;

        await postSmallBlind(tableId, smallBlindAmount);
    };

    const handlePostBigBlind = async () => {
        if (!tableId) return;

        const bigBlindAmount = bigBlindAction?.min || gameOptions?.bigBlind;
        if (!bigBlindAmount) return;

        await postBigBlind(tableId, bigBlindAmount);
    };

    const handleBet = async () => {
        if (!tableId) return;

        const amountWei: bigint = convertAmountToBigInt(raiseAmount);

        try {
            await betHand(tableId, amountWei);
        } catch (error: any) {
            console.error("Failed to bet:", error);
        }
    };

    const handleRaise = async () => {
        if (!tableId) return;

        const amountWei: bigint = convertAmountToBigInt(raiseAmount);

        try {
            await raiseHand(tableId, amountWei);
        } catch (error: any) {
            console.error("Failed to raise:", error);
        }
    };

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

    return (
        <div
            className={`fixed left-0 right-0 text-white flex justify-center items-center relative ${
                isMobileLandscape ? "bottom-0 p-0.5" : "bottom-12 lg:bottom-1 p-2 lg:p-1 pb-4 lg:pb-1"
            }`}
        >
            <div
                className={`flex flex-col w-full justify-center rounded-lg relative z-10 ${
                    isMobileLandscape ? "mx-1 space-y-0.5 max-w-full" : "lg:w-[850px] mx-4 lg:mx-0 space-y-2 lg:space-y-3 max-w-full"
                }`}
            >
                {/* Deal Button - Show above other buttons when available */}
                {shouldShowDealButton && (
                    <div className="flex justify-center mb-2 lg:mb-3">
                        <button
                            onClick={() => handleDeal(tableId)}
                            className="btn-deal text-white font-bold py-2 lg:py-3 px-6 lg:px-8 rounded-lg shadow-md text-sm lg:text-base backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

                {/* New Hand Button - Show when the round is "end" */}
                {gameState?.round === TexasHoldemRound.END && (
                    <div className="flex justify-center mb-2 lg:mb-3">
                        <button
                            onClick={() => handleStartNewHand(tableId)}
                            className="btn-new-hand text-white font-bold py-2 lg:py-3 px-6 lg:px-8 rounded-lg shadow-lg text-sm lg:text-base border-2 transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            START NEW HAND
                        </button>
                    </div>
                )}

                {/* Muck Button - Show when action is available */}
                {hasMuckAction && (
                    <div className="flex justify-center mb-2 lg:mb-3">
                        <button
                            onClick={() => handleMuck(tableId)}
                            className="btn-muck text-white font-bold py-2 lg:py-3 px-6 lg:px-8 rounded-lg shadow-lg text-sm lg:text-base border-2 transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                            MUCK CARDS
                        </button>
                    </div>
                )}

                {/* Show Button - Show when action is available */}
                {hasShowAction && (
                    <div className="flex justify-center mb-2 lg:mb-3">
                        <button
                            onClick={() => handleShow(tableId)}
                            className="btn-show text-white font-bold py-2 lg:py-3 px-6 lg:px-8 rounded-lg shadow-lg text-sm lg:text-base border-2 transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                            </svg>
                            SHOW CARDS
                        </button>
                    </div>
                )}

                {/* Only show other buttons if deal button is not showing */}
                {!hideOtherButtons && (
                    <>
                        {/* Player Action Buttons Container */}
                        <div className={`flex justify-center items-center ${isMobileLandscape ? "gap-0.5" : "gap-1 lg:gap-2"}`}>
                            {showSmallBlindButton && playerStatus !== PlayerStatus.FOLDED && (
                                <button
                                    onClick={handlePostSmallBlind}
                                    className="btn-small-blind text-white font-medium py-1.5 lg:py-2 px-2 lg:px-4 rounded-lg shadow-md transition-all duration-200 text-xs lg:text-sm border flex items-center transform hover:scale-105 mr-1 lg:mr-2"
                                >
                                    <span className="mr-1">Post Small Blind</span>
                                    <span className="btn-small-blind-amount backdrop-blur-sm px-1 lg:px-2 py-1 rounded text-xs border">
                                        ${formattedSmallBlindAmount}
                                    </span>
                                </button>
                            )}

                            {showBigBlindButton && playerStatus !== PlayerStatus.FOLDED && (
                                <button
                                    onClick={handlePostBigBlind}
                                    className="btn-big-blind text-white font-medium py-1.5 lg:py-2 px-2 lg:px-4 rounded-lg shadow-md transition-all duration-200 text-xs lg:text-sm border flex items-center transform hover:scale-105 mr-1 lg:mr-2"
                                >
                                    <span className="mr-1">Post Big Blind</span>
                                    <span className="btn-big-blind-amount backdrop-blur-sm px-1 lg:px-2 py-1 rounded text-xs border">
                                        ${formattedBigBlindAmount}
                                    </span>
                                </button>
                            )}
                            {canFoldAnytime && (!showActionButtons || showSmallBlindButton || showBigBlindButton) && (
                                <button
                                    className="btn-fold cursor-pointer active:scale-105
px-3 lg:px-6 py-1.5 lg:py-2 rounded-lg border text-xs lg:text-sm
transition-all duration-200 font-medium min-w-[80px] lg:min-w-[100px]"
                                    onClick={() => handleFold(tableId)}
                                >
                                    FOLD
                                </button>
                            )}
                            {/* Show a message if the player has folded */}
                            {userPlayer?.status === PlayerStatus.FOLDED && (
                                <div className="text-gray-400 py-1.5 lg:py-2 px-2 lg:px-4 bg-gray-800 bg-opacity-50 rounded-lg text-xs lg:text-sm">
                                    You have folded this hand
                                </div>
                            )}
                        </div>

                        {/* Only show other action buttons if it's the player's turn, they have legal actions, and it's not time to post blinds */}
                        {showActionButtons && !showSmallBlindButton && !showBigBlindButton ? (
                            <>
                                <div className={`flex justify-between ${isMobileLandscape ? "gap-0.5" : "gap-1 lg:gap-2"}`}>
                                    {canFoldAnytime && (
                                        <button
                                            className={`btn-fold cursor-pointer active:scale-105 rounded-lg border transition-all duration-200 font-medium ${
                                                isMobileLandscape
                                                    ? "px-2 py-0.5 text-[10px] min-w-[50px]"
                                                    : "px-3 lg:px-6 py-1.5 lg:py-2 text-xs lg:text-sm min-w-[80px] lg:min-w-[100px]"
                                            }`}
                                            onClick={() => handleFold(tableId)}
                                        >
                                            FOLD
                                        </button>
                                    )}
                                    {/* Show a message if the player has folded */}
                                    {userPlayer?.status === PlayerStatus.FOLDED && (
                                        <div className="text-gray-400 py-1.5 lg:py-2 px-2 lg:px-4 bg-gray-800 bg-opacity-50 rounded-lg text-xs lg:text-sm">
                                            You have folded this hand
                                        </div>
                                    )}

                                    {hasCheckAction && (
                                        <button
                                            className={`cursor-pointer bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#1e3a8a]/90 hover:to-[#1e40af]/90 active:from-[#1e40af] active:to-[#2563eb]
                                            rounded-lg w-full border border-[#3a546d] hover:border-[#1e3a8a]/50 active:border-[#3b82f6]/70 shadow-md backdrop-blur-sm
                                            transition-all duration-200 font-medium transform active:scale-105 active:shadow-[0_0_15px_rgba(59,130,246,0.2)] ${
                                                isMobileLandscape ? "px-2 py-0.5 text-[10px]" : "px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm"
                                            }`}
                                            onClick={() => handleCheck(tableId)}
                                        >
                                            CHECK
                                        </button>
                                    )}
                                    {hasCallAction && (
                                        <button
                                            className={`btn-call cursor-pointer rounded-lg w-full border shadow-md backdrop-blur-sm
                                            transition-all duration-200 font-medium transform active:scale-105 ${
                                                isMobileLandscape ? "px-2 py-0.5 text-[10px]" : "px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm"
                                            }`}
                                            onClick={() => handleCall(callAmount, tableId)}
                                        >
                                            CALL <span style={{ color: colors.brand.primary }}>${formattedCallAmount}</span>
                                        </button>
                                    )}
                                    {(hasRaiseAction || hasBetAction) && (
                                        <button
                                            onClick={hasRaiseAction ? handleRaise : handleBet}
                                            disabled={hasRaiseAction ? isRaiseAmountInvalid : !hasBetAction || !isPlayerTurn}
                                            className={`cursor-pointer hover:scale-105 btn-raise rounded-lg w-full border shadow-md backdrop-blur-sm transition-all duration-200 font-medium ${
                                                isMobileLandscape ? "px-2 py-0.5 text-[10px]" : "px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm"
                                            }`}
                                        >
                                            {hasRaiseAction ? "RAISE" : "BET"} <span style={{ color: colors.brand.primary }}>${formattedRaiseAmount}</span>
                                        </button>
                                    )}
                                </div>

                                {/* Only show slider and betting options if player can bet or raise */}
                                {(hasBetAction || hasRaiseAction) && (
                                    <>
                                        {/* Slider and Controls - Compact for mobile landscape */}
                                        <div
                                            className={`flex items-center bg-[#0f172a40] backdrop-blur-sm rounded-lg border border-[#3a546d]/50 shadow-inner ${
                                                isMobileLandscape ? "gap-1 px-1 py-0.5 h-8" : "space-x-2 lg:space-x-4 p-2 lg:p-3"
                                            }`}
                                        >
                                            {/* Min/Max text - placed first in mobile landscape */}
                                            {isMobileLandscape && (
                                                <div className="flex items-center text-[9px] text-gray-400 whitespace-nowrap">
                                                    <span>Min:${hasBetAction ? formatWeiToDollars(minBet) : formatWeiToDollars(minRaise)}</span>
                                                    <span className="mx-1">/</span>
                                                    <span>Max:${formattedMaxBetAmount}</span>
                                                </div>
                                            )}

                                            <button
                                                className={
                                                    isMobileLandscape
                                                        ? "btn-slider py-0.5 px-1.5 rounded border text-[10px] transition-all duration-200"
                                                        : "btn-slider py-1 px-2 lg:px-4 rounded-lg border text-xs lg:text-sm transition-all duration-200"
                                                }
                                                onClick={() => handleRaiseChange(-getStep())}
                                                disabled={!isPlayerTurn}
                                            >
                                                -
                                            </button>

                                            {/* Slider with dynamic fill */}
                                            <input
                                                type="range"
                                                min={hasBetAction ? Number(minBet) : Number(minRaise)}
                                                max={hasBetAction ? Number(maxBet) : Number(maxRaise)}
                                                step={getStep()}
                                                value={raiseAmount}
                                                onChange={e => {
                                                    setRaiseAmountAbsolute(Number(e.target.value));
                                                }}
                                                className={
                                                    isMobileLandscape
                                                        ? "flex-1 accent-[#64ffda] h-1 rounded-full transition-all duration-200"
                                                        : "flex-1 accent-[#64ffda] h-2 rounded-full transition-all duration-200"
                                                }
                                                style={{
                                                    background: `linear-gradient(to right, #64ffda 0%, #64ffda ${
                                                        ((raiseAmount - (hasBetAction ? Number(minBet) : Number(minRaise))) /
                                                            ((hasBetAction ? Number(maxBet) : Number(maxRaise)) -
                                                                (hasBetAction ? Number(minBet) : Number(minRaise)))) *
                                                        100
                                                    }%, #1e293b ${
                                                        ((raiseAmount - (hasBetAction ? Number(minBet) : Number(minRaise))) /
                                                            ((hasBetAction ? Number(maxBet) : Number(maxRaise)) -
                                                                (hasBetAction ? Number(minBet) : Number(minRaise)))) *
                                                        100
                                                    }%, #1e293b 100%)`
                                                }}
                                                disabled={!isPlayerTurn}
                                            />
                                            <button
                                                className={
                                                    isMobileLandscape
                                                        ? "btn-slider py-0.5 px-1.5 rounded border text-[10px] transition-all duration-200"
                                                        : "btn-slider py-1 px-2 lg:px-4 rounded-lg border text-xs lg:text-sm transition-all duration-200"
                                                }
                                                onClick={() => handleRaiseChange(getStep())}
                                                disabled={!isPlayerTurn}
                                            >
                                                +
                                            </button>

                                            {/* Inline Input Box - compact for mobile landscape */}
                                            {!isMobileLandscape && (
                                                <div className="flex flex-col items-end gap-1 min-w-0">
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={raiseAmount.toFixed(2)}
                                                        onChange={e => {
                                                            const raw = e.target.value;

                                                            // Allow typing incomplete decimals like "2.", "2.0", or "2.08"
                                                            if (/^\d*\.?\d{0,2}$/.test(raw)) {
                                                                // Only parse if it's a valid number (e.g. "2", "2.0", "2.08")
                                                                if (!isNaN(Number(raw)) && /^\d*\.?\d{1,2}$/.test(raw)) {
                                                                    setRaiseAmount(parseFloat(raw));
                                                                }
                                                            }
                                                        }}
                                                        className={`${inputFieldClassName} px-1 lg:px-2 py-1 rounded text-xs lg:text-sm w-[80px] lg:w-[100px] transition-all duration-200 border`}
                                                        disabled={!isPlayerTurn}
                                                    />
                                                    <div className={`${minMaxTextClassName} text-[8px] lg:text-[10px] text-right leading-snug`}>
                                                        <div>Min: ${hasBetAction ? formatWeiToDollars(minBet) : formatWeiToDollars(minRaise)}</div>
                                                        <div>Max: ${formattedMaxBetAmount}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {isMobileLandscape && (
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={raiseAmount.toFixed(2)}
                                                    onChange={e => {
                                                        const raw = e.target.value;

                                                        // Allow typing incomplete decimals like "2.", "2.0", or "2.08"
                                                        if (/^\d*\.?\d{0,2}$/.test(raw)) {
                                                            // Only parse if it's a valid number (e.g. "2", "2.0", "2.08")
                                                            if (!isNaN(Number(raw)) && /^\d*\.?\d{1,2}$/.test(raw)) {
                                                                setRaiseAmount(parseFloat(raw));
                                                            }
                                                        }
                                                    }}
                                                    className={`${inputFieldClassName} px-1 py-0.5 rounded text-[10px] w-[50px] transition-all duration-200 border`}
                                                    disabled={!isPlayerTurn}
                                                />
                                            )}
                                        </div>

                                        {/* Additional Options - Hide in mobile landscape to save space */}
                                        {!isMobileLandscape && (
                                            <div className="flex justify-between gap-1 lg:gap-2 mb-1">
                                                <button
                                                    className="btn-pot px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs
                                                    transition-all duration-200 transform hover:scale-105"
                                                    onClick={() => {
                                                        const amount = 0.25 * totalPot;
                                                        setRaiseAmountAbsolute(amount);
                                                    }}
                                                    disabled={!isPlayerTurn}
                                                >
                                                    1/4 Pot
                                                </button>
                                                <button
                                                    className="btn-pot px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs
                                                    transition-all duration-200 transform hover:scale-105"
                                                    onClick={() => {
                                                        const amount = 0.5 * totalPot;
                                                        setRaiseAmountAbsolute(amount);
                                                    }}
                                                    disabled={!isPlayerTurn}
                                                >
                                                    1/2 Pot
                                                </button>
                                                <button
                                                    className="btn-pot px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs
                                                    transition-all duration-200 transform hover:scale-105"
                                                    onClick={() => {
                                                        const amount = 0.75 * totalPot;
                                                        setRaiseAmountAbsolute(amount);
                                                    }}
                                                    disabled={!isPlayerTurn}
                                                >
                                                    3/4 Pot
                                                </button>
                                                <button
                                                    className="btn-pot px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs
                                                    transition-all duration-200 transform hover:scale-105"
                                                    onClick={() => {
                                                        const potBet: bigint = calculatePotBetAmount({
                                                            currentRound: gameState?.round || TexasHoldemRound.ANTE,
                                                            previousActions: gameState?.previousActions || [],
                                                            callAmount: BigInt(callAmount || 0),
                                                            pot: BigInt(totalPot || 0)
                                                        });

                                                        setRaiseAmountAbsolute(Number(potBet));
                                                    }}
                                                    disabled={!isPlayerTurn}
                                                >
                                                    Pot
                                                </button>
                                                <button
                                                    className="btn-all-in px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs
                                                    transition-all duration-200 font-medium transform active:scale-105"
                                                    onClick={() => {
                                                        const amount = hasBetAction ? maxBet : maxRaise;
                                                        setRaiseAmountAbsolute(Number(amount));
                                                    }}
                                                    disabled={!isPlayerTurn}
                                                >
                                                    ALL-IN
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
});

export default PokerActionPanel;
