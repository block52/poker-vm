import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useTableAnimations } from "../../../hooks/useTableAnimations";
import { useWinnerInfo } from "../../../hooks/useWinnerInfo";
import { winAnimationPosition } from "../../../utils/PositionArray";
import { WinAnimationProps } from "../../../types/index";
import "./WinAnimation.css";

const WinAnimation: React.FC<WinAnimationProps> = React.memo(({ index }) => {
  const { id } = useParams<{ id: string }>();
  const { tableSize } = useTableAnimations(id);
  const { winnerInfo } = useWinnerInfo(id);

  // Determine the animation position based on table size
  const position = useMemo(() => {
    switch (tableSize) {
      case 9:
        return winAnimationPosition.nine[index];
      case 6:
        return winAnimationPosition.six[index];
      case 2:
        return winAnimationPosition.two[index];
      default:
        return undefined;
    }
  }, [tableSize, index]);

  // Check if this seat is among the winners
  const isWinner = !!winnerInfo?.some((w) => w.seat === index + 1);

  // Don't render if not a winner or position is unavailable
  if (!isWinner || !position) {
    return null;
  }

  return (
    <div
      className="win-animation-container"
      style={{
        left: position.left,
        top: position.top,
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`win-animation-ring win-animation-ring-${i}`}
        />
      ))}
    </div>
  );
});

WinAnimation.displayName = "WinAnimation";

export default WinAnimation;
