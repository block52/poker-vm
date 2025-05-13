import React, { useEffect, useState, useMemo } from "react";
import { useTableAnimations } from "../../../hooks/useTableAnimations";
import { useNextToActInfo } from "../../../hooks/useNextToActInfo";
import { useParams } from "react-router-dom";
import { turnAnimationPosition } from "../../../utils/PositionArray";

interface TurnAnimationProps {
    index: number;
}

// Add React.memo to prevent re-renders when props don't change
const TurnAnimation: React.FC<TurnAnimationProps> = React.memo(({ index }) => {
    const { id } = useParams<{ id: string }>();
    const { tableSize } = useTableAnimations(id);
    const { nextToActInfo } = useNextToActInfo(id);
    const [isCurrentPlayersTurn, setIsCurrentPlayersTurn] = useState(false);
    
    // Check for reduced motion preference - only calculate once
    const prefersReducedMotion = useMemo(() => 
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false, 
    []);
    
    // Memoize the position calculation
    const position = useMemo(() => {
        if (tableSize === 9) {
            return turnAnimationPosition.nine[index];
        } else {
            return turnAnimationPosition.six[index];
        }
    }, [tableSize, index]);

    // Check if it's the current player's turn
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
            {prefersReducedMotion ? (
                // Simplified static version for reduced motion preference
                <div className="turn-animation-static" />
            ) : (
                // Single animated element instead of multiple
                <div className="turn-animation-pulse" />
            )}
        </div>
    );
});

// Add display name for debugging
TurnAnimation.displayName = "TurnAnimation";

export default TurnAnimation;

