import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import * as React from "react";
import { NonPlayerActionType, PlayerActionType, PlayerDTO, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { useTableState } from "../hooks/useTableState";
import { useParams } from "react-router-dom";
import { colors, hexToRgba } from "../utils/colorConfig";

// Import our custom hooks
import { usePlayerLegalActions } from "../hooks/playerActions/usePlayerLegalActions";
import { checkHand } from "../hooks/playerActions/checkHand";
import { foldHand } from "../hooks/playerActions/foldHand";
import { raiseHand } from "../hooks/playerActions/raiseHand";
import { postSmallBlind } from "../hooks/playerActions/postSmallBlind";
import { postBigBlind } from "../hooks/playerActions/postBigBlind";
import { useNextToActInfo } from "../hooks/useNextToActInfo";
import { callHand } from "../hooks/playerActions/callHand";
import { betHand } from "../hooks/playerActions/betHand";
import { usePlayerTimer } from "../hooks/usePlayerTimer";
import { useGameOptions } from "../hooks/useGameOptions";
import { useGameStateContext } from "../context/GameStateContext";

import { ethers } from "ethers";
import { formatBalance } from "./common/utils";
import { handleDeal, handleMuck, handleShow, handleStartNewHand } from "./common/actionHandlers";
import { getActionByType, hasAction } from "../utils/actionUtils";
import { getRaiseToAmount } from "../utils/raiseUtils";

const PokerActionPanel: React.FC = React.memo(() => {
    const { id: tableId } = useParams<{ id: string }>();

    // Add ref to track if we're already attempting to auto-deal
    const attemptToAutoDeal = useRef<boolean>(false);

    // Get game state directly from Context - no additional WebSocket connections
    const { gameState } = useGameStateContext();
    const players = gameState?.players || null;
    const { legalActions, isPlayerTurn, playerStatus } = usePlayerLegalActions();
    const { gameOptions } = useGameOptions();
    // Direct function imports - no hook destructuring needed

    // Use the useNextToActInfo hook
    const { isCurrentUserTurn, timeRemaining } = useNextToActInfo(tableId);

    // Add the useTableState hook to get table state properties
    const { currentRound, formattedTotalPot } = useTableState();

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

    // // Helper function to check if an action exists in legal actions (handles both string and enum types)
    // const hasAction = (actionType: PlayerActionType | NonPlayerActionType) => {
    //     return legalActions?.some(action => action.action === actionType);
    // };

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

    // // Find the specific actions
    // const getActionByType = (actionType: string | PlayerActionType | NonPlayerActionType) => {
    //     return legalActions?.find(action => action.action === actionType || action.action?.toString() === actionType?.toString());
    // };

    const smallBlindAction = getActionByType(legalActions, PlayerActionType.SMALL_BLIND);
    const bigBlindAction = getActionByType(legalActions, PlayerActionType.BIG_BLIND);
    const callAction = getActionByType(legalActions, PlayerActionType.CALL);
    const betAction = getActionByType(legalActions, PlayerActionType.BET);
    const raiseAction = getActionByType(legalActions, PlayerActionType.RAISE);

    // Convert values to USDC for faster display
    const minBet = useMemo(() => (betAction ? Number(ethers.formatUnits(betAction.min || "0", 18)) : 0), [betAction]);
    const maxBet = useMemo(() => (betAction ? Number(ethers.formatUnits(betAction.max || "0", 18)) : 0), [betAction]);
    const minRaise = useMemo(() => (raiseAction ? Number(ethers.formatUnits(raiseAction.min || "0", 18)) : 0), [raiseAction]);
    const maxRaise = useMemo(() => (raiseAction ? Number(ethers.formatUnits(raiseAction.max || "0", 18)) : 0), [raiseAction]);
    const callAmount = useMemo(() => (callAction ? Number(ethers.formatUnits(callAction.min || "0", 18)) : 0), [callAction]);

    // Slider step values
    const step = minBet;

    const getStep = () => {
        return hasBetAction ? minBet : hasRaiseAction ? minRaise : 0;
    };

    // These are the default amounts
    const [raiseAmount, setRaiseAmount] = useState<number>(minRaise);
    const [, setRaiseInputRaw] = useState<string>(minRaise.toFixed(2)); // or minBet
    const [, setLastAmountSource] = useState<"slider" | "input" | "button">("slider");

    // const getRaiseToAmount = useCallback((): number => {
    //     // Get players previous actions
    //     const previousActions = gameState?.previousActions.filter(action => action.playerId?.toLowerCase() === userAddress?.toLowerCase());

    //     if (!previousActions || previousActions.length === 0) {
    //         // If no previous actions, return the minimum raise amount
    //         return minRaise;
    //     }

    //     if (!gameState || !gameState.round) {
    //         console.error("Game state is not available");
    //         return minRaise;
    //     }

    //     const currentRoundActions: ActionDTO[] = previousActions.filter(action => action.round === gameState.round);

    //     // If the current round is PREFLOP, include ante actions
    //     if (gameState.round === TexasHoldemRound.PREFLOP) {
    //         const anteAction = previousActions.find(action => action.action === PlayerActionType.SMALL_BLIND || action.action === PlayerActionType.BIG_BLIND);
    //         if (anteAction) {
    //             // Add ante action to the current round actions
    //             currentRoundActions.push(anteAction);
    //         }
    //     }

    //     // Filter by bet and raise actions only
    //     const previousBetsAndRaises: ActionDTO[] = currentRoundActions.filter(
    //         action =>
    //             action.action === PlayerActionType.BET ||
    //             action.action === PlayerActionType.RAISE ||
    //             action.action === PlayerActionType.CALL ||
    //             action.action === PlayerActionType.SMALL_BLIND ||
    //             action.action === PlayerActionType.BIG_BLIND
    //     );

    //     // Sum the raise amount and previous bets/raises
    //     const totalPreviousBetsAndRaises: number = previousBetsAndRaises.reduce((sum, action) => {
    //         const amount = action.amount ? Number(ethers.formatUnits(action.amount, 18)) : 0;
    //         return sum + amount;
    //     }, 0);

    //     // Calculate the raise amount based on previous bets/raises
    //     return raiseAmount > 0 ? raiseAmount + totalPreviousBetsAndRaises : minRaise;
    // }, [gameState, minRaise, raiseAmount, userAddress]);

    // Handle raise amount changes from slider or input
    const raiseActionAmount = getRaiseToAmount(minRaise, gameState?.previousActions || [], currentRound, userAddress || "");
    console.log(`Raise action amount: ${raiseActionAmount}`);

    const isRaiseAmountInvalid = hasRaiseAction
        ? raiseActionAmount < minRaise || raiseActionAmount > maxRaise
        : hasBetAction
        ? raiseActionAmount < minBet || raiseActionAmount > maxBet
        : false;

    // Get total pot for percentage calculations
    const totalPot = Number(formattedTotalPot) || 0;

    // Direct function imports - no hook destructuring needed for sit in/out

    // Add timer extension functionality for the footer button
    const { extendTime, canExtend } = usePlayerTimer(tableId, userPlayer?.seat);

    // Get the timeout duration from game options for display
    const timeoutDuration = useMemo(() => {
        if (!gameOptions?.timeout) return 30;
        // Timeout now comes as milliseconds directly, convert to seconds
        return Math.floor(gameOptions.timeout / 1000);
    }, [gameOptions]);

    // Handler for footer extension button
    const handleExtendTimeFromFooter = useCallback(() => {
        if (!extendTime || !canExtend) {
            console.log("Cannot extend time - not available or already used");
            return;
        }

        extendTime();
        console.log(`⏰ Time extended by ${timeoutDuration} seconds from footer button`);
    }, [extendTime, canExtend, timeoutDuration]);

    // Memoize all button styles to prevent re-renders
    const dealButtonStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${hexToRgba(colors.brand.primary, 0.9)}, ${hexToRgba(colors.brand.primary, 0.9)})`,
            borderColor: hexToRgba(colors.brand.primary, 0.5),
            boxShadow: `0 0 15px ${hexToRgba(colors.brand.primary, 0.3)}`
        }),
        []
    );

    const newHandButtonStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.brand.secondary}, ${colors.brand.primary})`,
            borderColor: hexToRgba(colors.brand.primary, 0.6)
        }),
        []
    );

    const muckButtonStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.ui.bgMedium}, ${colors.ui.bgDark})`,
            borderColor: colors.ui.borderColor
        }),
        []
    );

    const showButtonStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.brand.primary}, ${colors.brand.primary})`,
            borderColor: colors.brand.primary
        }),
        []
    );

    const smallBlindButtonStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.accent.success}, ${hexToRgba(colors.accent.success, 0.8)})`,
            borderColor: colors.accent.success
        }),
        []
    );

    const smallBlindAmountStyle = useMemo(
        () => ({
            backgroundColor: hexToRgba(colors.ui.bgDark, 0.8),
            color: colors.brand.primary,
            borderColor: hexToRgba(colors.accent.success, 0.2)
        }),
        []
    );

    const bigBlindButtonStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.accent.success}, ${hexToRgba(colors.accent.success, 0.8)})`,
            borderColor: colors.accent.success
        }),
        []
    );

    const bigBlindAmountStyle = useMemo(
        () => ({
            backgroundColor: hexToRgba(colors.ui.bgDark, 0.8),
            color: colors.brand.primary,
            borderColor: hexToRgba(colors.accent.success, 0.2)
        }),
        []
    );

    const foldButtonDefaultStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.ui.bgMedium}, ${colors.ui.borderColor})`,
            borderColor: colors.ui.borderColor,
            color: "white"
        }),
        []
    );

    const foldButtonHoverStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.accent.danger}, ${hexToRgba(colors.accent.danger, 0.8)})`,
            borderColor: colors.accent.danger,
            boxShadow: `0 0 10px ${hexToRgba(colors.accent.danger, 0.4)}`
        }),
        []
    );

    const callButtonStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.ui.bgMedium}, ${colors.ui.bgDark})`,
            borderColor: colors.ui.borderColor,
            color: "white"
        }),
        []
    );

    const callButtonHoverStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.brand.primary}, ${hexToRgba(colors.brand.primary, 0.9)})`,
            borderColor: colors.brand.primary,
            boxShadow: `0 0 15px ${hexToRgba(colors.brand.primary, 0.2)}`
        }),
        []
    );

    const raiseButtonStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.ui.bgMedium}, ${colors.ui.bgDark})`,
            borderColor: colors.ui.borderColor,
            color: "white"
        }),
        []
    );

    const raiseButtonHoverStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.accent.glow}, ${hexToRgba(colors.accent.glow, 0.9)})`,
            borderColor: colors.accent.glow,
            boxShadow: `0 0 15px ${hexToRgba(colors.accent.glow, 0.2)}`
        }),
        []
    );

    const sliderButtonStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.ui.bgMedium}, ${colors.ui.bgDark})`,
            borderColor: colors.ui.borderColor,
            color: "white"
        }),
        []
    );

    const sliderButtonHoverStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.ui.bgDark}, ${colors.ui.bgMedium})`,
            borderColor: colors.accent.glow
        }),
        []
    );

    const inputFieldStyle = useMemo(
        () => ({
            backgroundColor: colors.ui.bgMedium,
            borderColor: isRaiseAmountInvalid ? colors.accent.danger : colors.ui.borderColor,
            color: isRaiseAmountInvalid ? colors.accent.danger : "white"
        }),
        [isRaiseAmountInvalid]
    );

    const minMaxTextStyle = useMemo(
        () => ({
            color: isRaiseAmountInvalid ? colors.accent.danger : colors.ui.textSecondary
        }),
        [isRaiseAmountInvalid]
    );

    const potButtonStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.ui.bgMedium}, ${colors.ui.bgDark})`,
            borderColor: colors.ui.borderColor,
            color: "white"
        }),
        []
    );

    const potButtonHoverStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.ui.bgDark}, ${colors.ui.bgMedium})`,
            borderColor: colors.accent.glow
        }),
        []
    );

    const allInButtonStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.ui.bgMedium}, ${colors.ui.bgDark})`,
            borderColor: colors.ui.borderColor,
            color: "white"
        }),
        []
    );

    const allInButtonHoverStyle = useMemo(
        () => ({
            background: `linear-gradient(to right, ${colors.accent.glow}, ${hexToRgba(colors.accent.glow, 0.9)})`,
            borderColor: colors.accent.glow
        }),
        []
    );

    // Memoize expensive computations
    const formattedSmallBlindAmount = useMemo(() => Number(ethers.formatUnits(smallBlindAction?.min || "0", 18)).toFixed(2), [smallBlindAction?.min]);
    const formattedBigBlindAmount = useMemo(() => Number(ethers.formatUnits(bigBlindAction?.min || "0", 18)).toFixed(2), [bigBlindAction?.min]);
    const formattedCallAmount = useMemo(() => callAmount.toFixed(2), [callAmount]);

    const formattedRaiseAmount = useMemo(
        () => getRaiseToAmount(gameState?.previousActions || [], currentRound, userAddress || "").toFixed(2),
        [gameState?.previousActions, currentRound, userAddress]
    );

    const formattedMaxBetAmount = useMemo(() => (hasBetAction ? maxBet.toFixed(2) : maxRaise.toFixed(2)), [hasBetAction, maxBet, maxRaise]);

    // Memoize event handlers to prevent re-renders
    const handleFoldMouseEnter = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.background = foldButtonHoverStyle.background;
            e.currentTarget.style.borderColor = foldButtonHoverStyle.borderColor;
            e.currentTarget.style.boxShadow = foldButtonHoverStyle.boxShadow || "none";
        },
        [foldButtonHoverStyle]
    );

    const handleFoldMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.background = foldButtonDefaultStyle.background;
            e.currentTarget.style.borderColor = foldButtonDefaultStyle.borderColor;
            e.currentTarget.style.boxShadow = "none";
        },
        [foldButtonDefaultStyle]
    );

    const handleCallMouseEnter = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.background = callButtonHoverStyle.background;
            e.currentTarget.style.borderColor = callButtonHoverStyle.borderColor;
            e.currentTarget.style.boxShadow = callButtonHoverStyle.boxShadow || "none";
        },
        [callButtonHoverStyle]
    );

    const handleCallMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.background = callButtonStyle.background;
            e.currentTarget.style.borderColor = callButtonStyle.borderColor;
            e.currentTarget.style.boxShadow = "none";
        },
        [callButtonStyle]
    );

    const handleRaiseMouseEnter = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!isRaiseAmountInvalid && isPlayerTurn) {
                e.currentTarget.style.background = raiseButtonHoverStyle.background;
                e.currentTarget.style.borderColor = raiseButtonHoverStyle.borderColor;
                e.currentTarget.style.boxShadow = raiseButtonHoverStyle.boxShadow || "none";
            }
        },
        [raiseButtonHoverStyle, isRaiseAmountInvalid, isPlayerTurn]
    );

    const handleRaiseMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.background = raiseButtonStyle.background;
            e.currentTarget.style.borderColor = raiseButtonStyle.borderColor;
            e.currentTarget.style.boxShadow = "none";
        },
        [raiseButtonStyle]
    );

    const handleSliderButtonMouseEnter = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.background = sliderButtonHoverStyle.background;
            e.currentTarget.style.borderColor = sliderButtonHoverStyle.borderColor;
        },
        [sliderButtonHoverStyle]
    );

    const handleSliderButtonMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.background = sliderButtonStyle.background;
            e.currentTarget.style.borderColor = sliderButtonStyle.borderColor;
        },
        [sliderButtonStyle]
    );

    const handlePotButtonMouseEnter = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.background = potButtonHoverStyle.background;
            e.currentTarget.style.borderColor = potButtonHoverStyle.borderColor;
        },
        [potButtonHoverStyle]
    );

    const handlePotButtonMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.background = potButtonStyle.background;
            e.currentTarget.style.borderColor = potButtonStyle.borderColor;
        },
        [potButtonStyle]
    );

    const handleAllInMouseEnter = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.background = allInButtonHoverStyle.background;
            e.currentTarget.style.borderColor = allInButtonHoverStyle.borderColor;
        },
        [allInButtonHoverStyle]
    );

    const handleAllInMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.background = potButtonStyle.background;
            e.currentTarget.style.borderColor = potButtonStyle.borderColor;
        },
        [potButtonStyle]
    );

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

    const handleRaiseChange = (delta: number) => {
        const currentRaiseAmount = raiseAmount || minRaise;

        if (delta === 0) {
            delta = getStep(); // Reset to minimum raise amount
        }

        const newRaiseAmount = currentRaiseAmount + delta;
        setRaiseAmount(newRaiseAmount);
    };

    // Min Raise Text Prefill
    useEffect(() => {
        if (hasRaiseAction && minRaise > 0) {
            setRaiseAmount(minRaise);
            setRaiseInputRaw(minRaise.toFixed(2));
        }
        if (hasBetAction && minBet > 0) {
            setRaiseAmount(minBet);
            setRaiseInputRaw(minBet.toFixed(2));
        }
    }, [hasRaiseAction, hasBetAction, minRaise, minBet]);

    // Handler functions for different actions - simplified
    const handlePostSmallBlind = async () => {
        if (!tableId) return;

        const smallBlindAmount = smallBlindAction?.min || gameOptions?.smallBlind;
        if (!smallBlindAmount) return;

        // Simple call - let errors bubble up naturally
        await postSmallBlind(tableId, smallBlindAmount);
    };

    const handlePostBigBlind = async () => {
        if (!tableId) return;

        const bigBlindAmount = bigBlindAction?.min || gameOptions?.bigBlind;
        if (!bigBlindAmount) return;

        // Simple call - let errors bubble up naturally
        await postBigBlind(tableId, bigBlindAmount);
    };

    const handleCheck = async () => {
        if (!tableId) {
            console.error("Table ID not available");
            return;
        }

        try {
            await checkHand(tableId);
        } catch (error: any) {
            console.error("Failed to check:", error);
        }
    };

    const handleFold = async () => {
        if (!tableId) {
            console.error("Table ID not available");
            return;
        }

        try {
            await foldHand(tableId);
        } catch (error: any) {
            console.error("Failed to fold:", error);
        }
    };

    const handleCall = async () => {
        if (!tableId) {
            console.error("Private key or table ID not available");
            return;
        }

        if (callAction) {
            try {
                // Use our function to bet with the current raiseAmount
                const amountWei = ethers.parseUnits(callAmount.toString(), 18).toString();
                await callHand(tableId, amountWei);
            } catch (error: any) {
                console.error("Failed to call:", error);
            }
        } else {
            console.error("Call action not available");
        }
    };

    const handleBet = async () => {
        if (!tableId) {
            console.error("Table ID not available");
            return;
        }

        // Use our function to bet with the current raiseAmount
        const amountWei = ethers.parseUnits(raiseAmount.toString(), 18).toString();

        try {
            await betHand(tableId, amountWei);
        } catch (error: any) {
            console.error("Failed to bet:", error);
        }
    };

    const handleRaise = async () => {
        if (!tableId) {
            console.error("Table ID not available");
            return;
        }

        // Use our function to raise with the current raiseAmount
        const amountWei = ethers.parseUnits(raiseAmount.toString(), 18).toString();

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

    // // Handler for muck action
    // const handleMuck = async () => {
    //     if (!tableId) {
    //         console.error("Table ID not available");
    //         return;
    //     }

    //     try {
    //         await muckCards(tableId);
    //     } catch (error: any) {
    //         console.error("Failed to muck cards:", error);
    //     }
    // };

    // // Handler for show action
    // const handleShow = async () => {
    //     if (!tableId) {
    //         console.error("Table ID not available");
    //         return;
    //     }

    //     try {
    //         await showCards(tableId);
    //     } catch (error: any) {
    //         console.error("Failed to show cards:", error);
    //     }
    // };

    // // Handler for deal action
    // const handleDeal = async () => {
    //     if (!tableId) {
    //         console.error("Table ID not available");
    //         return;
    //     }

    //     try {
    //         await dealCards(tableId);
    //         console.log("Deal completed successfully");
    //     } catch (error: any) {
    //         console.error("Failed to deal:", error);
    //     }
    // };

    // // Add the handleStartNewHand function after the other handler functions
    // const handleStartNewHand = async () => {
    //     if (!tableId) return;

    //     // Simple call - let errors bubble up naturally
    //     await startNewHand(tableId);
    // };

    // Check if player is sitting out
    const isPlayerSittingOut = useMemo(() => userPlayer?.status === PlayerStatus.SITTING_OUT, [userPlayer]);

    // Auto-deal logic: Automatically deal when DEAL action is available for current user
    // useEffect(() => {
    //     // Early return if it's not the user's turn - no need to check anything else
    //     if (!isCurrentUserTurn) {
    //         return;
    //     }

    //     // Only proceed if we have the necessary data
    //     if (!legalActions || !dealCards || isDealing || attemptToAutoDeal.current) {
    //         return;
    //     }

    //     // Check if DEAL action is available in legal actions
    //     const hasDealAction = legalActions.some(action => action.action === NonPlayerActionType.DEAL);

    //     if (hasDealAction) {
    //         // Set flag to prevent multiple attempts
    //         attemptToAutoDeal.current = true;

    //         // Small delay to ensure state is settled before dealing
    //         const dealTimeout = setTimeout(() => {
    //             dealCards()
    //                 .then(() => {
    //                     console.log("✅ Auto-deal completed successfully");
    //                 })
    //                 .catch(error => {
    //                     console.error("❌ Auto-deal failed:", error);
    //                 })
    //                 .finally(() => {
    //                     // Reset flag after attempt
    //                     attemptToAutoDeal.current = false;
    //                 });
    //         }, 100);

    //         // Cleanup timeout if component unmounts or dependencies change
    //         return () => {
    //             clearTimeout(dealTimeout);
    //             attemptToAutoDeal.current = false;
    //         };
    //     }
    // }, [dealCards, isCurrentUserTurn, isDealing, legalActions]); // Reduced dependencies - only what we actually need

    return (
        <div className="fixed bottom-12 lg:bottom-1 left-0 right-0 text-white p-2 lg:p-1 pb-4 lg:pb-1 flex justify-center items-center relative">
            <div className="flex flex-col w-full lg:w-[850px] mx-4 lg:mx-0 space-y-2 lg:space-y-3 justify-center rounded-lg relative z-10">
                {/* Deal Button - Show above other buttons when available */}
                {shouldShowDealButton && (
                    <div className="flex justify-center mb-2 lg:mb-3">
                        <button
                            onClick={() => handleDeal(tableId)}
                            className="text-white font-bold py-2 lg:py-3 px-6 lg:px-8 rounded-lg shadow-md text-sm lg:text-base
                            backdrop-blur-sm transition-all duration-300 
                            flex items-center justify-center gap-2 transform hover:scale-105"
                            style={dealButtonStyle}
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
                {currentRound === TexasHoldemRound.END && (
                    <div className="flex justify-center mb-2 lg:mb-3">
                        <button
                            onClick={() => handleStartNewHand(tableId)}
                            className="text-white font-bold py-2 lg:py-3 px-6 lg:px-8 rounded-lg shadow-lg text-sm lg:text-base
                            border-2 transition-all duration-300 
                            flex items-center justify-center gap-2 transform hover:scale-105"
                            style={newHandButtonStyle}
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
                            className="text-white font-bold py-2 lg:py-3 px-6 lg:px-8 rounded-lg shadow-lg text-sm lg:text-base
                            border-2 transition-all duration-300 
                            flex items-center justify-center gap-2 transform hover:scale-105"
                            style={muckButtonStyle}
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
                            className="text-white font-bold py-2 lg:py-3 px-6 lg:px-8 rounded-lg shadow-lg text-sm lg:text-base
                            border-2 transition-all duration-300 
                            flex items-center justify-center gap-2 transform hover:scale-105"
                            style={showButtonStyle}
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
                        <div className="flex justify-center items-center gap-1 lg:gap-2">
                            {showSmallBlindButton && playerStatus !== PlayerStatus.FOLDED && (
                                <button
                                    onClick={handlePostSmallBlind}
                                    className="text-white font-medium py-1.5 lg:py-2 px-2 lg:px-4 rounded-lg shadow-md transition-all duration-200 text-xs lg:text-sm
                                    border flex items-center transform hover:scale-105 mr-1 lg:mr-2"
                                    style={smallBlindButtonStyle}
                                >
                                    <span className="mr-1">Post Small Blind</span>
                                    <span className="backdrop-blur-sm px-1 lg:px-2 py-1 rounded text-xs border" style={smallBlindAmountStyle}>
                                        ${formattedSmallBlindAmount}
                                    </span>
                                </button>
                            )}

                            {showBigBlindButton && playerStatus !== PlayerStatus.FOLDED && (
                                <button
                                    onClick={handlePostBigBlind}
                                    className="text-white font-medium py-1.5 lg:py-2 px-2 lg:px-4 rounded-lg shadow-md transition-all duration-200 text-xs lg:text-sm
                                    border flex items-center transform hover:scale-105 mr-1 lg:mr-2"
                                    style={bigBlindButtonStyle}
                                >
                                    <span className="mr-1">Post Big Blind</span>
                                    <span className="backdrop-blur-sm px-1 lg:px-2 py-1 rounded text-xs border" style={bigBlindAmountStyle}>
                                        ${formattedBigBlindAmount}
                                    </span>
                                </button>
                            )}
                            {canFoldAnytime && (!showActionButtons || showSmallBlindButton || showBigBlindButton) && (
                                <button
                                    className="cursor-pointer active:scale-105
px-3 lg:px-6 py-1.5 lg:py-2 rounded-lg border text-xs lg:text-sm
transition-all duration-200 font-medium min-w-[80px] lg:min-w-[100px]"
                                    style={foldButtonDefaultStyle}
                                    onMouseEnter={handleFoldMouseEnter}
                                    onMouseLeave={handleFoldMouseLeave}
                                    onClick={handleFold}
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
                                <div className="flex justify-between gap-1 lg:gap-2">
                                    {canFoldAnytime && (
                                        <button
                                            className="cursor-pointer active:scale-105
px-3 lg:px-6 py-1.5 lg:py-2 rounded-lg border text-xs lg:text-sm
transition-all duration-200 font-medium min-w-[80px] lg:min-w-[100px]"
                                            style={foldButtonDefaultStyle}
                                            onMouseEnter={handleFoldMouseEnter}
                                            onMouseLeave={handleFoldMouseLeave}
                                            onClick={handleFold}
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
                                            className="cursor-pointer bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#1e3a8a]/90 hover:to-[#1e40af]/90 active:from-[#1e40af] active:to-[#2563eb]
                                            px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg w-full border border-[#3a546d] hover:border-[#1e3a8a]/50 active:border-[#3b82f6]/70 shadow-md backdrop-blur-sm text-xs lg:text-sm
                                            transition-all duration-200 font-medium transform active:scale-105 active:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                            onClick={handleCheck}
                                        >
                                            CHECK
                                        </button>
                                    )}
                                    {hasCallAction && (
                                        <button
                                            className="cursor-pointer px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg w-full border shadow-md backdrop-blur-sm text-xs lg:text-sm
                                            transition-all duration-200 font-medium transform active:scale-105"
                                            style={callButtonStyle}
                                            onMouseEnter={handleCallMouseEnter}
                                            onMouseLeave={handleCallMouseLeave}
                                            onClick={handleCall}
                                        >
                                            CALL <span style={{ color: colors.brand.primary }}>${formattedCallAmount}</span>
                                        </button>
                                    )}
                                    {(hasRaiseAction || hasBetAction) && (
                                        <button
                                            onClick={hasRaiseAction ? handleRaise : handleBet}
                                            disabled={isRaiseAmountInvalid || !isPlayerTurn}
                                            className={`${
                                                isRaiseAmountInvalid || !isPlayerTurn ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"
                                            } px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg w-full border shadow-md backdrop-blur-sm text-xs lg:text-sm
    transition-all duration-200 font-medium`}
                                            style={raiseButtonStyle}
                                            onMouseEnter={handleRaiseMouseEnter}
                                            onMouseLeave={handleRaiseMouseLeave}
                                        >
                                            {hasRaiseAction ? "RAISE TO" : "BET"}{" "}
                                            <span style={{ color: colors.brand.primary }}>${formatBalance(raiseActionAmount)}</span>
                                        </button>
                                    )}
                                </div>

                                {/* Only show slider and betting options if player can bet or raise */}
                                {(hasBetAction || hasRaiseAction) && (
                                    <>
                                        {/* Slider and Controls */}
                                        <div className="flex items-center space-x-2 lg:space-x-4 bg-[#0f172a40] backdrop-blur-sm p-2 lg:p-3 rounded-lg border border-[#3a546d]/50 shadow-inner">
                                            <button
                                                className="py-1 px-2 lg:px-4 rounded-lg border text-xs lg:text-sm transition-all duration-200"
                                                style={sliderButtonStyle}
                                                onMouseEnter={handleSliderButtonMouseEnter}
                                                onMouseLeave={handleSliderButtonMouseLeave}
                                                // onClick={() => handleRaiseChange(Math.max(getRaiseToAmount() - step, hasBetAction ? minBet : minRaise))}
                                                onClick={() => handleRaiseChange(-getStep())}
                                                disabled={!isPlayerTurn}
                                            >
                                                -
                                            </button>

                                            {/* Slider with dynamic fill */}
                                            <input
                                                type="range"
                                                min={hasBetAction ? raiseActionAmount : minRaise}
                                                max={hasBetAction ? maxBet : maxRaise}
                                                step={step}
                                                value={raiseActionAmount}
                                                onChange={e => {
                                                    handleRaiseChange(Number(e.target.value));
                                                    setLastAmountSource("slider");
                                                }}
                                                className="flex-1 accent-[#64ffda] h-2 rounded-full transition-all duration-200"
                                                style={{
                                                    background: `linear-gradient(to right, #64ffda 0%, #64ffda ${
                                                        ((raiseActionAmount - (hasBetAction ? minBet : minRaise)) /
                                                            ((raiseActionAmount ? maxBet : maxRaise) - (hasBetAction ? minBet : minRaise))) *
                                                        100
                                                    }%, #1e293b ${
                                                        ((raiseActionAmount - (hasBetAction ? minBet : minRaise)) /
                                                            ((hasBetAction ? maxBet : maxRaise) - (hasBetAction ? minBet : minRaise))) *
                                                        100
                                                    }%, #1e293b 100%)`
                                                }}
                                                disabled={!isPlayerTurn}
                                            />
                                            <button
                                                className="py-1 px-2 lg:px-4 rounded-lg border text-xs lg:text-sm transition-all duration-200"
                                                style={sliderButtonStyle}
                                                onMouseEnter={handleSliderButtonMouseEnter}
                                                onMouseLeave={handleSliderButtonMouseLeave}
                                                // onClick={() => handleRaiseChange(Math.min(getRaiseToAmount() + step, hasBetAction ? maxBet : maxRaise))}
                                                onClick={() => handleRaiseChange(getStep())}
                                                disabled={!isPlayerTurn}
                                            >
                                                +
                                            </button>

                                            {/* Inline Input Box and Min/Max */}
                                            <div className="flex flex-col items-end gap-1 w-[100px] lg:w-[120px]">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={formattedRaiseAmount}
                                                    onChange={e => {
                                                        const raw = e.target.value;

                                                        // Always allow clearing the field
                                                        if (raw === "") {
                                                            setRaiseInputRaw("");
                                                            // setRaiseToAmount(0);
                                                            setRaiseAmount(0);
                                                            return;
                                                        }

                                                        // Allow typing incomplete decimals like "2.", "2.0", or "2.08"
                                                        if (/^\d*\.?\d{0,2}$/.test(raw)) {
                                                            setRaiseInputRaw(raw);

                                                            // Only parse if it's a valid number (e.g. "2", "2.0", "2.08")
                                                            if (!isNaN(Number(raw)) && /^\d*\.?\d{1,2}$/.test(raw)) {
                                                                // setRaiseToAmount(parseFloat(raw));
                                                                setRaiseAmount(parseFloat(raw));
                                                                setLastAmountSource("input");
                                                            }
                                                        }
                                                    }}
                                                    className="px-1 lg:px-2 py-1 rounded text-xs lg:text-sm w-full transition-all duration-200 border"
                                                    style={inputFieldStyle}
                                                    disabled={!isPlayerTurn}
                                                />

                                                <div className="text-[8px] lg:text-[10px] w-full text-right leading-snug" style={minMaxTextStyle}>
                                                    <div>Min: ${formattedRaiseAmount}</div>
                                                    <div>Max: ${formattedMaxBetAmount}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Additional Options */}
                                        <div className="flex justify-between gap-1 lg:gap-2 mb-1">
                                            <button
                                                className="px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs
                                                transition-all duration-200 transform hover:scale-105"
                                                style={potButtonStyle}
                                                onMouseEnter={handlePotButtonMouseEnter}
                                                onMouseLeave={handlePotButtonMouseLeave}
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
                                                className="px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs
                                                transition-all duration-200 transform hover:scale-105"
                                                style={potButtonStyle}
                                                onMouseEnter={handlePotButtonMouseEnter}
                                                onMouseLeave={handlePotButtonMouseLeave}
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
                                                className="px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs
                                                transition-all duration-200 transform hover:scale-105"
                                                style={potButtonStyle}
                                                onMouseEnter={handlePotButtonMouseEnter}
                                                onMouseLeave={handlePotButtonMouseLeave}
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
                                                className="px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs
                                                transition-all duration-200 transform hover:scale-105"
                                                style={potButtonStyle}
                                                onMouseEnter={handlePotButtonMouseEnter}
                                                onMouseLeave={handlePotButtonMouseLeave}
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
                                                className="px-1 lg:px-2 py-1 lg:py-1.5 rounded-lg w-full border shadow-md text-[10px] lg:text-xs
                                                transition-all duration-200 font-medium transform active:scale-105"
                                                style={allInButtonStyle}
                                                onMouseEnter={handleAllInMouseEnter}
                                                onMouseLeave={handleAllInMouseLeave}
                                                onClick={() => {
                                                    const newAmt = hasBetAction ? maxBet : maxRaise;
                                                    handleRaiseChange(newAmt);
                                                    setLastAmountSource("button");
                                                }}
                                                disabled={!isPlayerTurn}
                                            >
                                                ALL-IN
                                            </button>
                                            {/* COMMENTED OUT - Time extension button disabled
                                            {canExtend && isUsersTurn && (
                                                <button
                                                    onClick={handleExtendTimeFromFooter}
                                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600
                                                    px-2 py-1.5 rounded-lg w-full border border-blue-400 hover:border-blue-300 shadow-md
                                                    transition-all duration-200 text-xs font-medium transform hover:scale-105 flex items-center justify-center gap-1"
                                                >
                                                    <svg 
                                                        className="w-3 h-3 text-white" 
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle cx="12" cy="12" r="8" strokeWidth="2"/>
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"/>
                                                        <circle cx="18" cy="6" r="3" fill="currentColor"/>
                                                        <path stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 6h2M18 5v2"/>
                                                    </svg>
                                                    +{timeoutDuration}s
                                                </button>
                                            )}
                                            */}
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
});

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
