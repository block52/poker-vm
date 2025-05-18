/**
 * Player Component
 * 
 * This component represents the current user at the poker table.
 * It displays:
 * - User's hole cards (face up)
 * - User's stack amount
 * - User's status (folded, all-in, etc.)
 * - Winner information if applicable
 * - Progress bar for action timing
 * 
 * Props:
 * - left/top: Position on the table
 * - index: Seat number
 * - currentIndex: Current round index
 * - color: Player's color theme
 * - status: Player's current status
 */

import * as React from "react";
import { memo, useMemo, useCallback } from "react";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { useWinnerInfo } from "../../../hooks/useWinnerInfo";
import { usePlayerData } from "../../../hooks/usePlayerData";
import { useParams } from "react-router-dom";
import type { PlayerProps } from "../../../types/index";

const Player: React.FC<PlayerProps> = memo(({ left, top, index, currentIndex, color, status }) => {
    const { id } = useParams<{ id: string }>();
    const { playerData, stackValue, isFolded, isAllIn, holeCards, round } = usePlayerData(id, index);
    const { winnerInfo } = useWinnerInfo(id);

    // Memoize winner check
    const isWinner = useMemo(() => {
        if (!winnerInfo) return false;
        return winnerInfo.some((winner: any) => winner.seat === index);
    }, [winnerInfo, index]);

    // Memoize winner amount calculation
    const winnerAmount = useMemo(() => {
        if (!isWinner || !winnerInfo) return null;
        const winner = winnerInfo.find((w: any) => w.seat === index);
        return winner ? winner.formattedAmount : null;
    }, [isWinner, winnerInfo, index]);

    // Memoize card rendering
    const renderCards = useCallback(() => {
        if (!holeCards || holeCards.length !== 2) {
            return <div className="w-[120px] h-[80px]"></div>;
        }
        return (
            <>
                <img src={`/cards/${holeCards[0]}.svg`} width={60} height={80} className="mb-[11px]" />
                <img src={`/cards/${holeCards[1]}.svg`} width={60} height={80} className="mb-[11px]" />
            </>
        );
    }, [holeCards]);

    // Memoize status text
    const statusText = useMemo(() => {
        if (isWinner && winnerAmount) {
            return <span className="text-white font-bold flex items-center justify-center w-full h-8 mt-[22px] gap-1 text-base">WINS: {winnerAmount}</span>;
        }
        if (isFolded) {
            return <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">FOLD</span>;
        }
        if (isAllIn) {
            return <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">All In</span>;
        }
        return null;
    }, [isWinner, winnerAmount, isFolded, isAllIn]);

    // Memoize container styles
    const containerStyle = useMemo(() => ({
        left,
        top,
        transition: "top 1s ease, left 1s ease"
    }), [left, top]);

    // Memoize status bar style
    const statusBarStyle = useMemo(() => ({
        backgroundColor: isWinner ? "#2c8a3c" : "green"
    }), [isWinner]);

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
            style={containerStyle}
        >
            <div className="flex justify-center gap-1">
                {renderCards()}
            </div>
            <div className="relative flex flex-col justify-end mt-[-6px] mx-1s">
                <div
                    style={statusBarStyle}
                    className={`b-[0%] mt-[auto] w-full h-[55px] shadow-[1px_2px_6px_2px_rgba(0,0,0,0.3)] rounded-tl-2xl rounded-tr-2xl rounded-bl-md rounded-br-md flex flex-col ${
                        isWinner ? "animate-pulse" : ""
                    }`}
                >
                    {/* Progress bar is not shown in showdown */}
                    {!isWinner && round !== "showdown" && <ProgressBar index={index} />}
                    {statusText}
                </div>
                <div className="absolute top-[-10px] w-full">
                    <Badge count={index} value={stackValue} color={color} />
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function for memo
    return (
        prevProps.left === nextProps.left &&
        prevProps.top === nextProps.top &&
        prevProps.index === nextProps.index &&
        prevProps.currentIndex === nextProps.currentIndex &&
        prevProps.color === nextProps.color &&
        prevProps.status === nextProps.status
    );
});

Player.displayName = "Player";

export default Player;
