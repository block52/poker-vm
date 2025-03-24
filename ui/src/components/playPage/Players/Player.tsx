import * as React from "react";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";

import { PlayerStatus } from "@bitcoinbrisbane/block52";
import { BigUnit } from "bigunit";
import { useTableContext } from "../../../context/TableContext";
import { formatWeiToDollars } from "../../../utils/numberUtils"; 
import { ethers } from "ethers";

// Enable this to see verbose logging
const DEBUG_MODE = false;

// Helper function that only logs when DEBUG_MODE is true
const debugLog = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
};

type PlayerProps = {
    left?: string; // Front side image source
    top?: string; // Back side image source
    index: number;
    currentIndex: number;
    color?: string;
    status?: string;
};

const Player: React.FC<PlayerProps> = ({ left, top, index, color, status }) => {
    const { tableData } = useTableContext();

    debugLog("Player rendered with these props:", { left, top, index, color, status });
    
    // // Add debugging
    // React.useEffect(() => {
    //     console.log("Player component rendering for seat:", index);
    //     console.log("Player component tableData:", tableData);
    // }, [index, tableData]);
    
    // Get player data directly from the table data
    const playerData = React.useMemo(() => {
        if (!tableData?.data?.players) return null;
        return tableData.data.players.find((p: any) => p.seat === index);
    }, [tableData, index]);
    
    if (!playerData) {
        debugLog("Player component has no player data for seat", index);
        return <></>;
    }
    
    // Format stack value with ethers.js (more accurate for large numbers)
    const stackValue = playerData.stack ? Number(ethers.formatUnits(playerData.stack, 18)) : 0;
    // Format for display with 2 decimal places
    const formattedStackValue = stackValue.toFixed(2);
    
    // Get hole cards if available
    const holeCards = playerData.holeCards;
    

    return (
        <div
            key={index}
            className={`${
                playerData.status === PlayerStatus.FOLDED ? "opacity-60" : ""
            } absolute flex flex-col justify-center text-gray-600 w-[150px] h-[140px] mt-[40px] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer`}
            style={{
                left: left,
                top: top,
                transition: "top 1s ease, left 1s ease"
            }}
        >
            <div className="flex justify-center gap-1">
                {playerData.holeCards && playerData.holeCards.length === 2 ? (
                    <>
                        <img src={`/cards/${playerData.holeCards[0]}.svg`} width={60} height={80} />
                        <img src={`/cards/${playerData.holeCards[1]}.svg`} width={60} height={80} />
                    </>
                ) : (
                    // Render nothing when no cards have been dealt yet
                    <div className="w-[120px] h-[80px]"></div>
                )}
            </div>
            <div className="relative flex flex-col justify-end mt-[-6px] mx-1s">
                <div
                    style={{ backgroundColor: "green" }}
                    className={`b-[0%] mt-[auto] w-full h-[55px]  shadow-[1px_2px_6px_2px_rgba(0,0,0,0.3)] rounded-tl-2xl rounded-tr-2xl rounded-bl-md rounded-br-md flex flex-col`}
                >
                    {/* <p className="text-white font-bold text-sm mt-auto mb-1.5 self-center">+100</p> */}
                    <ProgressBar index={index} />
                    {playerData.status === PlayerStatus.FOLDED && (
                        <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">FOLD</span>
                    )}
                    {playerData.status === PlayerStatus.ALL_IN && (
                        <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">All In</span>
                    )}
                </div>
                <div className="absolute top-[0%] w-full">
                    <Badge count={index} value={stackValue} color={color} />
                </div>
            </div>
        </div>
    );
};

export default Player;
