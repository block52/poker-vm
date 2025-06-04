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

import { useEffect, useState, useRef, useMemo, useCallback, memo } from "react";
import { playerPosition, dealerPosition, vacantPlayerPosition } from "../../utils/PositionArray";
import PokerActionPanel from "../Footer";
import ActionsLog from "../ActionsLog";
import ErrorsPanel from "../ErrorsPanel";
import OppositePlayerCards from "./Card/OppositePlayerCards";
import { FaCode } from "react-icons/fa";

import VacantPlayer from "./Players/VacantPlayer";
import OppositePlayer from "./Players/OppositePlayer";
import Player from "./Players/Player";

import Chip from "./common/Chip";
import CustomDealer from "../../assets/CustomDealer.svg";
import TurnAnimation from "./Animations/TurnAnimation";
import WinAnimation from "./Animations/WinAnimation";
import { LuPanelLeftOpen } from "react-icons/lu";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import placeholderLogo from "../../assets/YOUR_CLUB.png";
import { LuPanelLeftClose } from "react-icons/lu";
import { useParams } from "react-router-dom";
import { RxExit } from "react-icons/rx";
import { FaCopy } from "react-icons/fa";
import React from "react";
import { formatWeiToSimpleDollars, formatWeiToUSD } from "../../utils/numberUtils";
import { toDisplaySeat } from "../../utils/tableUtils";
import { ethers } from "ethers";

import "./Table.css"; // Import the Table CSS file

//// TODO get these hooks to subscribe to the wss connection

// 1. Core Data Providers
import { useTableData } from "../../hooks/useTableData"; // Used to create tableActivePlayers (filtered players), Contains seat numbers, addresses, and player statuses
import { usePlayerSeatInfo } from "../../hooks/usePlayerSeatInfo"; // Provides currentUserSeat - the current user's seat position and userDataBySeat - object for direct seat-to-player lookup
import { useNextToActInfo } from "../../hooks/useNextToActInfo";

//2. Visual Position/State Providers
import { useDealerPosition } from "../../hooks/useDealerPosition";
import { useChipPositions } from "../../hooks/useChipPositions";
import { usePlayerChipData } from "../../hooks/usePlayerChipData";

//3. Game State Providers
import { useTableState } from "../../hooks/useTableState"; //Provides currentRound, formattedTotalPot, tableSize, tableSize determines player layout (6 vs 9 players)
import { useGameProgress } from "../../hooks/useGameProgress"; //Provides isGameInProgress - whether a hand is active

//todo wire up to use the sdk instead of the proxy
// 4. Player Actions
import { useTableLeave } from "../../hooks/playerActions/useTableLeave";

// 5. Winner Info
import { useWinnerInfo } from "../../hooks/useWinnerInfo"; // Provides winner information for animations

// other
import { usePlayerLegalActions } from "../../hooks/playerActions/usePlayerLegalActions";
import { useGameOptions } from "../../hooks/useGameOptions";
import { useNodeRpc } from "../../context/NodeRpcContext"; // Import NodeRpcContext
import { PositionArray } from "../../types/index";
import { motion } from "framer-motion";
import { useGameStateContext } from "../../context/GameStateContext";
import { PlayerDTO, PlayerStatus } from "@bitcoinbrisbane/block52";

// Enable this to see verbose logging
const DEBUG_MODE = false;

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
    return (
        <div className="flex items-center gap-1 sm:gap-1.5 px-1 sm:px-2 py-1 bg-gray-800/60 rounded-lg text-[10px] sm:text-xs border border-blue-500/20">
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isMainnet ? "bg-green-500" : "bg-blue-400"}`}></div>
            <span className="text-gray-300 whitespace-nowrap">Block52 Chain</span>
        </div>
    );
});

NetworkDisplay.displayName = "NetworkDisplay";

// Memoize TurnAnimation
const MemoizedTurnAnimation = React.memo(TurnAnimation);

const Table = React.memo(() => {
    const { id } = useParams<{ id: string }>();
    const { client, isLoading: clientLoading, errorLogs, clearErrorLogs } = useNodeRpc();
    const [accountBalance, setAccountBalance] = useState<string>("0");
    const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(true);
    const [balanceError, setBalanceError] = useState<Error | null>(null);
    const [publicKey, setPublicKey] = useState<string | undefined>(localStorage.getItem("user_eth_public_key") || undefined);

    // Update to use the imported hook
    const tableDataValues = useTableData();

    // invoke hook for seat loop
    const { winnerInfo } = useWinnerInfo(id);

    // Define calculateZoom first, before any usage
    const calculateZoom = useCallback(() => {
        const baseWidth = 2000;
        const baseHeight = 850;
        const headerFooterHeight = 550;

        const availableHeight = window.innerHeight - headerFooterHeight;
        const scaleWidth = window.innerWidth / baseWidth;
        const scaleHeight = availableHeight / baseHeight;

        const calculatedScale = Math.min(scaleWidth, scaleHeight) * 1.7;
        return Math.min(calculatedScale, 2);
    }, []);

    // Function to fetch account balance
    const fetchAccountBalance = useCallback(async () => {
        if (!client) {
            setBalanceError(new Error("RPC client not initialized"));
            setIsBalanceLoading(false);
            return;
        }

        try {
            setIsBalanceLoading(true);

            if (!publicKey) {
                setBalanceError(new Error("No address available"));
                setIsBalanceLoading(false);
                return;
            }

            const account = await client.getAccount(publicKey);
            setAccountBalance(account.balance.toString());

            setBalanceError(null);
        } catch (err) {
            console.error("Error fetching account balance:", err);
            setBalanceError(err instanceof Error ? err : new Error("Failed to fetch balance"));
        } finally {
            setIsBalanceLoading(false);
        }
    }, [client, publicKey]);

    // Update to fetch balance when publicKey or client changes
    useEffect(() => {
        if (publicKey && client && !clientLoading) {
            fetchAccountBalance();
        }
    }, [publicKey, client, clientLoading, fetchAccountBalance]);

    // Remove the table data effect and replace with a more targeted approach
    const updateBalanceOnPlayerJoin = useCallback(() => {
        if (publicKey && client && !clientLoading) {
            fetchAccountBalance();
        }
    }, [publicKey, client, clientLoading, fetchAccountBalance]);

    // Now we can use calculateZoom in useState
    const [zoom, setZoom] = useState(calculateZoom());
    const [openSidebar, setOpenSidebar] = useState(false);
    const [isCardVisible, setCardVisible] = useState(-1);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [debugMode, setDebugMode] = useState(false);

    // Use the hook directly instead of getting it from context
    const { legalActions: playerLegalActions } = usePlayerLegalActions();

    // Add the usePlayerSeatInfo hook
    const { currentUserSeat, userDataBySeat } = usePlayerSeatInfo();

    // Add the useNextToActInfo hook
    const {
        seat: nextToActSeat,
        player: nextToActPlayer,
        isCurrentUserTurn,
        availableActions: nextToActAvailableActions,
        timeRemaining
    } = useNextToActInfo(id);


    // Add the useTableLeave hook
    const { leaveTable, isLeaving } = useTableLeave(id);

    // Add the useTableState hook to get table state properties
    const { currentRound, formattedTotalPot, tableSize } = useTableState();

    // Add the useDealerPosition hook
    const { dealerButtonPosition, isDealerButtonVisible } = useDealerPosition(id);

    // Add the useGameProgress hook
    const { isGameInProgress, handNumber, actionCount, nextToAct } = useGameProgress(id);

    // Add the useGameOptions hook
    const { gameOptions } = useGameOptions();

    // Memoize formatted values
    const formattedValues = useMemo(
        () => ({
            smallBlindFormatted: gameOptions ? formatWeiToSimpleDollars(gameOptions.smallBlind) : "0.10",
            bigBlindFormatted: gameOptions ? formatWeiToSimpleDollars(gameOptions.bigBlind) : "0.20"
        }),
        [gameOptions]
    );

    // Add any variables we need
    const [seat, setSeat] = useState<number>(0);
    const [startIndex, setStartIndex] = useState<number>(0);

    const [currentIndex, setCurrentIndex] = useState<number>(1);
    const [playerPositionArray, setPlayerPositionArray] = useState<PositionArray[]>([]);
    const [dealerPositionArray, setDealerPositionArray] = useState<PositionArray[]>([]);

    // Add the useChipPositions hook AFTER startIndex is defined
    const { chipPositionArray } = useChipPositions(id, startIndex);

    // Add the usePlayerChipData hook
    const { getChipAmount } = usePlayerChipData(id);

    // Add a ref for the animation frame ID
    const animationFrameRef = useRef<number | undefined>(undefined);

    // Memoize user wallet address
    const userWalletAddress = useMemo(() => {
        const storedAddress = localStorage.getItem("user_eth_public_key");
        return storedAddress ? storedAddress.toLowerCase() : null;
    }, []);

    // Memoize user data
    const userData = useMemo(() => {
        if (currentUserSeat >= 0) {
            return userDataBySeat[currentUserSeat] || null;
        }
        return null;
    }, [currentUserSeat, userDataBySeat]);

    // Memoize table active players
    const tableActivePlayers = useMemo(() => {
        const activePlayers = tableDataValues.tableDataPlayers?.filter((player: PlayerDTO) => player.address !== ethers.ZeroAddress) ?? [];
        return activePlayers;
    }, [tableDataValues.tableDataPlayers]);

    // Add effect to track mouse movement
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Only update if no animation frame is pending
            if (!animationFrameRef.current) {
                animationFrameRef.current = requestAnimationFrame(() => {
                    // Calculate mouse position as percentage of window
                    const x = (e.clientX / window.innerWidth) * 100;
                    const y = (e.clientY / window.innerHeight) * 100;
                    setMousePosition({ x, y });
                    animationFrameRef.current = undefined;
                });
            }
        };

        window.addEventListener("mousemove", handleMouseMove);

        // Cleanup function to remove event listener and cancel any pending animation frames
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    useEffect(() => (seat ? setStartIndex(seat) : setStartIndex(0)), [seat]);

    // Memoize reordered arrays
    const reorderedPlayerArray = useMemo(
        () => [...playerPositionArray.slice(startIndex), ...playerPositionArray.slice(0, startIndex)],
        [playerPositionArray, startIndex]
    );

    const reorderedDealerArray = useMemo(
        () => [...dealerPositionArray.slice(startIndex), ...dealerPositionArray.slice(0, startIndex)],
        [dealerPositionArray, startIndex]
    );

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
    const handleResize = useCallback(() => setZoom(calculateZoom()), [calculateZoom]);

    useEffect(() => {
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [handleResize]);

    useEffect(() => {
        //* set the number of players
        switch (tableSize) {
            case 6:
                setPlayerPositionArray(playerPosition.six);
                setDealerPositionArray(dealerPosition.six);
                break;
            case 9:
                setPlayerPositionArray(playerPosition.nine);
                setDealerPositionArray(dealerPosition.nine);
                break;
            default:
                setPlayerPositionArray([]);
                setDealerPositionArray([]);
        }
    }, [tableSize, id]);

    const onCloseSideBar = useCallback(() => {
        setOpenSidebar(!openSidebar);
    }, [openSidebar]);

    // Memoize formatted balance
    const balanceFormatted = useMemo(() => (accountBalance ? formatWeiToUSD(accountBalance) : "0.00"), [accountBalance]);

    // Memoize the component renderer
    const getComponentToRender = useCallback(
        (position: PositionArray, positionIndex: number) => {
            // Calculate the actual seat number accounting for rotation
            const seatNumber = ((positionIndex + startIndex) % tableSize) + 1;

            // Find if a player is seated at this position
            const playerAtThisSeat = tableActivePlayers.find((p: PlayerDTO) => p.seat === seatNumber);

            // Check if this seat belongs to the current user
            const isCurrentUser = playerAtThisSeat && playerAtThisSeat.address?.toLowerCase() === userWalletAddress?.toLowerCase();

            // Build common props shared by all player components
            const playerProps = {
                index: seatNumber,
                currentIndex,
                left: position.left,
                top: position.top,
                color: position.color,
                status: tableDataValues.tableDataPlayers?.find((p: PlayerDTO) => p.seat === seatNumber)?.status,
                onJoin: updateBalanceOnPlayerJoin
            };

            // CASE 1: No player at this seat - render vacant position
            if (!playerAtThisSeat) {
                return (
                    <VacantPlayer
                        index={seatNumber}
                        left={tableSize === 6 ? vacantPlayerPosition.six[positionIndex].left : vacantPlayerPosition.nine[positionIndex].left}
                        top={tableSize === 6 ? vacantPlayerPosition.six[positionIndex].top : vacantPlayerPosition.nine[positionIndex].top}
                        onJoin={updateBalanceOnPlayerJoin}
                    />
                );
            }

            // CASE 2: Current user's seat or CASE 3: Another player's seat
            return isCurrentUser ? (
                <Player {...playerProps} />
            ) : (
                <OppositePlayer {...playerProps} setStartIndex={setStartIndex} isCardVisible={isCardVisible} setCardVisible={setCardVisible} />
            );
        },
        [tableActivePlayers, userWalletAddress, currentIndex, tableDataValues.tableDataPlayers, tableSize, isCardVisible, startIndex, updateBalanceOnPlayerJoin]
    );

    const copyToClipboard = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
    }, []);

    if (tableDataValues.error) {
        console.error("Error loading table data:", tableDataValues.error);
        // Continue rendering instead of returning early
    }

    const dealerButtonStyle = useMemo(
        () => ({
            left: `calc(${dealerButtonPosition.left} + 200px)`,
            top: dealerButtonPosition.top,
            transform: "none"
        }),
        [dealerButtonPosition]
    );

    // This component manages the subscription:
    const { subscribeToTable } = useGameStateContext();
    useEffect(() => {
        if (id) {
            subscribeToTable(id);
        }
    }, [id]);



    return (
        <div className="table-container">
            {/*//! HEADER - CASINO STYLE */}
            <div className="flex-shrink-0">
                <div className="w-[100vw] h-[50px] sm:h-[65px] bg-gradient-to-r from-[#1a2639] via-[#2a3f5f] to-[#1a2639] text-center flex items-center justify-between px-2 sm:px-4 z-10 relative overflow-hidden border-b-2 border-[#3a546d]">
                    {/* Subtle animated background */}
                    <div className="absolute inset-0 z-0">
                        {/* Bottom edge glow */}
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#64ffda] to-transparent opacity-50"></div>
                    </div>

                    {/* Left Section - Lobby button and Network display */}
                    <div className="flex items-center space-x-2 sm:space-x-4 z-10">
                        <span
                            className="text-white text-sm sm:text-[24px] cursor-pointer hover:text-[#ffffff] transition-colors duration-300 font-bold"
                            onClick={() => {
                                window.location.href = "/";
                            }}
                        >
                            Lobby
                        </span>
                        <NetworkDisplay isMainnet={false} />
                    </div>

                    {/* Right Section - Wallet info - UPDATED to use NodeRpc balance */}
                    <div className="flex items-center z-10">
                        <div className="flex items-center bg-gray-800/60 rounded-lg border border-blue-500/10 py-1 px-1 sm:px-2 mr-2 sm:mr-3">
                            {isBalanceLoading ? (
                                <span className="text-xs sm:text-sm">Loading...</span>
                            ) : (
                                <>
                                    {/* Address */}
                                    <div className="flex items-center mr-2 sm:mr-4">
                                        <span className="font-mono text-blue-400 text-[10px] sm:text-xs">
                                            {`${localStorage.getItem("user_eth_public_key")?.slice(0, 6)}...${localStorage
                                                .getItem("user_eth_public_key")
                                                ?.slice(-4)}`}
                                        </span>
                                        <FaCopy
                                            className="ml-1 sm:ml-1.5 cursor-pointer text-blue-400 hover:text-blue-300 transition-colors duration-200"
                                            size={9}
                                            onClick={() => copyToClipboard(localStorage.getItem("user_eth_public_key") || "")}
                                            title="Copy full address"
                                        />
                                    </div>

                                    {/* Balance - UPDATED to use NodeRpc balance */}
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-blue-500/20 flex items-center justify-center mr-1 sm:mr-1.5">
                                            <span className="text-blue-400 font-bold text-[8px] sm:text-[10px]">$</span>
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-[10px] sm:text-xs">
                                                ${balanceFormatted}
                                                <span className="text-[8px] sm:text-[10px] ml-1 text-gray-400">USDC</span>
                                            </p>
                                            {/* <p className="text-[8px] text-gray-400 -mt-1">nonce: {accountNonce}</p> */}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div
                            className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 cursor-pointer bg-gradient-to-br from-[#2c3e50] to-[#1e293b] rounded-full shadow-md border border-[#3a546d] hover:border-[#ffffff] transition-all duration-300"
                            onClick={() => {
                                window.location.href = "/qr-deposit";
                            }}
                        >
                            <RiMoneyDollarCircleLine className="text-[#ffffff] hover:scale-110 transition-transform duration-200" size={16} />
                        </div>
                    </div>
                </div>

                {/* SUB HEADER */}
                <div className="bg-gradient-to-r from-[#1a2639] via-[#2a3f5f] to-[#1a2639] text-white flex justify-between items-center p-1 sm:p-2 h-[28px] sm:h-[35px] relative overflow-hidden shadow-lg sub-header">
                    {/* Animated background overlay */}
                    <div className="sub-header-overlay shimmer-animation" />

                    {/* Bottom edge shadow */}
                    <div className="sub-header-shadow" />

                    {/* Left Section */}
                    <div className="flex items-center z-20">
                        <div className="flex flex-col">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                                <span className="px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-[15px] text-gradient bg-gradient-to-r from-blue-300 via-white to-blue-300">
                                    ${formattedValues.smallBlindFormatted} / ${formattedValues.bigBlindFormatted}
                                </span>

                                <span className="px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-[15px] text-gradient bg-gradient-to-r from-blue-300 via-white to-blue-300">
                                    Hand #{handNumber}
                                </span>
                                <span className="hidden sm:inline-block px-2 py-1 rounded text-[15px] text-gradient bg-gradient-to-r from-blue-300 via-white to-blue-300">
                                    <span className="ml-2">Actions # {actionCount}</span>
                                </span>
                                <span className="px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-[15px] text-gradient bg-gradient-to-r from-blue-300 via-white to-blue-300">
                                    <span className="sm:ml-2">Seat {nextToAct}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center z-10 mr-1 sm:mr-3">
                        <span
                            className={`cursor-pointer transition-colors duration-200 px-1 sm:px-2 py-0.5 sm:py-1 rounded ${
                                openSidebar ? "bg-blue-500/30 text-white" : "text-gray-400 hover:text-blue-400"
                            }`}
                            onClick={onCloseSideBar}
                            title="Toggle Action Log"
                        >
                            {openSidebar ? <LuPanelLeftOpen size={14} /> : <LuPanelLeftClose size={14} />}
                            {/* <span className="text-xs ml-1">{openSidebar ? "Hide Log" : "Show Log"}</span> */}
                        </span>

                        {/* Dev Mode Toggle Button */}
                        <span
                            className={`cursor-pointer transition-colors duration-200 px-1 sm:px-2 py-0.5 sm:py-1 rounded ml-1 sm:ml-2 ${
                                debugMode ? "bg-red-500/30 text-red-400" : "text-gray-400 hover:text-blue-400"
                            }`}
                            onClick={() => setDebugMode(prev => !prev)}
                            title="Developer Mode"
                        >
                            <FaCode size={12} />
                        </span>

                        <span
                            className="text-gray-400 text-xs sm:text-[16px] cursor-pointer flex items-center gap-0.5 hover:text-white transition-colors duration-300 ml-2 sm:ml-3"
                            onClick={() => {
                                // Check player status
                                if (
                                    tableDataValues.tableDataPlayers?.some(
                                        (p: PlayerDTO) => p.address?.toLowerCase() === userWalletAddress && p.status !== PlayerStatus.FOLDED && p.status !== PlayerStatus.SITTING_OUT
                                    )
                                ) {
                                    alert("You must fold your hand before leaving the table.");
                                } else {
                                    // Get player's current stack if they are seated
                                    const playerData = tableDataValues.tableDataPlayers?.find((p: PlayerDTO) => p.address?.toLowerCase() === userWalletAddress);

                                    if (leaveTable && playerData) {
                                        leaveTable({
                                            amount: playerData.stack || "0",
                                            actionIndex: 0 // Adding action index of 0 as default
                                        })
                                            .then(() => {
                                                window.location.href = "/";
                                            })
                                            .catch(err => {
                                                console.error("Error leaving table:", err);
                                                window.location.href = "/";
                                            });
                                    } else {
                                        window.location.href = "/";
                                    }
                                }
                            }}
                            title="Return to Lobby"
                        >
                            <span className="hidden sm:inline">{isLeaving ? "Leaving..." : "Leave Table"}</span>
                            <span className="sm:hidden">{isLeaving ? "Leave..." : "Leave"}</span>
                            <RxExit size={12} />
                        </span>
                    </div>
                </div>
            </div>

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
                                        stroke="rgba(59, 130, 246, 0.5)"
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
                    {/* Animated overlay */}
                    <div
                        className="background-animated"
                        style={{
                            backgroundImage: `
                                    repeating-linear-gradient(
                                        ${45 + mousePosition.x / 10}deg,
                                        rgba(42, 72, 143, 0.1) 0%,
                                        rgba(61, 89, 161, 0.1) 25%,
                                        rgba(30, 52, 107, 0.1) 50%,
                                        rgba(50, 79, 151, 0.1) 75%,
                                        rgba(42, 72, 143, 0.1) 100%
                                    )
                                `
                        }}
                    />
                    {/* Base gradient background */}
                    <div
                        className="background-base"
                        style={{
                            backgroundImage: `
                                    radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(61, 89, 161, 0.8) 0%, transparent 60%),
                                    radial-gradient(circle at 0% 0%, rgba(42, 72, 143, 0.7) 0%, transparent 50%),
                                    radial-gradient(circle at 100% 0%, rgba(66, 99, 175, 0.7) 0%, transparent 50%),
                                    radial-gradient(circle at 0% 100%, rgba(30, 52, 107, 0.7) 0%, transparent 50%),
                                    radial-gradient(circle at 100% 100%, rgba(50, 79, 151, 0.7) 0%, transparent 50%)
                                `
                        }}
                    />
                    {/*//! TABLE */}
                    <div className="flex-grow flex flex-col align-center justify-center min-h-[calc(100vh-350px)] z-[0] relative">
                        {/* Hexagon pattern overlay */}

                        <div
                            className="zoom-wrapper"
                            style={{
                                transform: `translate(-50%, -50%) scale(${zoom})`
                            }}
                        >
                            <div className="flex-grow scrollbar-none bg-custom-table h-full flex flex-col justify-center items-center relative">
                                <div className="w-[900px] h-[450px] relative text-center block transform translate-y-[30px]">
                                    <div className="h-full flex align-center justify-center">
                                        <div className="z-20 relative flex flex-col w-[900px] h-[350px] left-1/2 top-0 transform -translate-x-1/2 text-center border-[3px] border-rgba(255, 255, 255, 0.2) border-solid rounded-full items-center justify-center shadow-[0_7px_15px_rgba(0,0,0,0.6)]">
                                            {/* //! Table */}
                                            <div className="table-logo">
                                                <img src={placeholderLogo} alt="Placeholder Logo" />
                                            </div>
                                            <div className="flex flex-col items-center justify-center -mt-20">
                                                <div className="pot-display">
                                                    Total Pot:
                                                    <span style={{ fontWeight: "700px" }}>
                                                        {" "}
                                                        $
                                                        {tableDataValues.tableDataPots?.[0] === "0"
                                                            ? "0.00"
                                                            : tableDataValues.tableDataPots
                                                                  ?.reduce((sum: number, pot: string) => sum + Number(ethers.formatUnits(pot, 18)), 0)
                                                                  .toFixed(2) || formattedTotalPot}
                                                    </span>
                                                </div>
                                                <div className="pot-display-secondary">
                                                    Main Pot:
                                                    <span style={{ fontWeight: "700px" }}>
                                                        {" "}
                                                        $
                                                        {tableDataValues.tableDataPots?.[0] === "0"
                                                            ? "0.00"
                                                            : Number(ethers.formatUnits(tableDataValues.tableDataPots?.[0] || "0", 18)).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 mt-8">
                                                    {Array.from({ length: 5 }).map((_, idx) => {
                                                        const communityCards = tableDataValues.tableDataCommunityCards || [];
                                                        if (idx < communityCards.length) {
                                                            const card = communityCards[idx];
                                                            return (
                                                                <div key={idx} className="card animate-fall">
                                                                    <OppositePlayerCards frontSrc={`/cards/${card}.svg`} backSrc="/cards/Back.svg" flipped />
                                                                </div>
                                                            );
                                                        } else {
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="w-[85px] h-[127px] aspect-square border-[0.5px] border-dashed border-white rounded-[5px]"
                                                                />
                                                            );
                                                        }
                                                    })}
                                                </div>
                                            </div>

                                            {/*//! CHIP */}
                                            {chipPositionArray.map((position, index) => {
                                                const chipAmount = getChipAmount(index + 1);

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
                                            {/*//! Dealer */}
                                            {isDealerButtonVisible && (
                                                <motion.div
                                                    className="dealer-button"
                                                    style={dealerButtonStyle}
                                                    initial={false}
                                                    animate={dealerButtonStyle}
                                                    transition={{ duration: 0.6, ease: "easeInOut" }}
                                                >
                                                    <img src={CustomDealer} alt="Dealer Button" />
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 z-30">
                                        {reorderedPlayerArray.map((position, positionIndex) => {
                                            const seatNum = ((positionIndex + startIndex) % tableSize) + 1;
                                            const isWinnerSeat = !!winnerInfo?.some(w => w.seat === seatNum);
                                            const componentToRender = getComponentToRender(position, positionIndex);

                                            return (
                                                <div key={positionIndex} className="z-[10]">
                                                    {/* turn indicator only when no winner yet */}
                                                    {!hasWinner && <MemoizedTurnAnimation index={positionIndex} />}

                                                    {/* winner ripple when hand is over and this seat won */}
                                                    {isWinnerSeat && <WinAnimation index={positionIndex} />}

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
                    {/*//! FOOTER */}
                    <div className="w-full flex justify-center items-center h-[250px] bg-transparent z-[10]">
                        <div className="max-w-[700px] w-full flex justify-center items-center h-full">
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

            {/* Status Messages Container - Stacked properly to avoid overlap */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-2 z-50" style={{ top: "6.25rem" }}>
                {/* Add a message for the current user's seat */}
                {currentUserSeat >= 0 && (
                    <div className="text-white bg-black bg-opacity-50 px-2 py-1 rounded text-xs sm:text-sm text-center">
                        You are seated at position {toDisplaySeat(currentUserSeat)}
                    </div>
                )}
                
                {/* Add an indicator for whose turn it is */}
                {nextToActSeat && isGameInProgress && (
                    <div className="text-white bg-black bg-opacity-70 px-2 py-1 rounded text-xs sm:text-sm text-center">
                        {isCurrentUserTurn && playerLegalActions && playerLegalActions.length > 0 ? (
                            <span className="text-white">Your turn to act!</span>
                        ) : (
                            <span>
                                Waiting for {nextToActSeat === 1 ? "Small Blind" : nextToActSeat === 2 ? "Big Blind" : `player at position ${nextToActSeat + 1}`} to
                                act
                            </span>
                        )}
                    </div>
                )}
                
                {/* Show a message when the hand is over */}
                {!isGameInProgress && tableActivePlayers.length > 0 && (
                    <div className="text-white bg-black bg-opacity-70 px-2 py-1 rounded text-xs sm:text-sm text-center">
                        <span>Hand complete - waiting for next hand</span>
                    </div>
                )}
            </div>

            {/* Add a message for empty table if needed */}
            {tableActivePlayers.length === 0 && (
                <div className="absolute top-28 right-4 text-white bg-black bg-opacity-50 p-2 sm:p-4 rounded text-xs sm:text-sm">Waiting for players to join...</div>
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

            {/* Debug Error Panel */}
            <div className={`debug-panel ${debugMode ? "block" : "hidden"}`}>
                <ErrorsPanel errors={errorLogs} onClear={clearErrorLogs} />
            </div>
        </div>
    );
});

export default Table;
