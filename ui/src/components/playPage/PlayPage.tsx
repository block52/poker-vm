import { useEffect, useState } from "react";
import { playerPosition, chipPosition, dealerPosition } from "../../utils/PositionArray";
import { IoMenuSharp } from "react-icons/io5";
import { CiCalendar } from "react-icons/ci";
import PokerActionPanel from "../Footer";
import PokerLog from "../PokerLog";
import OppositePlayerCards from "./Card/OppositePlayerCards";
import VacantPlayer from "./Players/VacantPlayer";
import OppositePlayer from "./Players/OppositePlayer";
import Player from "./Players/Player";
import Dealer from "./reusable/Dealer";
import Chip from "./reusable/Chip";
import { usePlayerContext } from "../../context/usePlayerContext";
import { PlayerStatus } from "../../context/types";
import TurnAnimation from "./TurnAnimation/TurnAnimation";
import { LuPanelLeftOpen } from "react-icons/lu";
import { BiBorderAll } from "react-icons/bi";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { LuPanelLeftClose } from "react-icons/lu";
import { HiPlus } from "react-icons/hi2";

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

function PlayPage() {
    const [currentIndex, setCurrentIndex] = useState<number>(1);
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

    // const reorderPlayerPositions = (startIndex: number) => {
    //     // Separate out the color and position data
    //     const colors = playerPositionArray.map(item => item.color);
    //     const positions = playerPositionArray.map(({ left, top }) => ({ left, top }));

    //     // Reorder the positions array starting from `startIndex`
    //     const reorderedPositions = [...positions.slice(startIndex), ...positions.slice(0, startIndex)];

    //     // Reconstruct the array with reordered positions and the same color order
    //     return reorderedPositions.map((position, index) => ({
    //         ...position,
    //         color: colors[index]
    //     }));
    // };

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

    return (
        <div className="h-screen">
            {/*//! HEADER */}
            <div>
                <div className="w-[100vw] h-[65px] bottom-0 bg-[#404040] top-5 text-center flex items-center justify-between border-gray-400 px-4 z-0">
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full border-r border-white">
                            <IoMenuSharp size={20} />
                        </div>
                        <span className="text-white text-sm font-medium text-[20px]">LOBBY</span>
                    </div>

                    {/* Middle Section */}
                    <div className="flex">
                        <div className="w-[130px] h-[64px] border-l border-white flex items-center justify-center white">
                            <HiPlus color="#f0f0f0" size={25} />
                        </div>
                        <div className="w-[130px] h-[64px] border-l border-white flex items-center justify-center">
                            <HiPlus color="#f0f0f0" size={25} />
                        </div>
                        <div className="w-[130px] h-[64px] border-l border-white flex items-center justify-center">
                            <HiPlus color="#f0f0f0" size={25} />
                        </div>
                        <div className="w-[130px] h-[64px] border-l border-r border-white flex items-center justify-center white">
                            <HiPlus color="#f0f0f0" size={25} />
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center">
                        <div className="flex flex-col items-end justify-center text-white text-[13px]">
                            <span>{"Balance: $ 14.2 (USD)"}</span>
                        </div>

                        <div className="flex items-center justify-center w-10 h-10">
                            <RiMoneyDollarCircleLine color="#f0f0f0" size={25} />
                        </div>
                        <div className="ml-2 flex items-center justify-center w-10 h-10 bg-gray-500 rounded-full">
                            <CiCalendar color="#f0f0f0" size={25} />
                        </div>
                        <div className="ml-2 flex items-center justify-center w-10 h-10 bg-gray-500 rounded-full">
                            <BiBorderAll color="#f0f0f0" size={25} />
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 text-white flex justify-between items-center p-2 h-[25px]">
                    {/* Left Section */}
                    <div className="flex items-center">
                        <span className="px-2 rounded text-[12px]">2/4</span>
                        <span className="ml-2 text-[12px]">No Limit Hold'em</span>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center">
                        <span className="text-sm cursor-pointer" onClick={onCloseSideBar}>
                            {openSidebar ? <LuPanelLeftOpen /> : <LuPanelLeftClose />}
                        </span>
                        <button className="ml-2 px-3 rounded">X</button>
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
                                        <div className="z-[20] relative flex flex-col absolute w-[800px] h-[300px] left-1/2 top-5 transform -translate-x-1/2 text-center z-0 border-[2px] border-[#c9c9c985] rounded-full flex items-center justify-center shadow-[0_7px_13px_rgba(0,0,0,0.3)]">
                                            {/* //! Table */}
                                            <div className="w-[140px] h-[25px] rounded-full bg-[#00000054] flex align-center justify-center">
                                                <span className="text-[#dbd3d3] mr-2">Total Pot: 50</span>
                                            </div>
                                            <div className="w-[130px] h-[21px] rounded-full bg-[#00000054] flex align-center justify-center mt-2">
                                                <span className="text-[#dbd3d3] mr-2">Main Pot: 50</span>
                                            </div>
                                            <div className="flex gap-2 mt-8">
                                                {showThreeCards && (
                                                    <>
                                                        <div className="card animate-fall delay-200">
                                                            <OppositePlayerCards frontSrc={`/cards/6D.svg`} backSrc="/cards/back.svg" flipped={flipped1} />
                                                        </div>
                                                        <div className="card animate-fall delay-400">
                                                            <OppositePlayerCards frontSrc={`/cards/JA.svg`} backSrc="/cards/back.svg" flipped={flipped2} />
                                                        </div>
                                                        <div className="card animate-fall delay-600">
                                                            <OppositePlayerCards frontSrc={`/cards/QB.svg`} backSrc="/cards/back.svg" flipped={flipped3} />
                                                        </div>
                                                        {openOneMore ? (
                                                            <div className="card animate-fall delay-600">
                                                                <OppositePlayerCards frontSrc={`/cards/6B.svg`} backSrc="/cards/back.svg" flipped={flipped3} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-[85px] h-[127px] aspect-square border-[0.5px] border-dashed border-white rounded-[5px]"></div>
                                                        )}
                                                        {openTwoMore ? (
                                                            <div className="card animate-fall delay-600">
                                                                <OppositePlayerCards frontSrc={`/cards/8A.svg`} backSrc="/cards/back.svg" flipped={flipped3} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-[85px] h-[127px] aspect-square border-[0.5px] border-dashed border-white rounded-[5px]"></div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            {/*//! CHIP */}
                                            {chipPositionArray.map((position, index) => {
                                                return (
                                                    <div
                                                        key={`key-${index}`} // Make sure to add a unique key
                                                        style={{
                                                            left: position.left,
                                                            bottom: position.bottom
                                                        }}
                                                        className="absolute"
                                                    >
                                                        <Chip amount={players[index].pot} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {playerPositionArray.map((position, index) => {
                                        const playerData = players[index];
                                        return (
                                            <div key={index} className="z-[10]">
                                                {playerData.status === PlayerStatus.SeatOff ? (
                                                    <VacantPlayer index={index} left={position.left} top={position.top} />
                                                ) : index !== 0 ? (
                                                    <OppositePlayer
                                                        index={index}
                                                        currentIndex={currentIndex}
                                                        setStartIndex={(index: number) => setStartIndex(index)}
                                                        left={position.left}
                                                        top={position.top}
                                                        color={position.color}
                                                        status={players[index]?.status}
                                                        isCardVisible={isCardVisible}
                                                        setCardVisible={setCardVisible}
                                                    />
                                                ) : (
                                                    <Player
                                                        index={index}
                                                        currentIndex={currentIndex}
                                                        left={position.left}
                                                        top={position.top}
                                                        color={position.color}
                                                        status={players[index]?.status}
                                                    />
                                                )}
                                                <div>
                                                    <TurnAnimation left={position.left} top={position.top} index={index} />
                                                </div>
                                            </div>
                                        );
                                    })}
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
                            <span className="text-white bg-[#0c0c0c80] rounded-full px-2">High Card, Jack</span>
                        </div>
                    </div>
                    {/*//! FOOTER */}
                    <div className="mb-[0] w-full h-[190px] bottom-0 bg-custom-footer top-5 text-center z-[0] flex justify-center">
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
                {/* <div
                    className={`transition-all duration-300 ease-in-out bg-custom-header flex flex-col items-center justify-center p-4 ${openSidebar ? "w-[250px] opacity-100" : "w-0 opacity-0"
                        }`}
                    style={{
                        overflow: openSidebar ? "visible" : "hidden", // Prevents content from spilling when hidden
                    }}
                >
                    <PokerLog />
                </div> */}
            </div>
        </div>
    );
}

export default PlayPage;
