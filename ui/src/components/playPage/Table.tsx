import { useEffect, useState } from "react";
import { playerPosition, chipPosition, dealerPosition, vacantPlayerPosition } from "../../utils/PositionArray";
import PokerActionPanel from "../Footer";
import PokerLog from "../PokerLog";
import OppositePlayerCards from "./Card/OppositePlayerCards";
import VacantPlayer from "./Players/VacantPlayer";
import OppositePlayer from "./Players/OppositePlayer";
import Player from "./Players/Player";
import Chip from "./common/Chip";
// import { usePlayerContext } from "../../context/usePlayerContext";
import TurnAnimation from "./TurnAnimation/TurnAnimation";
import { LuPanelLeftOpen } from "react-icons/lu";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import placeholderLogo from "../../assets/YOUR_CLUB.png";
import { LuPanelLeftClose } from "react-icons/lu";
import useUserWallet from "../../hooks/useUserWallet"; // this is the browser wallet
import { useNavigate, useParams } from "react-router-dom";
import { IoMenuSharp } from "react-icons/io5";
import { RxExit } from "react-icons/rx";

import { ethers } from "ethers";
import { useTableContext } from "../../context/TableContext";
import { FaCopy } from "react-icons/fa";
import React from "react";
import { formatWeiToDollars, formatWeiToSimpleDollars, formatWeiToUSD } from "../../utils/numberUtils";
import { toDisplaySeat } from "../../utils/tableUtils";

// Enable this to see verbose logging
const DEBUG_MODE = false;

// Helper function that only logs when DEBUG_MODE is true
const debugLog = (...args: any[]) => {
    if (DEBUG_MODE) {
        console.log(...args);
    }
};

//* Here's the typical sequence of a poker hand:
//* ANTE - Initial forced bets
//* PREFLOP - Players get their hole cards, betting round
//* FLOP - First 3 community cards dealt, betting round
//* TURN - Fourth community card dealt, betting round
//* RIVER - Final community card dealt, final betting round
//* SHOWDOWN - Players show their cards to determine winner

//* Define the interface for the position object
interface PositionArray {
    left?: string;
    top?: string;
    bottom?: string;
    right?: string;
    color?: string;
}

const calculateZoom = () => {
    const baseWidth = 1600;
    const baseHeight = 850;
    const headerFooterHeight = 180;

    const availableHeight = window.innerHeight - headerFooterHeight;
    const scaleWidth = window.innerWidth / baseWidth;
    const scaleHeight = availableHeight / baseHeight;

    const calculatedScale = Math.min(scaleWidth, scaleHeight);
    return Math.min(calculatedScale, 2); // Cap at 2x
};

const useTableData = () => {
    const { tableData, isLoading, error } = useTableContext();

    // Default empty state
    const emptyState = {
        isLoading: false,
        error: null,
        tableDataType: "cash",
        tableDataAddress: "",
        tableDataSmallBlind: "0.00",
        tableDataBigBlind: "0.00",
        tableDataSmallBlindPosition: 0,
        tableDataBigBlindPosition: 0,
        tableDataDealer: 0,
        tableDataPlayers: [],
        tableDataCommunityCards: [],
        tableDataDeck: "",
        tableDataPots: ["0"],
        tableDataNextToAct: -1,
        tableDataRound: "preflop",
        tableDataWinners: [],
        tableDataSignature: ""
    };

    if (isLoading) {
        return { ...emptyState, isLoading: true };
    }

    if (error) {
        return { ...emptyState, error };
    }

    const data = tableData?.data;
    if (!data || data.type !== "cash") {
        return emptyState;
    }

    return {
        isLoading: false,
        error: null,
        tableDataType: data.type,
        tableDataAddress: data.address,
        tableDataSmallBlind: formatWeiToSimpleDollars(data.smallBlind),
        tableDataBigBlind: formatWeiToSimpleDollars(data.bigBlind),
        tableDataSmallBlindPosition: data.smallBlindPosition,
        tableDataBigBlindPosition: data.bigBlindPosition,
        tableDataDealer: data.dealer,
        tableDataPlayers: data.players || [],
        tableDataCommunityCards: data.communityCards || [],
        tableDataDeck: data.deck || "",
        tableDataPots: data.pots || ["0"],
        tableDataNextToAct: data.nextToAct ?? -1,
        tableDataRound: data.round || "preflop",
        tableDataWinners: data.winners || [],
        tableDataSignature: data.signature || ""
    };
};

// Helper function to format Wei to USD with commas

const Table = () => {
    const { id } = useParams<{ id: string }>();
    const { tableData, nextToActInfo, currentRound, playerLegalActions, tableSize, showThreeCards, getUserBySeat, currentUserSeat, leave } = useTableContext();

    // Keep the existing variable
    const currentUserAddress = localStorage.getItem("user_eth_public_key");
    debugLog("Current user address from localStorage:", currentUserAddress);

    // Create a different variable for comparison purposes
    const userWalletAddress = React.useMemo(() => {
        return currentUserAddress ? currentUserAddress.toLowerCase() : null;
    }, [currentUserAddress]);

    // Add the new hook usage here with prefixed names - directly at top level, not inside useMemo
    const tableDataValues = useTableData();

    // Replace useUserBySeat with getUserBySeat from context
    // Get the user data for the current seat from context instead of hook
    const userData = React.useMemo(() => {
        if (currentUserSeat >= 0) {
            return getUserBySeat(currentUserSeat);
        }
        return null;
    }, [currentUserSeat, getUserBySeat]);

    // Define activePlayers only once
    const activePlayers = tableDataValues.tableDataPlayers?.filter((player: any) => player.address !== "0x0000000000000000000000000000000000000000") ?? [];

    useEffect(() => {
        if (!DEBUG_MODE) return; // Skip logging if not in debug mode

        debugLog("Active Players:", activePlayers);
        // If there are active players, set their positions
        if (activePlayers.length > 0) {
            // Player in seat 1
            if (activePlayers.find((p: any) => p.seat === 1)) {
                const player1 = activePlayers.find((p: any) => p.seat === 1);
                debugLog("Player 1:", player1);
            }

            // Player in seat 2
            if (activePlayers.find((p: any) => p.seat === 2)) {
                const player2 = activePlayers.find((p: any) => p.seat === 2);
                debugLog("Player 2:", player2);
            }
        }
    }, [activePlayers]);

    // Early return if no id
    if (!id) {
        return <div className="h-screen flex items-center justify-center text-white">Invalid table ID</div>;
    }

    // Add any variables we need
    const [seat, setSeat] = useState<number>(0);
    // Add dealerIndex state here at the top with other state hooks
    const [dealerIndex, setDealerIndex] = useState<number>(0);

    // Handle loading state
    const [currentIndex, setCurrentIndex] = useState<number>(1);
    // const [type, setType] = useState<string | null>(null);
    const [startIndex, setStartIndex] = useState<number>(0);

    const [playerPositionArray, setPlayerPositionArray] = useState<PositionArray[]>([]);
    const [chipPositionArray, setChipPositionArray] = useState<PositionArray[]>([]);
    const [dealerPositionArray, setDealerPositionArray] = useState<PositionArray[]>([]);
    const [zoom, setZoom] = useState(calculateZoom());
    const [openSidebar, setOpenSidebar] = useState(false);

    const [flipped1, setFlipped1] = useState(false);
    const [flipped2, setFlipped2] = useState(false);
    const [flipped3, setFlipped3] = useState(false);
    const [isCardVisible, setCardVisible] = useState(-1);

    const navigate = useNavigate();

    const { account, balance, isLoading: walletLoading } = useUserWallet(); // this is the wallet in the browser.

    const [dealerButtonPosition, setDealerButtonPosition] = useState({ left: "0px", top: "0px" });
    const [isDealerButtonVisible, setIsDealerButtonVisible] = useState(false);

    const showPlayerBets = ["preflop", "flop", "turn", "river"].includes(currentRound);

    // Add state for mouse position
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Add effect to track mouse movement
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Calculate mouse position as percentage of window
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            setMousePosition({ x, y });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useEffect(() => {
        if (tableData?.data) {
            try {
                // Handle dealer button
                if (tableData.data.dealer !== undefined && tableData.data.dealer !== null) {
                    const dealerSeat = tableData.data.dealer === 9 ? 0 : tableData.data.dealer;
                    const dealerPos = dealerPosition.nine[dealerSeat];

                    if (dealerPos) {
                        // Just set the original position
                        setDealerButtonPosition({
                            left: dealerPos.left,
                            top: dealerPos.top
                        });
                        setIsDealerButtonVisible(true);
                    }
                }
            } catch (error) {
                console.error("Error setting position indicators:", error);
            }
        }
    }, [tableData?.data?.address, tableData?.data?.dealer, tableData?.data?.smallBlindPosition, tableData?.data?.bigBlindPosition]); // Only update when important positions change

    useEffect(() => (seat ? setStartIndex(seat) : setStartIndex(0)), [seat]);

    useEffect(() => {
        const reorderedPlayerArray = [...playerPositionArray.slice(startIndex), ...playerPositionArray.slice(0, startIndex)];
        const reorderedDealerArray = [...dealerPositionArray.slice(startIndex), ...dealerPositionArray.slice(0, startIndex)];
        const reorderedChipArray = [...chipPositionArray.slice(startIndex), ...chipPositionArray.slice(0, startIndex)];
        setPlayerPositionArray(reorderedPlayerArray);
        setChipPositionArray(reorderedChipArray);
        setDealerPositionArray(reorderedDealerArray);
    }, [startIndex]);

    function threeCardsTable() {
        setTimeout(() => {
            setFlipped1(true);
        }, 1000);
        setTimeout(() => {
            setFlipped2(true);
        }, 1100);
        setTimeout(() => {
            setFlipped3(true);
        }, 1200);
    }

    useEffect(() => {
        if (showThreeCards) {
            threeCardsTable();
        }
    }, [showThreeCards]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentIndex(prevIndex => {
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

    useEffect(() => {
        const handleResize = () => setZoom(calculateZoom());
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        //* set the number of players
        switch (tableSize) {
            case 6:
                setPlayerPositionArray(playerPosition.six);
                setChipPositionArray(chipPosition.six);
                setDealerPositionArray(dealerPosition.six);
                break;
            case 9:
                setPlayerPositionArray(playerPosition.nine);
                setChipPositionArray(chipPosition.nine);
                setDealerPositionArray(dealerPosition.nine);
                break;
            default:
                setPlayerPositionArray([]);
                setChipPositionArray([]);
                setDealerPositionArray([]);
        }
    }, [tableSize]);

    const onCloseSideBar = () => {
        setOpenSidebar(!openSidebar);
    };

    const onGoToDashboard = () => {
        // Find the current user's player data
        const currentUserPlayer = tableDataValues.tableDataPlayers?.find((p: any) => p.address?.toLowerCase() === userWalletAddress);

        // Check if the player exists and has not folded
        if (currentUserPlayer && currentUserPlayer.status !== "folded" && currentUserPlayer.status !== "sitting-out") {
            // Alert the user they need to fold first
            alert("You must fold your hand before leaving the table.");
            return;
        }

        // If they've folded or aren't in the game, call leave function and then navigate
        if (currentUserPlayer) {
            leave(); // Call the leave function from TableContext
            // Small delay to allow leave action to be processed
            setTimeout(() => {
                navigate("/");
            }, 500);
        } else {
            // If not in game at all, just navigate
            navigate("/");
        }
    };

    // Add this helper function for copying to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You could add a toast notification here if you want
    };

    // Add this function to check if the game is still in progress
    const isGameInProgress = () => {
        const activePlayers = tableData?.data?.players?.filter((p: any) => p.status !== "folded" && p.status !== "sitting-out");
        return activePlayers && activePlayers.length > 1;
    };

    // Add this check early in your component
    if (tableDataValues.isLoading) {
        return <div className="h-screen flex items-center justify-center text-white">Loading table data...</div>;
    }

    if (tableDataValues.error) {
        return <div className="h-screen flex items-center justify-center text-white">Error: {tableDataValues.error.message}</div>;
    }

    if (!tableDataValues.tableDataPlayers || !tableDataValues.tableDataCommunityCards) {
        return <div className="h-screen flex items-center justify-center text-white">Waiting for table data...</div>;
    }

    return (
        <div className="relative h-screen w-full overflow-hidden">
            {/* Add the keyframe animation */}
            <style>{`
                @keyframes gradient {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }
            `}</style>

            {/*//! HEADER - CASINO STYLE */}
            <div className="flex-shrink-0">
                <div className="w-[100vw] h-[65px] bg-gradient-to-r from-[#1a2639] via-[#2a3f5f] to-[#1a2639] text-center flex items-center justify-between px-4 z-10 relative overflow-hidden border-b-2 border-[#3a546d]">
                    {/* Subtle animated background */}
                    <div className="absolute inset-0 z-0">
                        {/* Bottom edge glow */}
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#64ffda] to-transparent opacity-50"></div>
                    </div>

                    {/* Left Section - Lobby button */}
                    <div className="flex items-center space-x-3 z-10">
                        <span
                            className="text-gray-400 text-[24px] cursor-pointer hover:text-[#ffffff] transition-colors duration-300"
                            onClick={() => navigate("/")}
                        >
                            Lobby
                        </span>
                    </div>

                    {/* Right Section - Wallet info */}
                    <div className="flex items-center z-10">
                        <div className="flex flex-col items-end justify-center text-white mr-3">
                            {walletLoading ? (
                                <span>Loading...</span>
                            ) : (
                                <>
                                    <div className="flex items-center gap-1 text-gray-300">
                                        <span className="opacity-75 text-[14px]">Account:</span>
                                        <span className=" text-[14px] text-[#ffffff]">
                                            {`${localStorage.getItem("user_eth_public_key")?.slice(0, 6)}...${localStorage
                                                .getItem("user_eth_public_key")
                                                ?.slice(-4)}`}
                                        </span>
                                        <FaCopy
                                            className="ml-1 cursor-pointer text-gray-400 hover:text-[#ffffff] transition-colors duration-200"
                                            size={13}
                                            onClick={() => copyToClipboard(localStorage.getItem("user_eth_public_key") || "")}
                                            title="Copy full address"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="opacity-75 text-[13px]">Balance:</span>
                                        <span className="font-medium text-[#ffffff] text-[14px]">
                                            ${balance ? formatWeiToUSD(balance) : "0.00"}
                                            <span className="text-[13px] ml-1 text-gray-400">USDC</span>
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center justify-center w-10 h-10 cursor-pointer bg-gradient-to-br from-[#2c3e50] to-[#1e293b] rounded-full shadow-md border border-[#3a546d] hover:border-[#ffffff] transition-all duration-300">
                            <RiMoneyDollarCircleLine
                                className="text-[#ffffff] hover:scale-110 transition-transform duration-200"
                                size={24}
                                onClick={() => navigate("/deposit")}
                            />
                        </div>
                    </div>
                </div>

                {/* SUB HEADER */}
                <div className="bg-gray-900 text-white flex justify-between items-center p-2 h-[35px] relative overflow-hidden shadow-lg">
                    {/* Animated background overlay */}
                    <div
                        className="absolute inset-0 z-0 opacity-30"
                        style={{
                            backgroundImage:
                                "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(50,205,50,0.1) 25%, rgba(0,0,0,0) 50%, rgba(50,205,50,0.1) 75%, rgba(0,0,0,0) 100%)",
                            backgroundSize: "200% 100%",
                            animation: "shimmer 3s infinite linear"
                        }}
                    />

                    {/* Bottom edge shadow */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-50"></div>

                    {/* Add the keyframe animation */}
                    <style>{`
                        @keyframes shimmer {
                            0% { background-position: 0% 0; }
                            100% { background-position: 200% 0; }
                        }
                    `}</style>

                    {/* Left Section */}
                    <div className="flex items-center z-10">
                        <span className="px-2 py-1 rounded  text-[15px] ">
                            ${tableDataValues.tableDataSmallBlind}/${tableDataValues.tableDataBigBlind}
                        </span>
                        <span className="ml-2 text-[15px]">
                            Game Type: <span className="text-[15px] text-yellow-400">{tableDataValues.tableDataType}</span>
                        </span>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center z-10 mr-3">
                        <span className="cursor-pointer hover:text-green-400 transition-colors duration-200 text-gray-400" onClick={onCloseSideBar}>
                            {openSidebar ? <LuPanelLeftOpen size={17} /> : <LuPanelLeftClose size={17} />}
                        </span>
                        <button
                            className="text-gray-400 text-[16px] cursor-pointer flex items-center gap-0.5 hover:text-white transition-colors duration-300 ml-3"
                            onClick={onGoToDashboard}
                            title="Return to Lobby"
                        >
                            Leave Table
                            <RxExit size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/*//! BODY */}
            <div className="flex w-full flex-grow overflow-visible">
                {/*//! TABLE + FOOTER */}
                <div
                    className={"flex-grow flex flex-col justify-between transition-all duration-250 overflow-visible"}
                    style={{
                        transition: "margin 0.3s ease"
                    }}
                >
                    {/*//! TABLE */}
                    <div className="flex-grow flex flex-col align-center justify-center min-h-[calc(100vh-350px)] z-[0] relative">
                        {/* Animated background overlay */}
                        <div
                            className="absolute inset-0 z-0 opacity-30"
                            style={{
                                backgroundImage:
                                    "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(50,205,50,0.1) 25%, rgba(0,0,0,0) 50%, rgba(50,205,50,0.1) 75%, rgba(0,0,0,0) 100%)",
                                backgroundSize: "200% 100%",
                                animation: "shimmer 3s infinite linear"
                            }}
                        />

                        {/* Animated overlay */}
                        <div
                            className="absolute inset-0 z-0"
                            style={{
                                backgroundImage: `
                                    repeating-linear-gradient(
                                        ${45 + mousePosition.x / 10}deg,
                                        rgba(42, 72, 65, 0.1) 0%,
                                        rgba(61, 89, 80, 0.1) 25%,
                                        rgba(30, 52, 47, 0.1) 50%,
                                        rgba(50, 79, 71, 0.1) 75%,
                                        rgba(42, 72, 65, 0.1) 100%
                                    )
                                `,
                                backgroundSize: "400% 400%",
                                animation: "gradient 15s ease infinite",
                                transition: "background 0.5s ease"
                            }}
                        />

                        {/* Base gradient background */}
                        <div
                            className="absolute inset-0 z-0"
                            style={{
                                backgroundImage: `
                                    radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(42, 72, 65, 0.9) 0%, transparent 60%),
                                    radial-gradient(circle at 0% 0%, rgba(42, 72, 65, 0.7) 0%, transparent 50%),
                                    radial-gradient(circle at 100% 0%, rgba(61, 89, 80, 0.7) 0%, transparent 50%),
                                    radial-gradient(circle at 0% 100%, rgba(30, 52, 47, 0.7) 0%, transparent 50%),
                                    radial-gradient(circle at 100% 100%, rgba(50, 79, 71, 0.7) 0%, transparent 50%)
                                `,
                                filter: "blur(60px)",
                                transition: "all 0.3s ease-out"
                            }}
                        />

                        <div
                            className="zoom-wrapper"
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: `translate(-50%, -50%) scale(${zoom})`,
                                transformOrigin: "center center",
                                width: "1600px",
                                height: "850px",
                                maxWidth: "100vw",
                                maxHeight: "calc(100vh - 180px)", // leave room for header/footer
                                overflow: "visible" // ensure nothing is cut off
                            }}
                        >
                            <div className="flex-grow scrollbar-none bg-custom-table h-full flex flex-col justify-center items-center relative">
                                <div className="w-[900px] h-[450px] relative text-center block transform translate-y-[30px]">
                                    <div className="h-full flex align-center justify-center">
                                        <div className="z-20 relative flex flex-col w-[900px] h-[350px] left-1/2 top-0 transform -translate-x-1/2 text-center border-[3px] border-rgba(255, 255, 255, 0.2) border-solid rounded-full items-center justify-center shadow-[0_7px_15px_rgba(0,0,0,0.6)]">
                                            {/* //! Table */}
                                            <div
                                                className="absolute z-0 pointer-events-none"
                                                style={{
                                                    bottom: "15px", // Inside the table bounds
                                                    left: "50%",
                                                    transform: "translate(-50%, 30%)"
                                                }}
                                            >
                                                <img
                                                    src={placeholderLogo}
                                                    alt="Placeholder Logo"
                                                    style={{
                                                        width: "300px", // You can tweak this — it's now relative to the table
                                                        opacity: 0.3,
                                                        objectFit: "contain"
                                                    }}
                                                />
                                            </div>
                                            <div className="flex flex-col items-center justify-center -mt-20">
                                                <div
                                                    style={{
                                                        fontSize: "20px",
                                                        backgroundColor: "rgba(0,0,0,0.25)",
                                                        borderRadius: "9999px",
                                                        color: "rgb(255, 255, 255)",
                                                        padding: "3px 8px"
                                                    }}
                                                >
                                                    Total Pot:
                                                    <span style={{ fontWeight: "700px" }}>
                                                        {" "}
                                                        $
                                                        {tableDataValues.tableDataPots?.[0] === "0"
                                                            ? "0.00"
                                                            : tableDataValues.tableDataPots
                                                                  ?.reduce((sum: number, pot: string) => sum + Number(ethers.formatUnits(pot, 18)), 0)
                                                                  .toFixed(2)}
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "18px",
                                                        backgroundColor: "rgba(0,0,0,0.25)",
                                                        borderRadius: "9999px",
                                                        color: "rgb(255, 255, 255)",
                                                        padding: "3px 8px",
                                                        marginTop: "4px"
                                                    }}
                                                >
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
                                                    {tableDataValues.tableDataRound === "preflop"
                                                        ? // Show face-down cards in preflop
                                                          Array(5)
                                                              .fill(null)
                                                              .map((_, index) => (
                                                                  <div
                                                                      key={index}
                                                                      className="w-[85px] h-[127px] aspect-square border-[0.5px] border-dashed border-white rounded-[5px]"
                                                                  />
                                                              ))
                                                        : // Show actual cards for other rounds
                                                          (tableDataValues.tableDataCommunityCards || []).map((card: any, index: number) => (
                                                              <div key={index} className="card animate-fall">
                                                                  <OppositePlayerCards
                                                                      frontSrc={`/cards/${card}.svg`}
                                                                      backSrc="/cards/Back.svg"
                                                                      flipped={true}
                                                                  />
                                                              </div>
                                                          ))}
                                                </div>
                                            </div>

                                            {/*//! CHIP */}
                                            {chipPositionArray.map((position, index) => {
                                                const player = tableData?.data?.players?.find((p: any) => p.seat === index + 1);

                                                return (
                                                    <div
                                                        key={`key-${index}`}
                                                        style={{
                                                            left: position.left,
                                                            bottom: position.bottom
                                                        }}
                                                        className="absolute"
                                                    >
                                                        <Chip amount={parseFloat(formatWeiToDollars(player?.sumOfBets || "0"))} />
                                                    </div>
                                                );
                                            })}
                                            {/*//! Dealer */}
                                            {isDealerButtonVisible && (
                                                <div
                                                    className="absolute z-50 bg-white text-black font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-black"
                                                    style={{
                                                        left: `calc(${dealerButtonPosition.left} + 200px)`,
                                                        top: dealerButtonPosition.top,
                                                        transform: "none"
                                                    }}
                                                >
                                                    D
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 z-30">
                                        {playerPositionArray.map((position, positionIndex) => {
                                            const playerAtThisSeat = activePlayers.find((p: any) => p.seat === positionIndex + 1);
                                            const isCurrentUser = playerAtThisSeat && playerAtThisSeat.address?.toLowerCase() === userWalletAddress;

                                            if (DEBUG_MODE && playerAtThisSeat) {
                                                debugLog(`Seat ${positionIndex + 1} detailed comparison:`, {
                                                    playerAddress: playerAtThisSeat.address,
                                                    playerAddressLower: playerAtThisSeat.address?.toLowerCase(),
                                                    currentUserAddress: userWalletAddress,
                                                    currentUserAddressLower: userWalletAddress?.toLowerCase(),
                                                    isMatch: isCurrentUser,
                                                    exactCompare: playerAtThisSeat.address === userWalletAddress,
                                                    lowerCompare: playerAtThisSeat.address?.toLowerCase() === userWalletAddress?.toLowerCase()
                                                });
                                            }

                                            const componentProps = {
                                                index: positionIndex + 1,
                                                currentIndex: currentIndex,
                                                left: position.left,
                                                top: position.top,
                                                color: position.color,
                                                status: tableDataValues.tableDataPlayers?.find((p: any) => p.seat === positionIndex + 1)?.status
                                            };

                                            const componentToRender = !playerAtThisSeat ? (
                                                <VacantPlayer
                                                    index={positionIndex + 1}
                                                    left={
                                                        tableSize === 6
                                                            ? vacantPlayerPosition.six[positionIndex].left
                                                            : vacantPlayerPosition.nine[positionIndex].left
                                                    }
                                                    top={
                                                        tableSize === 6
                                                            ? vacantPlayerPosition.six[positionIndex].top
                                                            : vacantPlayerPosition.nine[positionIndex].top
                                                    }
                                                />
                                            ) : isCurrentUser ? (
                                                <Player {...componentProps} />
                                            ) : (
                                                <OppositePlayer
                                                    {...componentProps}
                                                    setStartIndex={(index: number) => setStartIndex(index)}
                                                    isCardVisible={isCardVisible}
                                                    setCardVisible={setCardVisible}
                                                />
                                            );

                                            if (DEBUG_MODE) {
                                                debugLog(`Rendering component for seat ${positionIndex + 1}:`, {
                                                    isVacant: !playerAtThisSeat,
                                                    isCurrentUser,
                                                    componentType: !playerAtThisSeat ? "VacantPlayer" : isCurrentUser ? "Player" : "OppositePlayer",
                                                    currentUserAddress: userWalletAddress
                                                });
                                            }

                                            return (
                                                <div key={positionIndex} className="z-[10]">
                                                    <div>
                                                        <TurnAnimation index={positionIndex} />
                                                    </div>
                                                    {componentToRender}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mr-3 mb-1">
                            {userData && <span className="text-white bg-[#0c0c0c80] rounded-full px-2">{userData.hand_strength}</span>}
                        </div>
                    </div>

                    {/*//! FOOTER */}
                    <div className="flex-shrink-0 w-full h-[250px] bg-custom-footer text-center z-[10] flex justify-center">
                        <PokerActionPanel />
                    </div>
                </div>
                {/*//! SIDEBAR */}
                <div
                    className={`fixed top-[0px] right-0 h-full bg-custom-header overflow-hidden transition-all duration-300 ease-in-out relative ${
                        openSidebar ? "w-[300px]" : "w-0"
                    }`}
                    style={{
                        boxShadow: openSidebar ? "0px 0px 10px rgba(0,0,0,0.5)" : "none"
                    }}
                >
                    <div className={`transition-opacity duration-300 ${openSidebar ? "opacity-100" : "opacity-0"} absolute left-0 top-0`}>
                        <PokerLog />
                    </div>
                </div>
            </div>

            {/* Add a message for empty table if needed */}
            {activePlayers.length === 0 && (
                <div className="absolute top-24 right-4 text-white bg-black bg-opacity-50 p-4 rounded">Waiting for players to join...</div>
            )}
            {/* Add a message for the current user's seat */}
            {currentUserSeat >= 0 && (
                <div className="absolute top-24 left-4 text-white bg-black bg-opacity-50 p-2 rounded">
                    You are seated at position {toDisplaySeat(currentUserSeat)}
                </div>
            )}
            {/* Add an indicator for whose turn it is */}
            {nextToActInfo && isGameInProgress() && (
                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-70 p-2 rounded">
                    {nextToActInfo.isCurrentUserTurn && playerLegalActions && playerLegalActions.length > 0 ? (
                        <span className="text-white">Your turn to act!</span>
                    ) : (
                        <span>
                            Waiting for{" "}
                            {nextToActInfo.seat === 1 ? "Small Blind" : nextToActInfo.seat === 2 ? "Big Blind" : `player at position ${nextToActInfo.seat + 1}`}{" "}
                            to act
                        </span>
                    )}
                </div>
            )}
            {/* Show a message when the hand is over */}
            {tableData?.data?.players && !isGameInProgress() && activePlayers.length > 0 && (
                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-70 p-2 rounded">
                    <span>Hand complete - waiting for next hand</span>
                </div>
            )}
        </div>
    );
};

export default Table;
