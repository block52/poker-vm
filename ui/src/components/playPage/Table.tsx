/**
 * Table Component
 *
 * This is the main poker table component that orchestrates the entire game interface.
 * It manages:
 * - Player positions and rotations
 * - Game state and progress
 * - Community cards
 * - Pot amounts
 * - Dealer button
 * - Player actions
 *
 * Key Features:
 * - Dynamic table layout (6 or 9 players)
 * - Real-time game state updates
 * - Player position management
 * - Chip position calculations
 * - Winner animations
 * - Sidebar for game log
 *
 * Player Components:
 * - Player: Current user's view with hole cards and controls
 * - OppositePlayer: Other players' views with seat changing functionality
 * - VacantPlayer: Empty seat views with direct join/seat changing
 *
 * PlayerPopUpCard Integration:
 * - Used by OppositePlayer for seat changing
 * - Used by VacantPlayer for seat changing (only when user is already seated)
 * - Provides consistent UI for player interactions
 *
 * State Management:
 * - Uses multiple hooks for different aspects of the game
 * - Manages player positions and rotations
 * - Handles game progress and round information
 * - Controls UI elements visibility
 *
 * Components Used:
 * - Player: Current user's view
 * - OppositePlayer: Other players' views
 * - VacantPlayer: Empty seat views
 * - PlayerPopUpCard: Popup for player actions
 * - PokerActionPanel: Betting controls
 * - ActionsLog: Game history
 */

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
// Position arrays now come from useTableLayout hook
// // Position arrays now come from useTableLayout hook
// import { playerPosition, dealerPosition, vacantPlayerPosition } from "../../utils/PositionArray";
import PokerActionPanel from "../Footer";
import ActionsLog from "../ActionsLog";
import OppositePlayerCards from "./Card/OppositePlayerCards";

import VacantPlayer from "./Players/VacantPlayer";
import OppositePlayer from "./Players/OppositePlayer";
import Player from "./Players/Player";

import Chip from "./common/Chip";
import TurnAnimation from "./Animations/TurnAnimation";
import WinAnimation from "./Animations/WinAnimation";
import { LuPanelLeftOpen } from "react-icons/lu";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import defaultLogo from "../../assets/YOUR_CLUB.png";
import { colors, getTableHeaderGradient, getHexagonStroke, hexToRgba } from "../../utils/colorConfig";

// Use environment variable for club logo with fallback to default
const clubLogo = import.meta.env.VITE_CLUB_LOGO || defaultLogo;
const clubName = import.meta.env.VITE_CLUB_NAME || "Block 52";
const _randomSeat = import.meta.env.VITE_RANDOM_SEAT === "true" ? true : false;

import { LuPanelLeftClose } from "react-icons/lu";
import { useParams } from "react-router-dom";
import { RxExit } from "react-icons/rx";
import { FaCopy } from "react-icons/fa";
import React from "react";
import { formatWeiToSimpleDollars, formatWeiToUSD } from "../../utils/numberUtils";

import { ethers } from "ethers";

import "./Table.css"; // Import the Table CSS file

//// TODO get these hooks to subscribe to the wss connection

// 1. Core Data Providers
import { useTableData } from "../../hooks/useTableData"; // Used to create tableActivePlayers (filtered players), Contains seat numbers, addresses, and player statuses
import { usePlayerSeatInfo } from "../../hooks/usePlayerSeatInfo"; // Provides currentUserSeat - the current user's seat position and userDataBySeat - object for direct seat-to-player lookup
import { useNextToActInfo } from "../../hooks/useNextToActInfo";

//2. Visual Position/State Providers
import { useChipPositions } from "../../hooks/useChipPositions";
import { usePlayerChipData } from "../../hooks/usePlayerChipData";

//3. Game State Providers
import { useTableState } from "../../hooks/useTableState"; //Provides currentRound, formattedTotalPot, tableSize, tableSize determines player layout (6 vs 9 players)
import { useGameProgress } from "../../hooks/useGameProgress"; //Provides isGameInProgress - whether a hand is active

//todo wire up to use the sdk instead of the proxy
// 4. Player Actions
import { leaveTable } from "../../hooks/playerActions/leaveTable";

// 5. Winner Info
import { useWinnerInfo } from "../../hooks/useWinnerInfo"; // Provides winner information for animations
import { useGameResults } from "../../hooks/useGameResults"; // Game results display

// other
import { usePlayerLegalActions } from "../../hooks/playerActions/usePlayerLegalActions";
import { useGameOptions } from "../../hooks/useGameOptions";
import { getAccountBalance, getPublicKey, getFormattedAddress } from "../../utils/b52AccountUtils";
import { handleSitOut, handleSitIn } from "../common/actionHandlers";
import { hasAction } from "../../utils/actionUtils";
import { PositionArray } from "../../types/index";
import { useGameStateContext } from "../../context/GameStateContext";
import { PlayerDTO } from "@bitcoinbrisbane/block52";
import LiveHandStrengthDisplay from "./LiveHandStrengthDisplay";

// Game Start Countdown
import GameStartCountdown from "./common/GameStartCountdown";
import SitAndGoAutoJoinModal from "./SitAndGoAutoJoinModal";
import { useGameStartCountdown } from "../../hooks/useGameStartCountdown";

// Table Layout Configuration
import { useTableLayout } from "../../hooks/useTableLayout";
import { useVacantSeatData } from "../../hooks/useVacantSeatData";
import { getViewportMode } from "../../config/tableLayoutConfig";

//* Here's the typical sequence of a poker hand:
//* ANTE - Initial forced bets
//* PREFLOP - Players get their hole cards, betting round
//* FLOP - First 3 community cards dealt, betting round
//* TURN - Fourth community card dealt, betting round
//* RIVER - Final community card dealt, final betting round
//* SHOWDOWN - Players show their cards to determine winner

//* Define the interface for the position object

interface NetworkDisplayProps {
    isMainnet?: boolean;
}

// Memoize the NetworkDisplay component
const NetworkDisplay = memo(({ isMainnet = false }: NetworkDisplayProps) => {
    const networkStyle = useMemo(
        () => ({
            backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
            border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
        }),
        []
    );

    const dotStyle = useMemo(() => (!isMainnet ? { backgroundColor: colors.brand.primary } : {}), [isMainnet]);

    return (
        <div className="flex items-center gap-1 sm:gap-1.5 px-1 sm:px-2 py-1 rounded-lg text-[10px] sm:text-xs" style={networkStyle}>
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isMainnet ? "bg-green-500" : ""}`} style={dotStyle}></div>
            <span className="text-gray-300 whitespace-nowrap">Block52 Chain</span>
        </div>
    );
});

NetworkDisplay.displayName = "NetworkDisplay";

// Memoize TurnAnimation
const MemoizedTurnAnimation = React.memo(TurnAnimation);

const Table = React.memo(() => {
    const { id } = useParams<{ id: string }>();
    // Game state context and subscription
    const { subscribeToTable, gameState } = useGameStateContext();
    useEffect(() => {
        if (id) {
            subscribeToTable(id);
        }
    }, [id, subscribeToTable]);

    // Game Start Countdown
    const { gameStartTime, showCountdown, handleCountdownComplete, handleSkipCountdown } = useGameStartCountdown();

    // Track viewport mode for debugging
    const [viewportMode, setViewportMode] = useState(getViewportMode());

    const [accountBalance, setAccountBalance] = useState<string>("0");
    const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(true);
    const [, setBalanceError] = useState<Error | null>(null);
    const publicKey = getPublicKey();

    // Update to use the imported hook
    const tableDataValues = useTableData();
    const { isUserAlreadyPlaying } = useVacantSeatData();

    // invoke hook for seat loop
    const { winnerInfo } = useWinnerInfo();

    // Zoom is now handled by the table layout configuration
    // const calculateZoom = useCallback(() => { ... }, []);

    // Function to fetch account balance
    const fetchAccountBalance = useCallback(async () => {
        try {
            setIsBalanceLoading(true);
            setBalanceError(null);

            const balance = await getAccountBalance();
            setAccountBalance(balance);
        } catch (err) {
            console.error("Error fetching account balance:", err);
            setBalanceError(err instanceof Error ? err : new Error("Failed to fetch balance"));
        } finally {
            setIsBalanceLoading(false);
        }
    }, []);

    // Fetch balance once on page load
    useEffect(() => {
        if (publicKey) {
            fetchAccountBalance();
        }
    }, [publicKey, fetchAccountBalance]);

    // Manual balance refresh function for after key actions
    const updateBalanceOnPlayerJoin = useCallback(() => {
        if (publicKey) {
            fetchAccountBalance();
        }
    }, [publicKey, fetchAccountBalance]);

    // Zoom is now managed by useTableLayout hook
    const [openSidebar, setOpenSidebar] = useState(false);
    const [isCardVisible, setCardVisible] = useState(-1);

    // Use the hook directly instead of getting it from context
    const { legalActions: playerLegalActions } = usePlayerLegalActions();

    // Check if sit out/sit in actions are available
    const hasSitOutAction = hasAction(playerLegalActions, PlayerActionType.SIT_OUT);
    const hasSitInAction = hasAction(playerLegalActions, PlayerActionType.SIT_IN);

    // Add the usePlayerSeatInfo hook
    const { currentUserSeat } = usePlayerSeatInfo();

    // Add the useNextToActInfo hook
    const {
        seat: nextToActSeat,
        player: _nextToActPlayer,
        isCurrentUserTurn,
        availableActions: _nextToActAvailableActions,
        timeRemaining: _timeRemaining
    } = useNextToActInfo(id);

    // Add the useTableState hook to get table state properties
    const { tableSize } = useTableState();

    // Use the table layout configuration system (only 4 and 9 players supported)
    // TODO: Add support for 2, 3, 5, 6, 7, 8 player tables - positions need to be configured in tableLayoutConfig.ts
    const tableLayout = useTableLayout((tableSize as 4 | 9) || 9);

    // Add the useGameProgress hook
    const { isGameInProgress, handNumber, actionCount, nextToAct } = useGameProgress(id);

    // Add the useGameOptions hook
    const { gameOptions } = useGameOptions();

    // Add the useGameResults hook
    const { results } = useGameResults();

    // Memoize formatted values
    const formattedValues = useMemo(
        () => ({
            smallBlindFormatted: gameOptions ? formatWeiToSimpleDollars(gameOptions.smallBlind) : "0.10",
            bigBlindFormatted: gameOptions ? formatWeiToSimpleDollars(gameOptions.bigBlind) : "0.20"
        }),
        [gameOptions]
    );

    // Memoize all inline styles to prevent re-renders
    const headerStyle = useMemo(
        () => ({
            background: getTableHeaderGradient(),
            borderColor: colors.table.borderColor
        }),
        []
    );

    const _networkDisplayStyle = useMemo(
        () => ({
            backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
            border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
        }),
        []
    );

    const walletInfoStyle = useMemo(
        () => ({
            backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
            border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
        }),
        []
    );

    const balanceIconStyle = useMemo(
        () => ({
            backgroundColor: hexToRgba(colors.brand.primary, 0.2)
        }),
        []
    );

    const depositButtonStyle = useMemo(
        () => ({
            backgroundColor: colors.ui.bgMedium,
            borderColor: hexToRgba(colors.brand.primary, 0.3),
            color: colors.brand.primary
        }),
        []
    );

    const subHeaderStyle = useMemo(
        () => ({
            background: getTableHeaderGradient()
        }),
        []
    );

    const sidebarToggleStyle = useMemo(
        () => ({
            backgroundColor: openSidebar ? hexToRgba(colors.brand.primary, 0.3) : "transparent",
            color: openSidebar ? "white" : colors.brand.primary
        }),
        [openSidebar]
    );

    const tableBoxShadowStyle = useMemo(
        () => ({
            boxShadow: `0 7px 15px ${hexToRgba("#000000", 0.6)}`
        }),
        []
    );

    // ============================================================
    // TABLE ROTATION SYSTEM - COMPREHENSIVE DOCUMENTATION
    // ============================================================
    //
    // OVERVIEW:
    // The rotation system allows the poker table view to rotate, changing which
    // seat appears at the bottom (traditional "hero" position in poker UIs).
    // This is controlled by a single variable: startIndex
    //
    // KEY CONCEPTS:
    // - UI Position: The visual position on screen (0 = bottom, 1 = left, 2 = top, etc.)
    // - Seat Number: The actual seat at the table (1, 2, 3, 4, etc.)
    // - startIndex: The offset that determines the rotation
    //
    // HOW IT WORKS:
    // The formula: seatNumber = ((uiPosition + startIndex) % tableSize) + 1
    //
    // Example with 4 players:
    // - startIndex = 0: No rotation
    //   UI Pos 0 shows Seat 1 (bottom)
    //   UI Pos 1 shows Seat 2 (left)
    //   UI Pos 2 shows Seat 3 (top)
    //   UI Pos 3 shows Seat 4 (right)
    //
    // - startIndex = 1: Rotate by 1 (Seat 2 at bottom)
    //   UI Pos 0 shows Seat 2 (bottom)
    //   UI Pos 1 shows Seat 3 (left)
    //   UI Pos 2 shows Seat 4 (top)
    //   UI Pos 3 shows Seat 1 (right)
    //
    // ROTATION CONTROLS:
    // - ← Rotate: Increases startIndex, rotates seats CLOCKWISE
    //   From default (0): goes to 1 → Seat 4 moves to bottom, Seat 1 moves to left
    // - Rotate →: Decreases startIndex, rotates seats COUNTER-CLOCKWISE
    //   From default (0): goes to 3 → Seat 2 moves to bottom, Seat 1 moves to right
    // - Reset (startIndex = 0): Returns to default view (Seat 1 at bottom)
    //
    // WHERE ROTATION IS APPLIED:
    // 1. In getComponentToRender() function (line ~570)
    //    - Calculates which seat should appear at each UI position
    //    - Formula: seatNumber = ((positionIndex + startIndex) % tableSize) + 1
    //
    // 2. In the render loop (line ~1000)
    //    - Uses tableLayout.positions.players (NOT pre-rotated)
    //    - Passes positionIndex to getComponentToRender
    //    - Rotation happens inside getComponentToRender
    //
    // IMPORTANT: Rotation happens ONLY ONCE in getComponentToRender()
    // We don't pre-rotate arrays to avoid double rotation

    const [seat] = useState<number>(0);
    const [startIndex, setStartIndex] = useState<number>(0); // Controls table rotation (0 = no rotation)

    // Log rotation changes for debugging
    useEffect(() => {
        console.log(`🔄 TABLE ROTATION - startIndex changed to ${startIndex}, rotating view by ${startIndex} positions`);
    }, [startIndex]);

    const [currentIndex, setCurrentIndex] = useState<number>(1);

    // Add the useChipPositions hook AFTER startIndex is defined
    const { chipPositionArray: _chipPositionArray } = useChipPositions(startIndex);

    // Add the usePlayerChipData hook
    const { getChipAmount } = usePlayerChipData();

    // Memoize user wallet address using utility function
    const userWalletAddress = useMemo(() => {
        const storedAddress = getPublicKey();
        return storedAddress ? storedAddress.toLowerCase() : null;
    }, []);

    // Use utility function for formatted address
    const formattedAddress = getFormattedAddress();

    // Memoize table active players
    const tableActivePlayers = useMemo(() => {
        const activePlayers = tableDataValues.tableDataPlayers?.filter((player: PlayerDTO) => player.address !== ethers.ZeroAddress) ?? [];

        // Debug logging for seat mapping
        console.log(
            "🎲 TABLE - Active Players Mapping: " +
                JSON.stringify(
                    {
                        totalPlayers: activePlayers.length,
                        currentUserAddress: userWalletAddress,
                        currentUserSeat: currentUserSeat,
                        players: activePlayers.map((p: PlayerDTO) => ({
                            seat: p.seat,
                            address: p.address,
                            stack: p.stack,
                            status: p.status,
                            lastAction: p.lastAction,
                            sumOfBets: p.sumOfBets
                        }))
                    },
                    null,
                    2
                )
        );

        return activePlayers;
    }, [tableDataValues.tableDataPlayers, userWalletAddress, currentUserSeat]);

    // Optimize window width detection - only check on resize
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 414);
    const [isMobileLandscape, setIsMobileLandscape] = useState(
        window.innerWidth <= 1024 && window.innerWidth > window.innerHeight && window.innerHeight <= 600
    );

    // Update viewport mode on window resize
    useEffect(() => {
        const handleResize = () => {
            setViewportMode(getViewportMode());
            setIsMobile(window.innerWidth <= 414);
            setIsMobileLandscape(window.innerWidth <= 1024 && window.innerWidth > window.innerHeight && window.innerHeight <= 600);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // 🔧 PERFORMANCE FIX: Disabled mouse tracking to prevent hundreds of re-renders
    // Mouse tracking was causing setMousePosition({ x, y }) on every mouse move
    // which created new objects and triggered excessive re-renders
    // useEffect(() => {
    //     // Mouse tracking disabled for performance
    // }, []);

    // Legacy seat effect (can be removed if not used)
    useEffect(() => (seat ? setStartIndex(seat) : setStartIndex(0)), [seat]);

    // AUTO-ROTATION: Automatically rotate table when user joins
    // This ensures the current user always appears at the bottom position
    // DISABLED FOR NOW - uncomment to enable auto-rotation
    // useEffect(() => {
    //     if (currentUserSeat > 0) {
    //         // Calculate rotation needed to put current user at bottom
    //         // Position 0 is bottom, so we need to rotate by (userSeat - 1)
    //         const rotationNeeded = currentUserSeat - 1;
    //
    //         console.log(`🎯 AUTO-ROTATION: User is at seat ${currentUserSeat}, rotating by ${rotationNeeded} to put them at bottom`);
    //         setStartIndex(rotationNeeded);
    //     }
    // }, [currentUserSeat]);

    // Memoize reordered arrays using positions from tableLayout
    const _reorderedPlayerArray = useMemo(() => {
        const positions = tableLayout.positions.players || [];
        return [...positions.slice(startIndex), ...positions.slice(0, startIndex)];
    }, [tableLayout.positions.players, startIndex]);

    const _reorderedDealerArray = useMemo(() => {
        const positions = tableLayout.positions.dealers || [];
        return [...positions.slice(startIndex), ...positions.slice(0, startIndex)];
    }, [tableLayout.positions.dealers, startIndex]);

    // Winner animations
    const hasWinner = Array.isArray(winnerInfo) && winnerInfo.length > 0;

    // Restore the useEffect for the timer
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentIndex((prevIndex: number) => {
                if (prevIndex === 2) {
                    // Handle case where prevIndex is 2 (e.g., no change or custom logic)
                    return prevIndex + 2; // For example, keep it the same
                }
                if (prevIndex === 4) {
                    // If prevIndex is 4, increment by 2
                    return prevIndex + 2;
                }
                if (prevIndex === 9) {
                    // If prevIndex is 4, increment by 2
                    return prevIndex - 8;
                } else {
                    // Otherwise, just increment by 1
                    return prevIndex + 1;
                }
            });
        }, 30000);

        // Cleanup the timer on component unmount
        return () => clearTimeout(timer);
    }, [currentIndex]);

    // Memoize handlers
    const handleResize = useCallback(() => {
        // Add a small delay for orientation changes to ensure dimensions are updated
        setTimeout(() => {
            tableLayout.refreshLayout();
            setIsMobile(window.innerWidth <= 414);
            setIsMobileLandscape(window.innerWidth <= 1024 && window.innerWidth > window.innerHeight && window.innerHeight <= 600);
        }, 100);
    }, [tableLayout]);

    useEffect(() => {
        window.addEventListener("resize", handleResize);
        window.addEventListener("orientationchange", handleResize);

        // Also listen for the modern screen orientation API
        if (screen.orientation) {
            screen.orientation.addEventListener("change", handleResize);
        }

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("orientationchange", handleResize);
            if (screen.orientation) {
                screen.orientation.removeEventListener("change", handleResize);
            }
        };
    }, [handleResize]);

    // Position arrays are now managed by useTableLayout hook
    // useEffect(() => { ... }, [tableSize, id]);

    const onCloseSideBar = useCallback(() => {
        setOpenSidebar(!openSidebar);
    }, [openSidebar]);

    // Memoize formatted balance
    const balanceFormatted = useMemo(() => (accountBalance ? formatWeiToUSD(accountBalance) : "0.00"), [accountBalance]);

    const potDisplayValues = useMemo(() => {
        const pots = Array.isArray(gameState?.pots) ? (gameState?.pots as string[]) : [];
        const totalPotWei = pots.reduce<bigint>((sum, pot) => sum + BigInt(pot), 0n);
        const totalPotCalculated = totalPotWei === 0n ? "0.00" : formatWeiToSimpleDollars(totalPotWei.toString());
        const mainPotCalculated = pots.length === 0 ? "0.00" : formatWeiToSimpleDollars(pots[0]);
        return {
            totalPot: totalPotCalculated,
            mainPot: mainPotCalculated
        };
    }, [gameState?.pots]);

    // Memoize community cards rendering
    const communityCardsElements = useMemo(() => {
        const communityCards = tableDataValues.tableDataCommunityCards || [];

        return Array.from({ length: 5 }).map((_, idx) => {
            if (idx < communityCards.length) {
                const card = communityCards[idx];
                return (
                    <div key={idx} className="card animate-fall">
                        <OppositePlayerCards frontSrc={`/cards/${card}.svg`} backSrc="/cards/Back.svg" flipped />
                    </div>
                );
            } else {
                return <div key={idx} className="w-[85px] h-[127px] aspect-square border-[0.5px] border-dashed border-white rounded-[5px]" />;
            }
        });
    }, [tableDataValues.tableDataCommunityCards]);

    // Memoize the component renderer
    const getComponentToRender = useCallback(
        (position: PositionArray, positionIndex: number) => {
            // ================================================================
            // CRITICAL ROTATION LOGIC - THIS IS WHERE THE ROTATION HAPPENS
            // ================================================================
            //
            // INPUTS:
            // - position: The UI position data (left, top coordinates)
            // - positionIndex: Which UI position we're rendering (0-8)
            //   * 0 = bottom (hero position)
            //   * 1 = left
            //   * 2 = top-left (for 9 players) or top (for 4 players)
            //   * 3 = top (for 9 players) or right (for 4 players)
            //   * etc.
            //
            // ROTATION FORMULA:
            // seatNumber = ((positionIndex - startIndex + tableSize) % tableSize) + 1
            //
            // STEP BY STEP BREAKDOWN:
            // 1. positionIndex - startIndex: Subtracts the rotation offset (for clockwise rotation)
            // 2. + tableSize: Ensures no negative numbers before modulo
            // 3. % tableSize: Wraps around if we exceed table size
            // 4. + 1: Converts from 0-based index to 1-based seat numbers
            //
            // VISUAL EXAMPLE (4 players, startIndex = 1):
            // - UI Pos 0: (0 - 1 + 4) % 4 + 1 = 4 → Seat 4 appears at bottom
            // - UI Pos 1: (1 - 1 + 4) % 4 + 1 = 1 → Seat 1 appears at left
            // - UI Pos 2: (2 - 1 + 4) % 4 + 1 = 2 → Seat 2 appears at top
            // - UI Pos 3: (3 - 1 + 4) % 4 + 1 = 3 → Seat 3 appears at right
            //
            // The subtraction creates a CLOCKWISE rotation:
            // As startIndex increases, lower numbered seats move clockwise to new positions

            // ROTATION DIRECTION: We subtract startIndex to rotate clockwise
            // When startIndex increases, seats move CLOCKWISE around the table
            const seatNumber = ((positionIndex - startIndex + tableSize) % tableSize) + 1;

            // Find if a player is seated at this position
            const playerAtThisSeat = tableActivePlayers.find((p: PlayerDTO) => p.seat === seatNumber);

            // Check if this seat belongs to the current user
            const isCurrentUser = playerAtThisSeat && playerAtThisSeat.address?.toLowerCase() === userWalletAddress?.toLowerCase();

            // Debug logging for seat assignment
            console.log(
                `🪑 SEAT ASSIGNMENT - Position ${positionIndex} → Seat ${seatNumber}: ` +
                    JSON.stringify(
                        {
                            positionIndex: positionIndex,
                            startIndex: startIndex,
                            calculatedSeat: seatNumber,
                            playerFound: playerAtThisSeat
                                ? {
                                      address: playerAtThisSeat.address?.substring(0, 10) + "...",
                                      stack: playerAtThisSeat.stack,
                                      sumOfBets: playerAtThisSeat.sumOfBets
                                  }
                                : null,
                            isCurrentUser: isCurrentUser,
                            uiPosition: { left: position.left, top: position.top }
                        },
                        null,
                        2
                    )
            );

            // Build common props shared by all player components
            const playerProps = {
                index: seatNumber,
                currentIndex,
                left: position.left,
                top: position.top,
                color: position.color || "#6b7280", // Default gray if no color
                status: tableDataValues.tableDataPlayers?.find((p: PlayerDTO) => p.seat === seatNumber)?.status,
                onJoin: updateBalanceOnPlayerJoin
            };

            // CASE 1: No player at this seat - render vacant position
            if (!playerAtThisSeat) {
                return (
                    <VacantPlayer
                        index={seatNumber}
                        uiPosition={positionIndex}
                        left={tableLayout.positions.vacantPlayers[positionIndex]?.left || "0px"}
                        top={tableLayout.positions.vacantPlayers[positionIndex]?.top || "0px"}
                        onJoin={updateBalanceOnPlayerJoin}
                    />
                );
            }

            // CASE 2: Current user's seat or CASE 3: Another player's seat
            // Pass the positionIndex so components can show the correct UI position
            return isCurrentUser ? (
                <Player {...playerProps} uiPosition={positionIndex} />
            ) : (
                // OppositePlayer includes the "SIT HERE" button in PlayerPopUpCard
                // When clicked, it calls setStartIndex(seatNumber - 1) to rotate the table
                // This makes the clicked seat appear at the bottom position
                <OppositePlayer
                    {...playerProps}
                    uiPosition={positionIndex}
                    setStartIndex={setStartIndex}
                    isCardVisible={isCardVisible}
                    setCardVisible={setCardVisible}
                />
            );
        },
        // INVESTIGATE: startIndex is in the dependency array, so component should re-render when it changes
        // If rotation isn't working, check:
        // 1. Is startIndex actually changing? (console log confirms it is)
        // 2. Is reorderedPlayerArray using startIndex correctly?
        // 3. Is the table layout using the correct tableSize?
        [
            tableActivePlayers,
            userWalletAddress,
            currentIndex,
            tableDataValues.tableDataPlayers,
            tableSize,
            isCardVisible,
            startIndex,
            updateBalanceOnPlayerJoin,
            tableLayout
        ]
    );

    const copyToClipboard = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
    }, []);

    // Memoize event handlers to prevent re-renders
    const handleLobbyClick = useCallback(() => {
        window.location.href = "/";
    }, []);

    const handleDepositClick = useCallback(() => {
        window.location.href = "/qr-deposit";
    }, []);

    const handleDepositMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.borderColor = colors.brand.primary;
        e.currentTarget.style.backgroundColor = hexToRgba(colors.brand.primary, 0.1);
    }, []);

    const handleDepositMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.3);
        e.currentTarget.style.backgroundColor = colors.ui.bgMedium;
    }, []);

    const handleLeaveTableMouseEnter = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
        e.currentTarget.style.color = "white";
    }, []);

    const handleLeaveTableMouseLeave = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
        e.currentTarget.style.color = colors.ui.textSecondary;
    }, []);

    const handleLeaveTableClick = useCallback(() => {
        // Get player's current stack if they are seated
        const playerData = tableDataValues.tableDataPlayers?.find((p: PlayerDTO) => p.address?.toLowerCase() === userWalletAddress);

        if (id && playerData) {
            leaveTable(id, playerData.stack || "0")
                .then(() => {
                    window.location.href = "/";
                })
                .catch((err: any) => {
                    console.error("Error leaving table:", err);
                    window.location.href = "/";
                });
        } else {
            window.location.href = "/";
        }
    }, [tableDataValues.tableDataPlayers, userWalletAddress, id]);

    if (tableDataValues.error) {
        console.error("Error loading table data:", tableDataValues.error);
        // Continue rendering instead of returning early
    }

    return (
        <div className="table-container">
            {/* Temporary Color Debug Component */}
            {/* <ColorDebug /> */}

            {/*//! HEADER - CASINO STYLE - Hidden in mobile landscape */}
            {!isMobileLandscape && (
                <div className="flex-shrink-0">
                    <div
                        className="w-[100vw] h-[50px] sm:h-[65px] text-center flex items-center justify-between px-2 sm:px-4 z-10 relative overflow-hidden border-b-2"
                        style={headerStyle}
                    >
                        {/* Subtle animated background */}
                        <div className="absolute inset-0 z-0">
                            {/* Bottom edge glow */}
                            <div
                                className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent to-transparent opacity-50"
                                style={{ backgroundImage: `linear-gradient(to right, transparent, ${colors.accent.glow}, transparent)` }}
                            ></div>
                        </div>

                        {/* Left Section - Lobby button and Network display */}
                        <div className="flex items-center space-x-2 sm:space-x-4 z-10">
                            <span
                                className="text-white text-sm sm:text-[24px] cursor-pointer hover:text-[#ffffff] transition-colors duration-300 font-bold"
                                onClick={handleLobbyClick}
                            >
                                Lobby
                            </span>
                            <NetworkDisplay isMainnet={false} />
                            {/* Game Type Display - Desktop Only */}
                            {gameOptions && (
                                <div
                                    className="hidden md:flex items-center ml-4 px-3 py-1 rounded-lg"
                                    style={{ backgroundColor: hexToRgba(colors.ui.bgMedium, 0.5), border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}` }}
                                >
                                    <span className="text-sm font-semibold" style={{ color: colors.brand.primary }}>
                                        {gameState?.type === "cash"
                                            ? "Cash • "
                                            : gameState?.type === "tournament"
                                            ? "Tournament • "
                                            : gameState?.type === "sit-and-go"
                                            ? "Sit & Go • "
                                            : ""}
                                        Texas Hold'em
                                        {gameOptions.minPlayers && gameOptions.maxPlayers && (
                                            <span className="ml-1" style={{ color: colors.ui.textSecondary }}>
                                                ({tableActivePlayers.length}/{gameOptions.maxPlayers} Players)
                                            </span>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Right Section - Wallet info - UPDATED to use NodeRpc balance */}
                        <div className="flex items-center z-10 min-w-0">
                            <div className="flex items-center rounded-lg py-1 px-1 sm:px-2 mr-1 sm:mr-3 min-w-0" style={walletInfoStyle}>
                                {isBalanceLoading ? (
                                    <span className="text-xs sm:text-sm">Loading...</span>
                                ) : (
                                    <>
                                        {/* Address */}
                                        <div className="flex items-center mr-1 sm:mr-4 min-w-0">
                                            <span
                                                className="font-mono text-[10px] sm:text-xs truncate max-w-[60px] sm:max-w-none"
                                                style={{ color: colors.brand.primary }}
                                            >
                                                {formattedAddress}
                                            </span>
                                            <FaCopy
                                                className="ml-1 sm:ml-1.5 cursor-pointer transition-colors duration-200 hover:opacity-80"
                                                style={{ color: colors.brand.primary }}
                                                size={9}
                                                onClick={() => copyToClipboard(publicKey || "")}
                                                title="Copy full address"
                                            />
                                        </div>

                                        {/* Balance - UPDATED to use direct utility */}
                                        <div className="flex items-center flex-shrink-0">
                                            <div
                                                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex items-center justify-center mr-0.5 sm:mr-1.5"
                                                style={balanceIconStyle}
                                            >
                                                <span className="font-bold text-[8px] sm:text-[10px]" style={{ color: colors.brand.primary }}>
                                                    $
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-[10px] sm:text-xs">
                                                    ${balanceFormatted}
                                                    <span className="text-[8px] sm:text-[10px] ml-1 text-gray-400">USDC</span>
                                                </p>
                                            </div>
                                            {/* Refresh button */}
                                            <button
                                                onClick={fetchAccountBalance}
                                                disabled={isBalanceLoading}
                                                className="ml-1 transition-colors duration-200 disabled:opacity-50 hover:opacity-80"
                                                style={{ color: colors.brand.primary }}
                                                title="Refresh balance"
                                            >
                                                <span className="text-[8px]">↻</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div
                                className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 cursor-pointer rounded-full shadow-md border transition-all duration-300 flex-shrink-0"
                                style={depositButtonStyle}
                                onClick={handleDepositClick}
                                onMouseEnter={handleDepositMouseEnter}
                                onMouseLeave={handleDepositMouseLeave}
                            >
                                <RiMoneyDollarCircleLine className="hover:scale-110 transition-transform duration-200" size={16} />
                            </div>
                        </div>
                    </div>

                    {/* SUB HEADER */}
                    <div
                        className="text-white flex justify-between items-center p-1 sm:p-2 h-[28px] sm:h-[35px] relative overflow-hidden shadow-lg sub-header"
                        style={subHeaderStyle}
                    >
                        {/* Animated background overlay */}
                        <div className="sub-header-overlay shimmer-animation" />

                        {/* Bottom edge shadow */}
                        <div className="sub-header-shadow" />

                        {/* Left Section */}
                        <div className="flex items-center z-20">
                            <div className="flex flex-col">
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                    <span className="text-[10px] sm:text-[15px] font-semibold" style={{ color: colors.ui.textSecondary }}>
                                        ${formattedValues.smallBlindFormatted} / ${formattedValues.bigBlindFormatted}
                                    </span>

                                    <span className="text-[10px] sm:text-[15px] font-semibold" style={{ color: colors.ui.textSecondary }}>
                                        Hand #{handNumber}
                                    </span>
                                    <span className="hidden sm:inline-block text-[15px] font-semibold" style={{ color: colors.ui.textSecondary }}>
                                        <span className="ml-2">Actions # {actionCount}</span>
                                    </span>
                                    <span className="text-[10px] sm:text-[15px] font-semibold" style={{ color: colors.ui.textSecondary }}>
                                        <span className="sm:ml-2">Seat {nextToAct}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center z-10 mr-1 sm:mr-3">
                            <span
                                className="cursor-pointer transition-colors duration-200 px-1 sm:px-2 py-0.5 sm:py-1 rounded hover:opacity-80"
                                style={sidebarToggleStyle}
                                onClick={onCloseSideBar}
                                title="Toggle Action Log"
                            >
                                {openSidebar ? <LuPanelLeftOpen size={14} /> : <LuPanelLeftClose size={14} />}
                                {/* <span className="text-xs ml-1">{openSidebar ? "Hide Log" : "Show Log"}</span> */}
                            </span>

                            <span
                                className="text-xs sm:text-[16px] cursor-pointer flex items-center gap-0.5 transition-colors duration-300 ml-2 sm:ml-3"
                                style={{ color: colors.ui.textSecondary }}
                                onMouseEnter={handleLeaveTableMouseEnter}
                                onMouseLeave={handleLeaveTableMouseLeave}
                                onClick={handleLeaveTableClick}
                                title="Return to Lobby"
                            >
                                <span className="hidden sm:inline">Leave Table</span>
                                <span className="sm:hidden">Leave</span>
                                <RxExit size={12} />
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Landscape Floating Controls */}
            {isMobileLandscape && (
                <div className="fixed top-2 left-2 right-2 flex justify-between items-center z-50">
                    {/* Left: Essential Info */}
                    <div className="flex items-center gap-2 bg-black bg-opacity-70 px-2 py-1 rounded-lg">
                        <span className="text-white text-xs font-bold cursor-pointer" onClick={handleLobbyClick}>
                            Lobby
                        </span>
                        <span className="text-gray-300 text-xs">|</span>
                        <span className="text-white text-xs">
                            ${formattedValues.smallBlindFormatted}/{formattedValues.bigBlindFormatted}
                        </span>
                    </div>

                    {/* Right: Balance & Leave */}
                    <div className="flex items-center gap-2 bg-black bg-opacity-70 px-2 py-1 rounded-lg">
                        <span className="text-white text-xs font-mono">${balanceFormatted}</span>
                        <span className="text-gray-300 text-xs">|</span>
                        <span className="text-white text-xs cursor-pointer flex items-center gap-1" onClick={handleLeaveTableClick}>
                            Leave <RxExit size={10} />
                        </span>
                    </div>
                </div>
            )}

            {/*//! BODY */}
            <div className="flex w-full flex-grow overflow-visible">
                {/*//! TABLE + FOOTER */}
                <div className="flex-grow flex flex-col justify-between transition-all duration-250 overflow-visible body-container">
                    <div className="background-hexagon">
                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(5)">
                                    <path
                                        d="M25,3.4 L45,17 L45,43.4 L25,56.7 L5,43.4 L5,17 L25,3.4 z"
                                        stroke={getHexagonStroke()}
                                        strokeWidth="0.6"
                                        fill="none"
                                    />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#hexagons)" />
                        </svg>
                    </div>
                    {/* Animated background overlay */}
                    <div className="background-shimmer shimmer-animation" />
                    {/* Static animated overlay - mouse tracking removed for performance */}
                    <div className="background-animated-static" />
                    {/* Static base gradient - mouse tracking removed for performance */}
                    <div className="background-base-static" />
                    {/*//! TABLE */}
                    <div className="flex-grow flex flex-col align-center justify-center min-h-[calc(100vh-250px)] sm:min-h-[calc(100vh-350px)] z-[0] relative">
                        {/* Hexagon pattern overlay */}

                        <div
                            className={`${isMobile ? "zoom-wrapper-mobile" : "zoom-wrapper-desktop"}`}
                            style={{
                                transform: tableLayout.tableTransform
                            }}
                        >
                            <div className="flex-grow scrollbar-none bg-custom-table h-full flex flex-col justify-center items-center relative">
                                <div className="w-[900px] h-[450px] relative text-center block transform translate-y-[30px]">
                                    <div className="h-full flex align-center justify-center">
                                        <div
                                            className="z-20 relative flex flex-col w-[900px] h-[350px] left-1/2 top-0 transform -translate-x-1/2 text-center border-[3px] border-rgba(255, 255, 255, 0.2) border-solid rounded-full items-center justify-center"
                                            style={tableBoxShadowStyle}
                                        >
                                            {/* //! Table */}
                                            <div className="table-logo">
                                                <img src={clubLogo} alt="Club Logo" />
                                            </div>
                                            <div className="flex flex-col items-center justify-center -mt-20">
                                                <div className="pot-display">
                                                    Total Pot:
                                                    <span style={{ fontWeight: "700px" }}> ${potDisplayValues.totalPot}</span>
                                                </div>
                                                <div className="pot-display-secondary">
                                                    Main Pot:
                                                    <span style={{ fontWeight: "700px" }}> ${potDisplayValues.mainPot}</span>
                                                </div>
                                                <div className="flex gap-2 mt-8">{communityCardsElements}</div>
                                            </div>

                                            {/*//! CHIP */}
                                            {tableLayout.positions.chips.map((position, index) => {
                                                const chipAmount = getChipAmount(index + 1);

                                                // DON'T RENDER CHIP IF AMOUNT IS 0
                                                if (chipAmount === "0" || chipAmount === "" || !chipAmount) {
                                                    return null;
                                                }

                                                return (
                                                    <div
                                                        key={`key-${index}`}
                                                        className="chip-position"
                                                        style={{
                                                            left: position.left,
                                                            bottom: position.bottom
                                                        }}
                                                    >
                                                        <Chip amount={chipAmount} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 z-30">
                                        {/* ============================================================
                                            MAIN RENDER LOOP - APPLIES ROTATION TO ALL PLAYERS
                                            ============================================================

                                            KEY POINTS:
                                            1. We iterate over tableLayout.positions.players (the UNROTATED positions)
                                            2. Each position has fixed UI coordinates (left, top)
                                            3. The rotation happens in getComponentToRender()

                                            IMPORTANT: We do NOT pre-rotate the positions array!
                                            - We use the original positions as-is
                                            - getComponentToRender decides WHICH seat goes WHERE
                                            - This avoids double-rotation bugs

                                            FLOW:
                                            - positionIndex 0 → getComponentToRender → decides which seat appears at bottom
                                            - positionIndex 1 → getComponentToRender → decides which seat appears at left
                                            - positionIndex 2 → getComponentToRender → decides which seat appears at top
                                            - etc.
                                        */}
                                        {tableLayout.positions.players.map((position, positionIndex) => {
                                            // Calculate seat number for animations (turn indicator, winner effects)
                                            // This uses the SAME REVERSED formula as getComponentToRender to stay in sync
                                            const seatNum = ((positionIndex - startIndex + tableSize) % tableSize) + 1;
                                            const isWinnerSeat = !!winnerInfo?.some(w => w.seat === seatNum);

                                            // Get the actual component to render (Player, OppositePlayer, or VacantPlayer)
                                            // This function handles all the rotation logic internally
                                            const componentToRender = getComponentToRender(position, positionIndex);

                                            return (
                                                <div key={positionIndex} className="z-[10]">
                                                    {/* turn indicator only when no winner yet */}
                                                    {!hasWinner && <MemoizedTurnAnimation index={seatNum - 1} />}

                                                    {/* winner ripple when hand is over and this seat won */}
                                                    {isWinnerSeat && <WinAnimation index={seatNum - 1} />}

                                                    {componentToRender}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mr-3 mb-1">
                            {/* Debug feature removed - hand_strength is not part of PlayerDTO */}
                            {/* {userData && <span className="text-white bg-[#0c0c0c80] rounded-full px-2">{userData.hand_strength}</span>} */}
                        </div>
                    </div>
                    {/* Live Hand Strength Display */}
                    <LiveHandStrengthDisplay />

                    {/*//! FOOTER - Adjusted for mobile landscape */}
                    <div
                        className={`w-full flex justify-center items-center z-[10] ${
                            isMobileLandscape
                                ? "h-[80px] fixed bottom-0 left-0 right-0 bg-black bg-opacity-50 backdrop-blur-sm"
                                : "h-[200px] sm:h-[250px] bg-transparent"
                        }`}
                    >
                        <div className={`w-full flex justify-center items-center h-full ${isMobileLandscape ? "max-w-[500px] px-2" : "max-w-[700px]"}`}>
                            <PokerActionPanel />
                        </div>
                        {/* <div className="w-full h-[400px] flex justify-center overflow-y-auto">
                            <Footer2 tableId={id} />
                        </div> */}
                    </div>
                </div>
                {/*//! ACTION LOG OVERLAY */}
                <div className={`action-log-overlay ${openSidebar ? "action-log-open" : "action-log-closed"}`}>
                    <ActionsLog />
                </div>
            </div>

            {/* Status Messages Container - Desktop positioned top-left, mobile/tablet centered */}
            <div
                className={`flex flex-col space-y-2 z-50 ${
                    viewportMode === "desktop"
                        ? "fixed left-4 top-32 items-start"
                        : isMobileLandscape
                        ? "absolute left-2 items-start max-w-[150px]"
                        : "absolute left-1/2 transform -translate-x-1/2 items-center"
                }`}
                style={{ top: viewportMode === "desktop" ? undefined : isMobileLandscape ? "3rem" : "6.25rem" }}
            >
                {/* Add a message for the current user's seat */}
                {currentUserSeat >= 0 && (
                    <div
                        className={`text-white px-3 py-2 rounded-lg text-xs sm:text-sm backdrop-blur-sm ${
                            viewportMode === "desktop"
                                ? "bg-black bg-opacity-60 text-left"
                                : isMobileLandscape
                                ? "bg-black bg-opacity-50 text-left break-words"
                                : "bg-black bg-opacity-50 text-center"
                        }`}
                    >
                        You are seated at position {currentUserSeat}
                    </div>
                )}

                {/* Add an indicator for whose turn it is */}
                {nextToActSeat && isGameInProgress && (
                    <div
                        className={`text-white px-3 py-2 rounded-lg text-xs sm:text-sm backdrop-blur-sm ${
                            viewportMode === "desktop"
                                ? "bg-black bg-opacity-80 text-left"
                                : isMobileLandscape
                                ? "bg-black bg-opacity-70 text-left break-words"
                                : "bg-black bg-opacity-70 text-center"
                        }`}
                    >
                        {isCurrentUserTurn && playerLegalActions && playerLegalActions.length > 0 ? (
                            <span className="text-yellow-400 font-semibold">Your turn to act!</span>
                        ) : (
                            <span>
                                Waiting for {nextToActSeat === 1 ? "Small Blind" : nextToActSeat === 2 ? "Big Blind" : `player at seat ${nextToActSeat}`} to act
                            </span>
                        )}
                    </div>
                )}

                {/* Show a message when the hand is over */}
                {!isGameInProgress && tableActivePlayers.length > 0 && (
                    <div
                        className={`text-white px-3 py-2 rounded-lg text-xs sm:text-sm backdrop-blur-sm ${
                            viewportMode === "desktop"
                                ? "bg-black bg-opacity-80 text-left"
                                : isMobileLandscape
                                ? "bg-black bg-opacity-70 text-left break-words"
                                : "bg-black bg-opacity-70 text-center"
                        }`}
                    >
                        <span>Hand complete - waiting for next hand</span>
                    </div>
                )}
            </div>

            {/* Add a message for empty table if needed */}
            {tableActivePlayers.length === 0 && (
                <div
                    className={`text-white bg-black bg-opacity-50 rounded text-xs sm:text-sm ${
                        isMobileLandscape ? "absolute left-2 top-24 p-2 max-w-[150px] text-left break-words" : "absolute top-28 right-4 p-2 sm:p-4 text-center"
                    }`}
                >
                    Waiting for players to join...
                </div>
            )}

            {/* Layout Mode Indicator - only shown in development mode */}
            {import.meta.env.VITE_NODE_ENV === "development" && (
                <div
                    className="fixed top-20 right-4 z-50 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg text-xs border border-gray-600"
                    style={{ maxWidth: "180px" }}
                >
                    <div className="font-bold mb-1">Layout Debug Info</div>
                    <div>
                        Mode: <span className="text-yellow-400 font-mono">{viewportMode}</span>
                    </div>
                    <div className="text-gray-400 mt-1">
                        {window.innerWidth}x{window.innerHeight}
                        {window.innerWidth > window.innerHeight ? " (landscape)" : " (portrait)"}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-700">
                        <div className="font-bold mb-1">Table Rotation</div>
                        <div className="text-green-400">
                            StartIndex: <span className="font-mono">{startIndex}</span>
                        </div>
                        <div className="text-gray-400 text-[10px] mt-1">
                            {startIndex === 0 && "No rotation (Seat 1 at bottom)"}
                            {startIndex === 1 && "Rotated by 1 (Seat 2 at bottom)"}
                            {startIndex === 2 && "Rotated by 2 (Seat 3 at bottom)"}
                            {startIndex === 3 && "Rotated by 3 (Seat 4 at bottom)"}
                            {startIndex > 3 && `Rotated by ${startIndex}`}
                        </div>
                        <div className="flex gap-1 mt-2">
                            <button
                                onClick={() => setStartIndex(prev => (prev + 1) % tableSize)}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-[10px]"
                                title="Rotate left - increases startIndex"
                            >
                                ← Rotate
                            </button>
                            <button
                                onClick={() => setStartIndex(prev => (prev - 1 + tableSize) % tableSize)}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-[10px]"
                                title="Rotate right - decreases startIndex"
                            >
                                Rotate →
                            </button>
                            <button onClick={() => setStartIndex(0)} className="bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded text-[10px]">
                                Reset
                            </button>
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-700">
                        <div className="font-bold mb-1">Results</div>
                        <pre className="text-gray-300 break-words whitespace-pre-wrap" style={{ wordBreak: "break-word", fontSize: "10px" }}>
                            {results ? JSON.stringify(results, null, 2) : "empty"}
                        </pre>
                    </div>
                </div>
            )}

            {/* Sit Out Toggle - Professional Mobile Design */}
            {hasSitOutAction && (
                <div className={`fixed z-30 ${isMobileLandscape ? "bottom-2 left-2" : isMobile ? "bottom-[260px] right-4" : "bottom-20 left-4"}`}>
                    {/* Mobile: Compact Button Design */}
                    {isMobile || isMobileLandscape ? (
                        <button
                            onClick={() => handleSitOut(id)}
                            className="btn-sit-out text-white font-medium py-1.5 px-3 rounded-lg shadow-md text-xs
                            backdrop-blur-sm transition-all duration-300 border
                            flex items-center justify-center gap-2 transform hover:scale-105"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                            SIT OUT
                        </button>
                    ) : (
                        /* Desktop: Original Button Design */
                        <button
                            onClick={() => handleSitOut(id)}
                            className="btn-sit-out text-white font-medium py-2 px-4 rounded-lg shadow-md text-sm
                            backdrop-blur-sm transition-all duration-300 border
                            flex items-center justify-center gap-2 transform hover:scale-105"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                            SIT OUT
                        </button>
                    )}
                </div>
            )}

            {/* Sit In Button - Shows when player is sitting out */}
            {hasSitInAction && (
                <div className={`fixed z-30 ${isMobileLandscape ? "bottom-2 left-2" : isMobile ? "bottom-[260px] right-4" : "bottom-20 left-4"}`}>
                    <button
                        onClick={() => handleSitIn(id)}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600
                            text-white font-bold py-2 px-4 rounded-lg shadow-lg border-2 border-green-600
                            transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105
                            animate-pulse text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                        </svg>
                        SIT IN
                    </button>
                </div>
            )}

            {/* Powered by Block52 */}
            <div className="powered-by-block52">
                <div className="powered-by-content">
                    <div className="powered-by-text">
                        <span className="text-xs text-white font-medium tracking-wide">POWERED BY</span>
                    </div>
                    <img src="/block52.png" alt="Block52 Logo" className="powered-by-logo" />
                </div>
            </div>

            {/* Game Start Countdown Modal */}
            {showCountdown && gameStartTime && (
                <GameStartCountdown gameStartTime={gameStartTime} onCountdownComplete={handleCountdownComplete} onSkip={handleSkipCountdown} />
            )}

            {/* Sit & Go Auto-Join Modal - Shows for Sit & Go games when user is not playing */}
            {gameState && (gameState.type as string) === "sit-and-go" && !isUserAlreadyPlaying && id && (
                <SitAndGoAutoJoinModal
                    tableId={id}
                    onJoinSuccess={() => {
                        // Refresh the page or update state to show the user is now playing
                        window.location.reload();
                    }}
                />
            )}

            {/* Club Name at Bottom Center (or Bottom Right in mobile landscape) */}
            <div className={`fixed z-40 ${isMobileLandscape ? "bottom-4 right-4 opacity-30" : "bottom-1 left-1/2 transform -translate-x-1/2 opacity-60"}`}>
                <div className="text-xs" style={{ color: colors.ui.textSecondary, fontSize: isMobileLandscape ? "14px" : "20px" }}>
                    {clubName}
                </div>
            </div>
        </div>
    );
});

export default Table;
