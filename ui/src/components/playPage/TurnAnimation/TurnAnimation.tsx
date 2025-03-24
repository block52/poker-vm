import React from "react";
import { useTableContext } from "../../../context/TableContext";

interface TurnAnimationProps {
    left?: string;
    top?: string;
    index: number;
}

const TurnAnimation: React.FC<TurnAnimationProps> = ({ left, top, index }) => {
    const { tableData } = useTableContext();
    
    // Use tableData.data.players instead of players from PlayerContext
    const players = tableData?.data?.players || [];
    
    // Only show the turn animation for the player who's next to act
    const isNextToAct = tableData?.data?.nextToAct === index;

    if (!isNextToAct) return null;
    
    return (
        <div
            className="hidden opacity-0 animate-pulse"
            style={{
                position: "absolute",
                left: left,
                top: top,
                width: "100px",
                height: "100px",
                backgroundColor: "#3498db",
                borderRadius: "50%",
                boxShadow: "0 0 10px 5px #2980b9",
                transition: "all 0.3s ease"
            }}
        ></div>
    );
};

export default TurnAnimation;
