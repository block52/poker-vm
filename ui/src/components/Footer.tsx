import React, { useEffect, useState, useMemo, useCallback } from "react";
import { NonPlayerActionType, PlayerActionType, PlayerDTO, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { useParams } from "react-router-dom";
import { colors } from "../utils/colorConfig";
import { calculatePotBetAmount } from "../utils/calculatePotBetAmount";
import { LoadingSpinner } from "./common";
import { parseMicroToBigInt, microBigIntToUsdc, usdcToMicroBigInt } from "../constants/currency";

// Import hooks from barrel file
import { useTableState, useNextToActInfo, useGameOptions, betHand, postBigBlind, postSmallBlind, raiseHand } from "../hooks";

// Import specific hooks not in barrel
import { usePlayerLegalActions } from "../hooks/playerActions/usePlayerLegalActions";
import { useGameStateContext } from "../context/GameStateContext";
import { useNetwork } from "../context/NetworkContext";

// Import action handlers (removing unused ones)
import { handleCall, handleCheck, handleFold, handleMuck, handleShow, handleStartNewHand } from "./common/actionHandlers";
import { dealCardsWithEntropy } from "../hooks/playerActions/dealCards";
import { getActionByType, hasAction } from "../utils/actionUtils";
import { getRaiseToAmount } from "../utils/raiseUtils";
import "./Footer.css";

// Import the DealEntropyModal
import DealEntropyModal from "./playPage/DealEntropyModal";

interface PokerActionPanelProps {
    onTransactionSubmitted?: (txHash: string | null) => void;
}

const PokerActionPanel: React.FC<PokerActionPanelProps> = React.memo(({ onTransactionSubmitted }) => {
    const { id: tableId } = useParams<{ id: string }>();
    const { currentNetwork } = useNetwork();

    // Loading state for actions
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    // State for deal entropy modal
    const [showDealModal, setShowDealModal] = useState(false);

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
    const { formattedTotalPot } = useTableState();

    const [publicKey, setPublicKey] = useState<string>();
    const [privateKey, setPrivateKey] = useState<string>();

    // Use useMemo for localStorage access
    const userAddress = useMemo(() => localStorage.getItem("user_cosmos_address")?.toLowerCase(), []);

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

    // Store amounts as bigint internally (in micro-units, 10^6 precision)
    const minBetMicro = useMemo(() => parseMicroToBigInt(betAction?.min), [betAction]);
    const maxBetMicro = useMemo(() => parseMicroToBigInt(betAction?.max), [betAction]);
    const minRaiseMicro = useMemo(() => parseMicroToBigInt(raiseAction?.min), [raiseAction]);
    const maxRaiseMicro = useMemo(() => parseMicroToBigInt(raiseAction?.max), [raiseAction]);
    const callAmountMicro = useMemo(() => parseMicroToBigInt(callAction?.min), [callAction]);

    // Convert to USDC (number) for display and slider (HTML range inputs need numbers)
    const minBet = useMemo(() => microBigIntToUsdc(minBetMicro), [minBetMicro]);
    const maxBet = useMemo(() => microBigIntToUsdc(maxBetMicro), [maxBetMicro]);
    const minRaise = useMemo(() => microBigIntToUsdc(minRaiseMicro), [minRaiseMicro]);
    const maxRaise = useMemo(() => microBigIntToUsdc(maxRaiseMicro), [maxRaiseMicro]);
    const callAmount = useMemo(() => microBigIntToUsdc(callAmountMicro), [callAmountMicro]);

    // Helper function to wrap action handlers with loading state and transaction tracking
    const handleActionWithTransaction = async (actionName: string, actionFn: () => Promise<string | null>) => {
        try {
            setLoadingAction(actionName);
            const txHash = await actionFn();
            if (txHash && onTransactionSubmitted) {
                onTransactionSubmitted(txHash);
            }
        } catch (error) {
            console.error(`Error executing ${actionName}:`, error);
            throw error;
        } finally {
            setLoadingAction(null);
        }
    };

    const getStep = (): number => {
        return hasBetAction ? minBet : hasRaiseAction ? minRaise : 0;
    };

    // These are the default amounts - initialize with proper minimum
    const initialAmount = hasBetAction ? (minBet > 0 ? minBet : 0) : minRaise > 0 ? minRaise : 0;
    const [raiseAmount, setRaiseAmount] = useState<number>(initialAmount);
    const [, setRaiseInputRaw] = useState<string>(initialAmount.toFixed(2));
    const [, setLastAmountSource] = useState<"slider" | "input" | "button">("slider");

    // Handle raise amount changes from slider or input
    const raiseActionAmount = getRaiseToAmount(minRaise, gameState?.previousActions || [], gameState?.round ?? TexasHoldemRound.ANTE, userAddress || "");
    console.log(`Raise action amount: ${raiseActionAmount}`);

    const isRaiseAmountInvalid = hasRaiseAction
        ? raiseAmount < minRaise || raiseAmount > maxRaise
        : hasBetAction
        ? raiseAmount < minBet || raiseAmount > maxBet
        : false;

    // Get total pot for percentage calculations (in USDC for display)
    const totalPot = Number(formattedTotalPot) || 0;
    // Also store pot in micro-units as bigint for calculations
    const totalPotMicro = useMemo(() => usdcToMicroBigInt(totalPot), [totalPot]);

    // Dynamic class names based on validation state
    const inputFieldClassName = useMemo(() => `input-field ${isRaiseAmountInvalid ? "invalid" : ""}`, [isRaiseAmountInvalid]);
    const minMaxTextClassName = useMemo(() => `min-max-text ${isRaiseAmountInvalid ? "invalid" : ""}`, [isRaiseAmountInvalid]);

    // Memoize expensive computations - convert from microunits (6 decimals) to USDC for display
    const smallBlindMicro = useMemo(() => parseMicroToBigInt(smallBlindAction?.min), [smallBlindAction?.min]);
    const bigBlindMicro = useMemo(() => parseMicroToBigInt(bigBlindAction?.min), [bigBlindAction?.min]);
    const formattedSmallBlindAmount = useMemo(() => microBigIntToUsdc(smallBlindMicro).toFixed(2), [smallBlindMicro]);
    const formattedBigBlindAmount = useMemo(() => microBigIntToUsdc(bigBlindMicro).toFixed(2), [bigBlindMicro]);
    const formattedCallAmount = useMemo(() => callAmount.toFixed(2), [callAmount]);
    const formattedMaxBetAmount = useMemo(() => (hasBetAction ? maxBet.toFixed(2) : maxRaise.toFixed(2)), [hasBetAction, maxBet, maxRaise]);

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
    const handleRaiseChange = (delta: number) => {
        const currentRaiseAmount = raiseAmount || minRaise;
        let newRaiseAmount = currentRaiseAmount + delta;

        if (newRaiseAmount < minRaise) {
            newRaiseAmount = minRaise;
        }

        if (newRaiseAmount > maxRaise) {
            newRaiseAmount = maxRaise;
        }

        setRaiseAmount(newRaiseAmount);
    };

    const setRaiseAmountAbsolute = (amount: number, source: "slider" | "input" | "button") => {
        setRaiseAmount(amount);
        setLastAmountSource(source);
    };

    // Min Raise Text Prefill - Always set to minimum when actions become available
    useEffect(() => {
        if (hasRaiseAction && minRaise > 0) {
            setRaiseAmount(minRaise);
            setRaiseInputRaw(minRaise.toFixed(2));
        } else if (hasBetAction && minBet > 0) {
            setRaiseAmount(minBet);
            setRaiseInputRaw(minBet.toFixed(2));
        }
    }, [hasRaiseAction, hasBetAction, minRaise, minBet]);

    // Handler functions for different actions - simplified
    // All amounts are passed as bigint (micro-units) to the action hooks
    const handlePostSmallBlind = async () => {
        if (!tableId) return;

        // Use the bigint amount directly, fallback to gameOptions if action not available
        const sbAmount = smallBlindMicro > 0n ? smallBlindMicro : parseMicroToBigInt(gameOptions?.smallBlind);
        if (sbAmount === 0n) return;

        await handleActionWithTransaction("small-blind", async () => {
            try {
                console.log("🎰 Attempting to post small blind:", sbAmount.toString());
                const result = await postSmallBlind(tableId, sbAmount, currentNetwork);
                console.log("✅ Small blind posted successfully");
                return result?.hash || null;
            } catch (error: any) {
                console.error("❌ Failed to post small blind:", error);
                alert(`Failed to post small blind: ${error.message}`);
                throw error;
            }
        });
    };

    const handlePostBigBlind = async () => {
        if (!tableId) return;

        // Use the bigint amount directly, fallback to gameOptions if action not available
        const bbAmount = bigBlindMicro > 0n ? bigBlindMicro : parseMicroToBigInt(gameOptions?.bigBlind);
        if (bbAmount === 0n) return;

        await handleActionWithTransaction("big-blind", async () => {
            try {
                const result = await postBigBlind(tableId, bbAmount, currentNetwork);
                return result?.hash || null;
            } catch (error: any) {
                console.error("❌ Failed to post big blind:", error);
                throw error;
            }
        });
    };

    const handleBet = async () => {
        if (!tableId) return;

        // Convert USDC display amount to micro-units (bigint)
        const amountMicro = usdcToMicroBigInt(raiseAmount);

        await handleActionWithTransaction("bet", async () => {
            try {
                const result = await betHand(tableId, amountMicro, currentNetwork);
                return result?.hash || null;
            } catch (error: any) {
                console.error("Failed to bet:", error);
                throw error;
            }
        });
    };

    const handleRaise = async () => {
        if (!tableId) return;

        // Convert USDC display amount to micro-units (bigint)
        const amountMicro = usdcToMicroBigInt(raiseAmount);

        await handleActionWithTransaction("raise", async () => {
            try {
                const result = await raiseHand(tableId, amountMicro, currentNetwork);
                return result?.hash || null;
            } catch (error: any) {
                console.error("Failed to raise:", error);
                throw error;
            }
        });
    };

    // Handler for dealing cards with entropy from modal
    const handleDealWithEntropy = useCallback(async (entropy: string) => {
        if (!tableId) return;

        setLoadingAction("deal");
        try {
            const result = await dealCardsWithEntropy(tableId, currentNetwork, entropy);
            if (result?.hash && onTransactionSubmitted) {
                onTransactionSubmitted(result.hash);
            }
        } catch (error: any) {
            console.error("Failed to deal:", error);
            throw error;
        } finally {
            setLoadingAction(null);
        }
    }, [tableId, currentNetwork, onTransactionSubmitted]);

    // Calculate button visibility flags
    const { canFoldAnytime, showActionButtons, showSmallBlindButton, showBigBlindButton } = useMemo(() => {
        const showButtons = isUserInTable;
        const shouldShowSmallBlindButton = hasSmallBlindAction && isUsersTurn;
        const shouldShowBigBlindButton = hasBigBlindAction && isUsersTurn;

        return {
            canFoldAnytime: hasFoldAction && playerStatus !== PlayerStatus.FOLDED && showButtons,
            showActionButtons: isUsersTurn && legalActions && legalActions.length > 0 && showButtons,
            showSmallBlindButton: shouldShowSmallBlindButton && showButtons,
            showBigBlindButton: shouldShowBigBlindButton && showButtons
        };
    }, [hasSmallBlindAction, hasBigBlindAction, isUsersTurn, isUserInTable, hasFoldAction, playerStatus, legalActions]);

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
                {/* Deal Entropy Modal */}
                {showDealModal && (
                    <DealEntropyModal
                        tableId={tableId}
                        onClose={() => setShowDealModal(false)}
                        onDeal={handleDealWithEntropy}
                    />
                )}

                {/* Deal Button - Show above other buttons when available */}
                {shouldShowDealButton && (
                    <div className="flex justify-center gap-2 mb-2 lg:mb-3">
                        <button
                            onClick={() => handleDealWithEntropy("")}
                            disabled={loadingAction !== null}
                            className="btn-deal text-white font-bold py-2 lg:py-3 px-6 lg:px-8 rounded-lg shadow-md text-sm lg:text-base backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingAction === "deal" ? (
                                <LoadingSpinner size="sm" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                    />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {loadingAction === "deal" ? "DEALING..." : "DEAL"}
                        </button>
                        <button
                            onClick={() => setShowDealModal(true)}
                            disabled={loadingAction !== null}
                            className="text-white font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-lg shadow-md text-sm lg:text-base backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: colors.ui.bgMedium, border: `1px solid ${colors.ui.borderColor}` }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Show Entropy
                        </button>
                    </div>
                )}

                {/* New Hand Button - Show when the round is "end" */}
                {gameState?.round === TexasHoldemRound.END && (
                    <div className="flex justify-center mb-2 lg:mb-3">
                        <button
                            onClick={() => handleActionWithTransaction("new-hand", () => handleStartNewHand(tableId, currentNetwork))}
                            disabled={loadingAction !== null}
                            className="btn-new-hand text-white font-bold py-2 lg:py-3 px-6 lg:px-8 rounded-lg shadow-lg text-sm lg:text-base border-2 transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingAction === "new-hand" ? (
                                <LoadingSpinner size="sm" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                            )}
                            {loadingAction === "new-hand" ? "STARTING..." : "START NEW HAND"}
                        </button>
                    </div>
                )}

                {/* Muck Button - Show when action is available */}
                {hasMuckAction && (
                    <div className="flex justify-center mb-2 lg:mb-3">
                        <button
                            onClick={() => handleActionWithTransaction("muck", () => handleMuck(tableId, currentNetwork))}
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
                            onClick={() => handleActionWithTransaction("show", () => handleShow(tableId, currentNetwork))}
                            disabled={loadingAction !== null}
                            className="btn-show text-white font-bold py-2 lg:py-3 px-6 lg:px-8 rounded-lg shadow-lg text-sm lg:text-base border-2 transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingAction === "show" ? (
                                <LoadingSpinner size="sm" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                </svg>
                            )}
                            {loadingAction === "show" ? "SHOWING..." : "SHOW CARDS"}
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
                                    disabled={loadingAction !== null}
                                    className="btn-small-blind text-white font-medium py-1.5 lg:py-2 px-2 lg:px-4 rounded-lg shadow-md transition-all duration-200 text-xs lg:text-sm border flex items-center transform hover:scale-105 mr-1 lg:mr-2 disabled:opacity-50 disabled:cursor-not-allowed gap-1"
                                >
                                    {loadingAction === "small-blind" && <LoadingSpinner size="sm" />}
                                    {loadingAction === "small-blind" ? (
                                        <span>Posting...</span>
                                    ) : (
                                        <>
                                            <span className="mr-1">Post Small Blind</span>
                                            <span className="btn-small-blind-amount backdrop-blur-sm px-1 lg:px-2 py-1 rounded text-xs border">
                                                ${formattedSmallBlindAmount}
                                            </span>
                                        </>
                                    )}
                                </button>
                            )}

                            {showBigBlindButton && playerStatus !== PlayerStatus.FOLDED && (
                                <button
                                    onClick={handlePostBigBlind}
                                    disabled={loadingAction !== null}
                                    className="btn-big-blind text-white font-medium py-1.5 lg:py-2 px-2 lg:px-4 rounded-lg shadow-md transition-all duration-200 text-xs lg:text-sm border flex items-center transform hover:scale-105 mr-1 lg:mr-2 disabled:opacity-50 disabled:cursor-not-allowed gap-1"
                                >
                                    {loadingAction === "big-blind" && <LoadingSpinner size="sm" />}
                                    {loadingAction === "big-blind" ? (
                                        <span>Posting...</span>
                                    ) : (
                                        <>
                                            <span className="mr-1">Post Big Blind</span>
                                            <span className="btn-big-blind-amount backdrop-blur-sm px-1 lg:px-2 py-1 rounded text-xs border">
                                                ${formattedBigBlindAmount}
                                            </span>
                                        </>
                                    )}
                                </button>
                            )}
                            {canFoldAnytime && (!showActionButtons || showSmallBlindButton || showBigBlindButton) && (
                                <button
                                    className="btn-fold cursor-pointer active:scale-105
px-3 lg:px-6 py-1.5 lg:py-2 rounded-lg border text-xs lg:text-sm
transition-all duration-200 font-medium min-w-[80px] lg:min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    onClick={() => handleActionWithTransaction("fold", () => handleFold(tableId, currentNetwork))}
                                    disabled={loadingAction !== null}
                                >
                                    {loadingAction === "fold" && <LoadingSpinner size="sm" />}
                                    {loadingAction === "fold" ? "FOLDING..." : "FOLD"}
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
                                            className={`btn-fold cursor-pointer active:scale-105 rounded-lg border transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${
                                                isMobileLandscape
                                                    ? "px-2 py-0.5 text-[10px] min-w-[50px]"
                                                    : "px-3 lg:px-6 py-1.5 lg:py-2 text-xs lg:text-sm min-w-[80px] lg:min-w-[100px]"
                                            }`}
                                            onClick={() => handleActionWithTransaction("fold", () => handleFold(tableId, currentNetwork))}
                                            disabled={loadingAction !== null}
                                        >
                                            {loadingAction === "fold" && <LoadingSpinner size="sm" />}
                                            {loadingAction === "fold" ? "FOLDING..." : "FOLD"}
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
                                            transition-all duration-200 font-medium transform active:scale-105 active:shadow-[0_0_15px_rgba(59,130,246,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${
                                                isMobileLandscape ? "px-2 py-0.5 text-[10px]" : "px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm"
                                            }`}
                                            onClick={() => handleActionWithTransaction("check", () => handleCheck(tableId, currentNetwork))}
                                            disabled={loadingAction !== null}
                                        >
                                            {loadingAction === "check" && <LoadingSpinner size="sm" />}
                                            {loadingAction === "check" ? "CHECKING..." : "CHECK"}
                                        </button>
                                    )}
                                    {hasCallAction && (
                                        <button
                                            className={`btn-call cursor-pointer rounded-lg w-full border shadow-md backdrop-blur-sm
                                            transition-all duration-200 font-medium transform active:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${
                                                isMobileLandscape ? "px-2 py-0.5 text-[10px]" : "px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm"
                                            }`}
                                            onClick={() =>
                                                handleActionWithTransaction("call", () => handleCall(callAmountMicro, tableId, currentNetwork))
                                            }
                                            disabled={loadingAction !== null}
                                        >
                                            {loadingAction === "call" && <LoadingSpinner size="sm" />}
                                            {loadingAction === "call" ? (
                                                "CALLING..."
                                            ) : (
                                                <>
                                                    CALL <span style={{ color: colors.brand.primary }}>${formattedCallAmount}</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                    {(hasRaiseAction || hasBetAction) && (
                                        <button
                                            onClick={hasRaiseAction ? handleRaise : handleBet}
                                            disabled={loadingAction !== null || (hasRaiseAction ? isRaiseAmountInvalid : !hasBetAction || !isPlayerTurn)}
                                            className={`cursor-pointer hover:scale-105 btn-raise rounded-lg w-full border shadow-md backdrop-blur-sm transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${
                                                isMobileLandscape ? "px-2 py-0.5 text-[10px]" : "px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm"
                                            }`}
                                        >
                                            {(loadingAction === "raise" || loadingAction === "bet") && <LoadingSpinner size="sm" />}
                                            {loadingAction === "raise" || loadingAction === "bet" ? (
                                                hasRaiseAction ? (
                                                    "RAISING..."
                                                ) : (
                                                    "BETTING..."
                                                )
                                            ) : (
                                                <>
                                                    {hasRaiseAction ? "RAISE" : "BET"}{" "}
                                                    <span style={{ color: colors.brand.primary }}>${raiseAmount.toFixed(2)}</span>
                                                </>
                                            )}
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
                                                    <span>Min:${hasBetAction ? minBet.toFixed(2) : minRaise.toFixed(2)}</span>
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
                                                min={hasBetAction ? minBet : minRaise}
                                                max={hasBetAction ? maxBet : maxRaise}
                                                step={getStep()}
                                                value={raiseAmount}
                                                onChange={e => {
                                                    setRaiseAmountAbsolute(Number(e.target.value), "slider");
                                                }}
                                                className={
                                                    isMobileLandscape
                                                        ? "flex-1 accent-[#64ffda] h-1 rounded-full transition-all duration-200"
                                                        : "flex-1 accent-[#64ffda] h-2 rounded-full transition-all duration-200"
                                                }
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
                                                        className={`${inputFieldClassName} px-1 lg:px-2 py-1 rounded text-xs lg:text-sm w-[80px] lg:w-[100px] transition-all duration-200 border`}
                                                        disabled={!isPlayerTurn}
                                                    />
                                                    <div className={`${minMaxTextClassName} text-[8px] lg:text-[10px] text-right leading-snug`}>
                                                        <div>Min: ${hasBetAction ? minBet.toFixed(2) : minRaise.toFixed(2)}</div>
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
                                                        const newAmt = Math.max(totalPot / 4, hasBetAction ? minBet : minRaise);
                                                        setRaiseAmountAbsolute(newAmt, "button");
                                                    }}
                                                    disabled={!isPlayerTurn}
                                                >
                                                    1/4 Pot
                                                </button>
                                                <button
                                                    className="btn-pot px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs
                                                    transition-all duration-200 transform hover:scale-105"
                                                    onClick={() => {
                                                        const newAmt = Math.max(totalPot / 2, hasBetAction ? minBet : minRaise);
                                                        setRaiseAmountAbsolute(newAmt, "button");
                                                    }}
                                                    disabled={!isPlayerTurn}
                                                >
                                                    1/2 Pot
                                                </button>
                                                <button
                                                    className="btn-pot px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs
                                                    transition-all duration-200 transform hover:scale-105"
                                                    onClick={() => {
                                                        const newAmt = Math.max((totalPot * 3) / 4, hasBetAction ? minBet : minRaise);
                                                        setRaiseAmountAbsolute(newAmt, "button");
                                                    }}
                                                    disabled={!isPlayerTurn}
                                                >
                                                    3/4 Pot
                                                </button>
                                                <button
                                                    className="btn-pot px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs
                                                    transition-all duration-200 transform hover:scale-105"
                                                    onClick={() => {
                                                        const potBetMicro: bigint = calculatePotBetAmount({
                                                            currentRound: gameState?.round || TexasHoldemRound.ANTE,
                                                            previousActions: gameState?.previousActions || [],
                                                            callAmount: callAmountMicro,
                                                            pot: totalPotMicro
                                                        });

                                                        // Convert bigint micro-units to USDC for display
                                                        setRaiseAmountAbsolute(microBigIntToUsdc(potBetMicro), "button");
                                                    }}
                                                    disabled={!isPlayerTurn}
                                                >
                                                    Pot
                                                </button>
                                                <button
                                                    className="btn-all-in px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs
                                                    transition-all duration-200 font-medium transform active:scale-105"
                                                    onClick={() => {
                                                        const newAmt = hasBetAction ? maxBet : maxRaise;
                                                        setRaiseAmountAbsolute(newAmt, "button");
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
