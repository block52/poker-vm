import * as React from "react";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { useWinnerInfo } from "../../../hooks/useWinnerInfo";
import { usePlayerData } from "../../../hooks/usePlayerData";
import { useParams } from "react-router-dom";

type PlayerProps = {
    left?: string; // Position left value
    top?: string; // Position top value
    index: number;
    currentIndex: number;
    color?: string;
    status?: string;
};

const Player: React.FC<PlayerProps> = ({ left, top, index, currentIndex, color, status }) => {
    const { id } = useParams<{ id: string }>();
    const { playerData, stackValue, isFolded, isAllIn, holeCards, round } = usePlayerData(id, index);
    const { winnerInfo } = useWinnerInfo(id);

    // Check if this player is a winner
    const isWinner = React.useMemo(() => {
        if (!winnerInfo) return false;
        return winnerInfo.some((winner: any) => winner.seat === index);
    }, [winnerInfo, index]);

    // Get winner amount if this player is a winner
    const winnerAmount = React.useMemo(() => {
        if (!isWinner || !winnerInfo) return null;
        const winner = winnerInfo.find((w: any) => w.seat === index);
        return winner ? winner.formattedAmount : null;
    }, [isWinner, winnerInfo, index]);



    if (!playerData) {
        console.log(`No player data found for player at seat ${index}`);
        return <></>;
    }

    return (
        <div
            key={index}
            className={`${
                isFolded ? "opacity-60" : ""
            } absolute flex flex-col justify-center text-gray-600 w-[160px] h-[140px] mt-[40px] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer`}
            style={{
                left: left,
                top: top,
                transition: "top 1s ease, left 1s ease"
            }}
        >
            <div className="flex justify-center gap-1">
                {holeCards && holeCards.length === 2 ? (
                    <>
                        <img src={`/cards/${holeCards[0]}.svg`} width={60} height={80} className="mb-[11px]" />
                        <img src={`/cards/${holeCards[1]}.svg`} width={60} height={80} className="mb-[11px]" />
                    </>
                ) : (
                    // Render nothing when no cards have been dealt yet
                    <div className="w-[120px] h-[80px]"></div>
                )}
            </div>
            <div className="relative flex flex-col justify-end mt-[-6px] mx-1s">
                <div
                    style={{ backgroundColor: isWinner ? "#2c8a3c" : "green" }}
                    className={`b-[0%] mt-[auto] w-full h-[55px]  shadow-[1px_2px_6px_2px_rgba(0,0,0,0.3)] rounded-tl-2xl rounded-tr-2xl rounded-bl-md rounded-br-md flex flex-col ${
                        isWinner ? "animate-pulse" : ""
                    }`}
                >
                    {/* Progress bar is not shown in showdown */}
                    {!isWinner && round !== "showdown" && <ProgressBar index={index} />}
                    {!isWinner && isFolded && (
                        <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">FOLD</span>
                    )}
                    {!isWinner && isAllIn && (
                        <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">All In</span>
                    )}
                    {isWinner && winnerAmount && (
                        <span className="text-white font-bold flex items-center justify-center w-full h-8 mt-[22px] gap-1 text-base">WINS: {winnerAmount}</span>
                    )}
                </div>
                <div className="absolute top-[-10px] w-full">
                    <Badge count={index} value={stackValue} color={color} />
                </div>
            </div>
        </div>
    );
};

export default Player;
