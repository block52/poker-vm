import { useEffect, useState } from "react";
import { playerPosition, chipPosition, dealerPosition } from "../../utils/PositionArray";
import { IoMenuSharp } from "react-icons/io5";
import PokerActionPanel from "../Footer";
import PokerLog from "../PokerLog";
import OppositePlayerCards from "./Card/OppositePlayerCards";
import VacantPlayer from "./Players/VacantPlayer";
import OppositePlayer from "./Players/OppositePlayer";
import Player from "./Players/Player";
import Dealer from "./common/Dealer";
import Chip from "./common/Chip";
import { usePlayerContext } from "../../context/usePlayerContext";
import { PlayerStatus } from "@bitcoinbrisbane/block52";
import TurnAnimation from "./TurnAnimation/TurnAnimation";
import { LuPanelLeftOpen } from "react-icons/lu";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { LuPanelLeftClose } from "react-icons/lu";
import useUserWallet from "../../hooks/useUserWallet";
import { useNavigate, useParams } from "react-router-dom";
import useTableType from "../../hooks/useTableType";
import { toDollarFromString } from "../../utils/numberUtils";
import useUserBySeat from "../../hooks/useUserBySeat";
import axios from "axios";
import { ethers } from "ethers";
import { useAccount } from 'wagmi';
import { PROXY_URL } from '../../config/constants';
import { useTableContext } from "../../context/TableContext";
import { FaCopy } from 'react-icons/fa';



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
    const baseWidth = 1800;
    const baseHeight = 950;
    const scaleWidth = window.innerWidth / baseWidth; // Scale relative to viewport width
    const scaleHeight = window.innerHeight / baseHeight; // Scale relative to viewport height
    return Math.min(scaleWidth, scaleHeight);
};

const useTableData = () => {
    const { tableData } = useTableContext();

    // Only access data if tableData exists and has a data property
    const data = tableData?.data || {};

    return {
        tableDataType: data.type || '',
        tableDataAddress: data.address || '',
        tableDataSmallBlind: `${Number(ethers.formatUnits(data.smallBlind || '0', 18))}`,
        tableDataBigBlind: `${Number(ethers.formatUnits(data.bigBlind || '0', 18))}`,
        tableDataDealer: data.dealer || 0,
        tableDataPlayers: data.players || [],
        tableDataCommunityCards: data.communityCards || [],
        tableDataPots: data.pots || ['0'],
        tableDataNextToAct: data.nextToAct || 0,
        tableDataRound: data.round || '',
        tableDataWinners: data.winners || [],
        tableDataSignature: data.signature || '',
    };
};

// Helper function to format Wei to USD with commas
const formatWeiToUSD = (weiAmount: string | number): string => {
    try {
        // Convert from Wei (18 decimals) to standard units
        const usdValue = Number(ethers.formatUnits(weiAmount.toString(), 18));
        // Format to 2 decimal places and add commas
        return usdValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    } catch (error) {
        console.error('Error formatting Wei amount:', error);
        return '0.00';
    }
};

const Table = () => {
    const { id } = useParams<{ id: string }>();
    const context = usePlayerContext();
    const { tableData } = useTableContext();

    // Add the new hook usage here with prefixed names
    const {
        tableDataType,
        tableDataAddress,
        tableDataSmallBlind,
        tableDataBigBlind,
        tableDataDealer,
        tableDataPlayers,
        tableDataCommunityCards,
        tableDataPots,
        tableDataNextToAct,
        tableDataRound,
        tableDataWinners,
        tableDataSignature
    } = useTableData();

    // Add console logs for debugging

    // console.log('Table Context Data:', tableData);
    console.log('Destructured Table Data:', {
        tableDataType,
        tableDataAddress,
        tableDataSmallBlind,
        tableDataBigBlind,
        tableDataDealer,
        tableDataPlayers,
        tableDataCommunityCards,
        tableDataPots,
        tableDataNextToAct,
        tableDataRound,
        tableDataWinners,
        tableDataSignature
    });

    // Early return if no id
    if (!id) {
        return <div className="h-screen flex items-center justify-center text-white">Invalid table ID</div>;
    }

    // Destructure context including loading and error states
    const {
        seat, // todo
        pots, // todo
        communityCards, // todo
    } = context;

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
    const { data } = useUserBySeat(id, seat);

    const navigate = useNavigate();

    const { account, balance, isLoading: walletLoading } = useUserWallet();

    const [block52Balance, setBlock52Balance] = useState<string>("");

    // Replace the wagmiStore state with direct wagmi hooks
    const { address, connector } = useAccount();

    // Add this after the useTableData destructuring
    const activePlayers = tableDataPlayers.filter((player: any) =>
        player.address !== "0x0000000000000000000000000000000000000000"
    );

    useEffect(() => {
        console.log('Active Players:', activePlayers);
        // If there are active players, set their positions
        if (activePlayers.length > 0) {
            // Player in seat 0
            if (activePlayers.find((p: any) => p.seat === 0)) {
                const player0 = activePlayers.find((p: any) => p.seat === 0);
                console.log('Player 0:', player0);
                // You can use this data to update the player position 0
            }

            // Player in seat 1
            if (activePlayers.find((p: any) => p.seat === 1)) {
                const player1 = activePlayers.find((p: any) => p.seat === 1);
                console.log('Player 1:', player1);
                // You can use this data to update the player position 1
            }
        }
    }, [tableDataPlayers]);

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

    const { players, dealerIndex, tableSize, openOneMore, openTwoMore, showThreeCards } = usePlayerContext();

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
                } else if (prevIndex === 4) {
                    // If prevIndex is 4, increment by 2
                    return prevIndex + 2;
                } else if (prevIndex === 9) {
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
        navigate("/");
    };



    // Add null check before logging
    if (!context || !context.gamePlayers) {
        console.log("Context or gamePlayers not ready yet");
        return null; // or return a loading state
    }

    // Add this helper function for copying to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You could add a toast notification here if you want
    };

    return (
        <div className="h-screen">
            {/*//! HEADER */}
            <div>
                <div className="w-[100vw] h-[65px] bottom-0 bg-[#404040] top-5 text-center flex items-center justify-between border-gray-400 px-4 z-0">
                    <div className="flex items-center space-x-2">
                        {/* <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full border-r border-white">
                            <IoMenuSharp size={20} />
                        </div> */}
                        <span className="text-white text-sm font-medium text-[20px] cursor-pointer" onClick={() => navigate("/")}>
                            Lobby
                        </span>
                    </div>

                    {/* Middle Section - Add Wallet Info */}
                    <div className="flex flex-col items-center text-white text-sm">
                        <div>Table Address: {id ? id : "Invalid Table"}</div>
                        {tableData && (
                            <div>
                                Table Type: {tableData.data?.type}
                            </div>
                        )}
                    </div>

                    {/* Right Section - Updated with icon and compact layout */}
                    <div className="flex items-center">
                        <div className="flex flex-col items-end justify-center text-white text-[11px] mr-2">
                            {walletLoading ? (
                                <span>Loading...</span>
                            ) : (
                                <>
                                    <div className="flex items-center gap-1 text-gray-300">
                                        <span className="opacity-75">Account:</span>
                                        <span className="font-mono text-[10px]">
                                            {`${localStorage.getItem('user_eth_public_key')?.slice(0, 6)}...${localStorage.getItem('user_eth_public_key')?.slice(-4)}`}
                                        </span>
                                        <FaCopy 
                                            className="ml-1 cursor-pointer hover:text-green-400 transition-colors duration-200"
                                            size={12}
                                            onClick={() => copyToClipboard(localStorage.getItem('user_eth_public_key') || '')}
                                            title="Copy full address"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="opacity-75">Balance:</span>
                                        <span className="font-medium text-green-400">
                                            ${balance ? formatWeiToUSD(balance) : '0.00'}
                                            <span className="text-[10px] ml-1 text-gray-400">USDC</span>
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center justify-center w-10 h-10 cursor-pointer">
                            <RiMoneyDollarCircleLine 
                                color="#f0f0f0" 
                                size={25} 
                                onClick={() => navigate("/deposit")}
                                className="hover:text-green-400 transition-colors duration-200" 
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 text-white flex justify-between items-center p-2 h-[25px]">
                    {/* Left Section */}
                    <div className="flex items-center">
                        <span className="px-2 rounded text-[12px]">${`${tableDataSmallBlind}/$${tableDataBigBlind}`}</span>
                        <span className="ml-2 text-[12px]">
                            Game Type: <span className="font-semibold text-[13px] text-yellow-400">{tableDataType}</span>
                        </span>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center">
                        <span className="text-sm cursor-pointer" onClick={onCloseSideBar}>
                            {openSidebar ? <LuPanelLeftOpen /> : <LuPanelLeftClose />}
                        </span>
                        <button className="ml-2 px-3 rounded" onClick={onGoToDashboard}>
                            X
                        </button>
                    </div>
                </div>
            </div>

            {/*//! BODY */}
            <div className="flex w-full h-[calc(100%-90px)]">
                {/*//! TABLE + FOOTER */}
                <div
                    className={`flex-grow flex flex-col justify-between transition-all duration-250`}
                    style={{
                        transition: "margin 0.3s ease"
                    }}
                >
                    {/*//! TABLE */}
                    <div className="flex flex-col align-center justify-center h-[calc(100%-190px)] z-[100]">
                        <div className="zoom-container h-[400px] w-[800px] m-[auto]" style={{ zoom }}>
                            <div className="flex-grow scrollbar-none bg-custom-table h-full flex flex-col justify-center items-center relative z-0">
                                <div className="w-[800px] h-[400px] relative text-center block z-[-2] transform translate-y-[30px]">
                                    <div className="h-full flex align-center justify-center">
                                        <div className="z-[20] relative flex flex-col w-[800px] h-[300px] left-1/2 top-5 transform -translate-x-1/2 text-center border-[2px] border-[#c9c9c985] rounded-full items-center justify-center shadow-[0_7px_13px_rgba(0,0,0,0.3)]">
                                            {/* //! Table */}
                                            <div className="px-4 h-[25px] rounded-full bg-[#00000054] flex align-center justify-center">
                                                <span className="text-[#dbd3d3] mr-2">Total Pot: {tableDataPots}</span>
                                            </div>
                                            <div className="px-4 h-[21px] rounded-full bg-[#00000054] flex align-center justify-center mt-2">
                                                <span className="text-[#dbd3d3] mr-2 flex items-center whitespace-nowrap">
                                                    Round: <span className="font-semibold text-yellow-400 ml-1">{tableDataRound}</span>
                                                </span>
                                            </div>
                                            <div className="px-4 h-[21px] rounded-full bg-[#00000054] flex align-center justify-center mt-2">
                                                <span className="text-[#dbd3d3] mr-2">
                                                    Main Pot: {tableDataPots[0] === "0"
                                                        ? Number(tableDataSmallBlind) + Number(tableDataBigBlind)
                                                        : tableDataPots[0]}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 mt-8">
                                                <div className="card animate-fall delay-200">
                                                    <OppositePlayerCards
                                                        frontSrc={`/cards/${communityCards[0]}.svg`}
                                                        backSrc="/cards/Back.svg"
                                                        flipped={flipped1}
                                                    />
                                                </div>
                                                <div className="card animate-fall delay-400">
                                                    <OppositePlayerCards
                                                        frontSrc={`/cards/${communityCards[1]}.svg`}
                                                        backSrc="/cards/Back.svg"
                                                        flipped={flipped2}
                                                    />
                                                </div>
                                                <div className="card animate-fall delay-600">
                                                    <OppositePlayerCards
                                                        frontSrc={`/cards/${communityCards[2]}.svg`}
                                                        backSrc="/cards/Back.svg"
                                                        flipped={flipped3}
                                                    />
                                                </div>
                                                {openOneMore ? (
                                                    <div className="card animate-fall delay-600">
                                                        <OppositePlayerCards
                                                            frontSrc={`/cards/${communityCards[3]}.svg`}
                                                            backSrc="/cards/Back.svg"
                                                            flipped={flipped3}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-[85px] h-[127px] aspect-square border-[0.5px] border-dashed border-white rounded-[5px]"></div>
                                                )}
                                                {openTwoMore ? (
                                                    <div className="card animate-fall delay-600">
                                                        <OppositePlayerCards
                                                            frontSrc={`/cards/${communityCards[4]}.svg`}
                                                            backSrc="/cards/Back.svg"
                                                            flipped={flipped3}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-[85px] h-[127px] aspect-square border-[0.5px] border-dashed border-white rounded-[5px]"></div>
                                                )}
                                            </div>
                                            {/*//! CHIP */}
                                            {chipPositionArray.map((position, index) => (
                                                <div
                                                    key={`key-${index}`}
                                                    style={{
                                                        left: position.left,
                                                        bottom: position.bottom
                                                    }}
                                                    className="absolute"
                                                >
                                                    <Chip amount={Number(pots[index])} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {playerPositionArray.map((position, index) => (
                                        <div key={index} className="z-[10]">
                                            {!activePlayers.find((p: any) => p.seat === index) ? (
                                                <VacantPlayer index={index} left={position.left} top={position.top} />
                                            ) : (
                                                <OppositePlayer
                                                    index={index}
                                                    currentIndex={currentIndex}
                                                    setStartIndex={(index: number) => setStartIndex(index)}
                                                    left={position.left}
                                                    top={position.top}
                                                    color={position.color}
                                                    status={tableDataPlayers[index]?.status}
                                                    isCardVisible={isCardVisible}
                                                    setCardVisible={setCardVisible}
                                                />
                                            )}
                                            <div>
                                                <TurnAnimation left={position.left} top={position.top} index={index} />
                                            </div>
                                        </div>
                                    ))}
                                    {/*//! Dealer */}
                                    <div
                                        style={{
                                            top: dealerPositionArray[dealerIndex]?.top,
                                            left: dealerPositionArray[dealerIndex]?.left,
                                            transition: "top 1s ease, left 1s ease"
                                        }}
                                        className="absolute"
                                    >
                                        <Dealer />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mr-3 mb-1">
                            {data && <span className="text-white bg-[#0c0c0c80] rounded-full px-2">{data.hand_strength}</span>}
                        </div>
                    </div>
                    {/*//! FOOTER */}
                    <div className="mb-[0] w-full h-[190px] bottom-0 bg-custom-footer top-5 text-center z-[0] flex justify-center">
                        <PokerActionPanel />
                    </div>
                </div>
                {/*//! SIDEBAR */}
                <div
                    className={`fixed top-[0px] right-0 h-full bg-custom-header overflow-hidden transition-all duration-300 ease-in-out relative ${openSidebar ? "w-[300px]" : "w-0"
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
                <div className="absolute top-24 right-4 text-white bg-black bg-opacity-50 p-4 rounded">
                    Waiting for players to join...
                </div>
            )}
        </div>
    );
};

export default Table;
