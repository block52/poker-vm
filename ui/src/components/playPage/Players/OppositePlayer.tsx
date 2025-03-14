import * as React from "react";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { PlayerStatus } from "@bitcoinbrisbane/block52";
import PlayerCard from "./PlayerCard";
import { BigUnit } from "bigunit";
import { useTableContext } from "../../../context/TableContext";
import { formatWeiToDollars } from "../../../utils/numberUtils";

type OppositePlayerProps = {
    left?: string;
    top?: string;
    index: number;
    currentIndex: number;
    color?: string;
    status?: string;
    isCardVisible: number;
    setCardVisible: (index: number) => void;
    setStartIndex: (index: number) => void;
};

const OppositePlayer: React.FC<OppositePlayerProps> = ({ 
    left, 
    top, 
    index, 
    color, 
    isCardVisible, 
    setCardVisible, 
    setStartIndex 
}) => {
    const { tableData } = useTableContext();
    
    // Add more detailed debugging
    React.useEffect(() => {
        console.log("OppositePlayer component rendering for seat:", index);
        // console.log("OppositePlayer tableData:", tableData);
    }, [index, tableData]);
    
    // Get player data directly from the table data
    const playerData = React.useMemo(() => {
        if (!tableData?.data?.players) {
            console.log("No players data in tableData for seat", index);
            return null;
        }
        const player = tableData.data.players.find((p: any) => p.seat === index);
        console.log("Found player data for seat", index, ":", player);
        return player;
    }, [tableData, index]);
    
    if (!playerData) {
        console.log("OppositePlayer component has no player data for seat", index);
        return <></>;
    }
    
    // Format stack value
    const stackValue = playerData.stack ? BigUnit.from(playerData.stack, 18).toNumber() : 0;
    const stackValueDollars = formatWeiToDollars(playerData.stack);
    
    console.log("Rendering OppositePlayer UI for seat", index, "with stack", stackValue);
    
    return (
        <>
            <div
                key={index}
                className={`${
                    playerData.status === PlayerStatus.FOLDED ? "opacity-60" : ""
                } absolute flex flex-col justify-center text-gray-600 w-[150px] h-[140px] mt-[40px] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-[10]`}
                style={{
                    left: left,
                    top: top,
                    transition: "top 1s ease, left 1s ease"
                }}
            >
                <div className="flex justify-center gap-1">
                    <img src={`/cards/Back.svg`} alt="Opposite Player Card" className="w-[35%] h-[auto]" />
                    <img src={`/cards/Back.svg`} alt="Opposite Player Card" className="w-[35%] h-[auto]" />
                </div>
                <div className="relative flex flex-col justify-end mt-[-6px] mx-1">
                    <div
                        style={{ backgroundColor: color }}
                        className={`b-[0%] mt-[auto] w-full h-[55px] shadow-[1px_2px_6px_2px_rgba(0,0,0,0.3)] rounded-tl-2xl rounded-tr-2xl rounded-bl-md rounded-br-md flex flex-col`}
                    >
                        <ProgressBar index={index} />
                        {playerData.status === PlayerStatus.FOLDED && (
                            <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">FOLD</span>
                        )}
                        {playerData.status === PlayerStatus.ALL_IN && (
                            <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">
                                ALL IN
                            </span>
                        )}
                    </div>
                    <div className="absolute top-[0%] w-full">
                        <Badge count={index} value={stackValueDollars} color={color} />
                    </div>
                </div>
            </div>

            <div
                className={`absolute z-[1000] transition-all duration-1000 ease-in-out transform ${
                    isCardVisible === index
                        ? "opacity-100 animate-slide-left-to-right"
                        : "opacity-0 animate-slide-top-to-bottom"
                }`}
                style={{
                    left: left,
                    top: top,
                    transform: "translate(-50%, -50%)"
                }}
            >
                {isCardVisible === index && (
                    <PlayerCard
                        id={index + 1}
                        label="SIT HERE"
                        color={color}
                        setStartIndex={(index: number) => setStartIndex(index)}
                        onClose={() => setCardVisible(-1)}
                    />
                )}
            </div>
        </>
    );
};

export default OppositePlayer;
