import * as React from "react";
import { memo, useMemo, useCallback } from "react";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { useWinnerInfo } from "../../../hooks/useWinnerInfo";
import { usePlayerData } from "../../../hooks/usePlayerData";
import { useParams } from "react-router-dom";
import type { PlayerProps } from "../../../types/index";

const Player: React.FC<PlayerProps> = memo(
  ({ left, top, index, currentIndex, color, status }) => {
    const { id } = useParams<{ id: string }>();
    const { playerData, stackValue, isFolded, isAllIn, holeCards, round } = usePlayerData(id, index);
    const { winnerInfo } = useWinnerInfo(id);

    // 1) detect when any winner exists
    const hasWinner = useMemo(
      () => Array.isArray(winnerInfo) && winnerInfo.length > 0,
      [winnerInfo]
    );

    // 2) memoize winner check
    const isWinner = useMemo(
      () => !!winnerInfo?.some((w: any) => w.seat === index),
      [winnerInfo, index]
    );

    // 3) dim non-winners when someone has won
    const opacityClass = hasWinner
      ? isWinner
        ? "opacity-100"
        : "opacity-40"
      : isFolded
      ? "opacity-60"
      : "opacity-100";

    // 4) memoize winner amount
    const winnerAmount = useMemo(() => {
      if (!isWinner || !winnerInfo) return null;
      const winner = winnerInfo.find((w: any) => w.seat === index);
      return winner?.formattedAmount ?? null;
    }, [isWinner, winnerInfo, index]);

    // 5) render hole cards
    const renderCards = useCallback(() => {
      if (!holeCards || holeCards.length !== 2) {
        return <div className="w-[120px] h-[80px]"></div>;
      }
      return (
        <>
          <img
            src={`/cards/${holeCards[0]}.svg`}
            width={60}
            height={80}
            className="mb-[11px]"
          />
          <img
            src={`/cards/${holeCards[1]}.svg`}
            width={60}
            height={80}
            className="mb-[11px]"
          />
        </>
      );
    }, [holeCards]);

    // 6) status text for folded, all-in, or winner
    const statusText = useMemo(() => {
      if (isWinner && winnerAmount) {
        return (
          <span className="text-white font-bold flex items-center justify-center w-full h-8 mt-[22px] gap-1 text-base">
            WINS: {winnerAmount}
          </span>
        );
      }
      if (isFolded) {
        return (
          <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">
            FOLD
          </span>
        );
      }
      if (isAllIn) {
        return (
          <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">
            ALL IN
          </span>
        );
      }
      return null;
    }, [isWinner, winnerAmount, isFolded, isAllIn]);

    // 7) container style for positioning
    const containerStyle = useMemo(
      () => ({
        left,
        top,
        transition: "top 1s ease, left 1s ease",
      }),
      [left, top]
    );

    // 8) status bar style (no pulse)
    const statusBarStyle = useMemo(
      () => ({
        backgroundColor: isWinner ? "#2c8a3c" : color,
      }),
      [isWinner, color]
    );

    if (!playerData) {
      console.log(`No player data found for player at seat ${index}`);
      return <></>;
    }

    return (
      <div
        key={index}
        className={`${opacityClass} absolute flex flex-col justify-center text-gray-600 w-[160px] h-[140px] mt-[40px] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer`}
        style={containerStyle}
      >
        <div className="flex justify-center gap-1">{renderCards()}</div>
        <div className="relative flex flex-col justify-end mt-[-6px] mx-1s">
          <div
            style={statusBarStyle}
            className="b-[0%] mt-[auto] w-full h-[55px] shadow-[1px_2px_6px_2px_rgba(0,0,0,0.3)] rounded-tl-2xl rounded-tr-2xl rounded-bl-md rounded-br-md flex flex-col"
          >
            {!isWinner && round !== "showdown" && <ProgressBar index={index} />}
            {statusText}
          </div>
          <div className="absolute top-[-10px] w-full">
            <Badge count={index} value={stackValue} color={color} />
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.left === nextProps.left &&
      prevProps.top === nextProps.top &&
      prevProps.index === nextProps.index &&
      prevProps.currentIndex === nextProps.currentIndex &&
      prevProps.color === nextProps.color &&
      prevProps.status === nextProps.status
    );
  }
);

Player.displayName = "Player";

export default Player;
