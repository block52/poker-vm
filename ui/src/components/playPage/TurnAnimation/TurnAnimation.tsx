import React, { useEffect, useState, useMemo } from "react";
import { useTableAnimations } from "../../../hooks/useTableAnimations";
import { useNextToActInfo } from "../../../hooks/useNextToActInfo";
import { useParams } from "react-router-dom";
import { turnAnimationPosition } from "../../../utils/PositionArray";
import { TurnAnimationProps } from "../../../types/index";
import "./TurnAnimation.css";

const TurnAnimation: React.FC<TurnAnimationProps> = React.memo(({ index }) => {
    const { id } = useParams<{ id: string }>();
    const { tableSize } = useTableAnimations(id);
    const { nextToActInfo } = useNextToActInfo(id);
    const [isCurrentPlayersTurn, setIsCurrentPlayersTurn] = useState(false);
    
    // Memoize position to avoid unnecessary calculations
    const position = useMemo(() => {
        if (tableSize === 9) {
            return turnAnimationPosition.nine[index];
        } else if (tableSize === 6) {
            return turnAnimationPosition.six[index];
        } else {
            return turnAnimationPosition.two[index];
        }
    }, [tableSize, index]);

    // Check if it's the current player's turn with useEffect
    useEffect(() => {
        const isTurn = nextToActInfo?.seat === index + 1;
        if (isCurrentPlayersTurn !== isTurn) {
            setIsCurrentPlayersTurn(isTurn);
        }
    }, [nextToActInfo?.seat, index, isCurrentPlayersTurn]);

    // Don't render anything if it's not this player's turn or position isn't available
    if (!isCurrentPlayersTurn || !position) {
        return null;
    }

    return (
        <div 
            className="turn-animation-container"
            style={{
                left: position.left,
                top: position.top,
            }}
        >
            {[0, 1, 2, 3].map(i => (
                <div
                    key={i}
                    className={`turn-animation-ring turn-animation-ring-${i}`}
                />
            ))}
        </div>
    );
});

// Add display name for debugging
TurnAnimation.displayName = "TurnAnimation";

export default TurnAnimation;