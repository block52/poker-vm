import React, { useEffect, useState } from "react";
import { useTableAnimations } from "../../../hooks/useTableAnimations";
import { useNextToActInfo } from "../../../hooks/useNextToActInfo";
import { useParams } from "react-router-dom";
import { turnAnimationPosition } from "../../../utils/PositionArray";

interface TurnAnimationProps {
    index: number;
}

const TurnAnimation: React.FC<TurnAnimationProps> = ({ index }) => {
    const { id } = useParams<{ id: string }>();
    const { tableSize } = useTableAnimations(id);
    const { nextToActInfo } = useNextToActInfo(id);
    const [isCurrentPlayersTurn, setIsCurrentPlayersTurn] = useState(false);
    const [position, setPosition] = useState<any>(null);

    useEffect(() => {
        if (nextToActInfo?.seat === index + 1) {
            setIsCurrentPlayersTurn(true);
        } else {
            setIsCurrentPlayersTurn(false);
        }
    }, [nextToActInfo, index]);

    useEffect(() => {
        if (tableSize === 9) {
            setPosition(turnAnimationPosition.nine[index]);
        } else {
            setPosition(turnAnimationPosition.six[index]);
        }
    }, [tableSize, index]);

    if (!isCurrentPlayersTurn || !position) {
        return null;
    }

    // Determine pulse speed
    const baseRingStyle = {
        width: "220px",
        height: "110px",
        borderRadius: "9999px",
        position: "absolute" as const,
        left: "0",
        top: "0",
        transform: "translate(-50%, -50%)",
        backgroundColor: "rgba(100, 255, 218, 0.1)",
        border: "2px solid rgba(100, 255, 218, 0.3)",
        animation: "ripple 2.4s linear infinite"
    };

    return (
        <>
            <style>{`
                @keyframes ripple {
                    0% {
                        transform: scale(0.6);
                        opacity: 0.4;
                    }
                    80% {
                        transform: scale(1.1);
                        opacity: 0.05;
                    }
                    100% {
                        transform: scale(1.1);
                        opacity: 0;
                    }
                }
            `}</style>
            <div
                className="absolute z-[0] pointer-events-none"
                style={{
                    left: position.left,
                    top: position.top,
                    width: "220px",
                    height: "110px",
                    transform: "translate(-50%, calc(-50% - 20px))"
                }}
            >
                {[0, 1, 2, 3].map(i => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(255, 255, 255, 0.6)",
                            borderRadius: "9999px",
                            animation: "ripple 2000ms linear infinite",
                            animationDelay: `${-i * 455}ms`
                        }}
                    />
                ))}
            </div>
        </>
    );
};

export default TurnAnimation;
