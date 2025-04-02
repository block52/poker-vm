import React from "react";
import { useTableContext } from "../../../context/TableContext";
import { turnAnimationPosition } from "../../../utils/PositionArray";

interface TurnAnimationProps {
    index: number;
}

const TurnAnimation: React.FC<TurnAnimationProps> = ({ index }) => {
    const { tableData, nextToActInfo, tableSize } = useTableContext();

    const isNextToAct = tableData?.data?.nextToAct === index;
    if (!isNextToAct) return null;

    const timeRemaining = nextToActInfo?.seat === index ? nextToActInfo?.timeRemaining ?? 15 : 15;

    // Dynamically get animation position from array
    const turnPos =
        turnAnimationPosition?.[tableSize === 6 ? "six" : "nine"]?.[index] || { left: "0px", top: "0px" };

    // Determine pulse speed
    let animationDuration = "2.5s";
    if (timeRemaining < 5) animationDuration = "2s";
    else if (timeRemaining < 10) animationDuration = "2.5s";
    else if (timeRemaining < 15) animationDuration = "3s";

    return (
        <>
            <style>{`
                @keyframes ripple {
                    0% {
                        transform: scale(0.8);
                        opacity: 0.4;
                    }
                    50% {
                        transform: scale(1);
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(0.8);
                        opacity: 0.4;
                    }
                }
            `}</style>
            <div
                className="absolute z-[0] pointer-events-none"
                style={{
                    left: turnPos.left,
                    top: turnPos.top,
                    width: "160px",
                    height: "160px",
                    transform: "translate(-50%, calc(-50% - 20px))",
                }}
            > 
             {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            border: "2px solid rgba(255,255,255,0.1)",
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            borderRadius: "9999px",
                            animation: `ripple 2.5s linear infinite`,
                            animationDelay: `${i * 455}ms`
                        }}
                    />
                ))}
            </div>
        </>
           
        
    );
};

export default TurnAnimation;