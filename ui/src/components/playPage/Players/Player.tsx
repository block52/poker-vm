import React from "react";
import Badge from "../reusable/Badge";
import ProgressBar from "../reusable/ProgressBar";
import { usePlayerContext } from "../../../context/usePlayerContext";
import { PlayerStatus } from "../../../context/types";

type PlayerProps = {
    left?: string; // Front side image source
    top?: string; // Back side image source
    index: number;
    currentIndex: number;
    color?: string;
    status?: number;
};

const Player: React.FC<PlayerProps> = ({ left, top, index, color }) => {
    const { players } = usePlayerContext();

    return (
        <div
            key={index}
            className={`${players[index].status && players[index].status === PlayerStatus.Fold ? "opacity-60" : ""
                } absolute flex flex-col justify-center text-gray-600 w-[150px] h-[140px] mt-[40px] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer`}
            style={{
                left: left,
                top: top,
                transition: "top 1s ease, left 1s ease"
            }}
        >
            <div className="flex justify-center gap-1">
                <img src={`/cards/7A.svg`} width={60} height={80} />
                <img src={`/cards/9C.svg`} width={60} height={80} />
                {/* <HandCard frontSrc={`/cards/1A.svg`} backSrc="/cards/back.svg" flipped={flipped1} />
                <HandCard frontSrc={`/cards/1C.svg`} backSrc="/cards/back.svg" flipped={flipped2} /> */}
            </div>
            <div className="relative flex flex-col justify-end mt-[-6px] mx-1s">
                <div
                    style={{ backgroundColor: color }}
                    className={`b-[0%] mt-[auto] w-full h-[55px]  shadow-[1px_2px_6px_2px_rgba(0,0,0,0.3)] rounded-tl-2xl rounded-tr-2xl rounded-bl-md rounded-br-md shadow-md flex flex-col`}
                >
                    {/* <p className="text-white font-bold text-sm mt-auto mb-1.5 self-center">+100</p> */}
                    <ProgressBar index={index} />
                    {players[index].status && players[index].status === PlayerStatus.Fold && (
                        <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 flex justify-center">FOLD</span>
                    )}
                    {players[index].status && players[index].status === PlayerStatus.AllIn && (
                        <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 flex justify-center">All In</span>
                    )}
                </div>
                <div className="absolute top-[0%] w-full">
                    <Badge count={index + 1} value={players[index].balance} color={color} />
                </div>
            </div>
        </div>
    );
};

export default Player;
