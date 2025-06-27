import React from "react";
import { usePlayerActionDropBox, PlayerActionDisplay } from "../../../hooks/usePlayerActionDropBox";
import "./Badge.css";

// Action display component moved into Badge
const ActionDisplay: React.FC<{ actionDisplay: PlayerActionDisplay; playerColor?: string }> = ({ 
    actionDisplay, 
    playerColor = "#3b82f6" 
}) => {
    if (!actionDisplay.isVisible && !actionDisplay.isAnimatingOut) {
        return null;
    }

    return (
        <div
            className={`action-display-container ${
                actionDisplay.isAnimatingOut 
                    ? "action-display-exit" 
                    : "action-display-enter"
            }`}
        >
            {/* Action Box */}
            <div
                className={`action-display-box ${
                    !actionDisplay.isAnimatingOut ? "action-display-pulse" : ""
                }`}
                style={{
                    backgroundColor: `${playerColor}dd`,
                    borderColor: playerColor,
                    boxShadow: `0 4px 12px ${playerColor}40, 0 2px 4px rgba(0,0,0,0.3)`
                }}
            >
                <div className="action-display-content">
                    <span className="action-display-text">
                        {actionDisplay.action}
                    </span>
                    {actionDisplay.amount && (
                        <span className="action-display-amount">
                            {actionDisplay.amount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

type BadgeProps = {
    count: number; // The number displayed in the badge
    value: number; // The larger number displayed next to the badge
    color?: string;
    // Timer extension props
    canExtend?: boolean;
    onExtend?: () => void;
};

const Badge: React.FC<BadgeProps> = React.memo(({ count, value, color, canExtend, onExtend }) => {
    // Format the value to always show 2 decimal places
    const formattedValue = value.toFixed(2);
    
    // Get action display data for this player
    const actionDisplay = usePlayerActionDropBox(count);

    return (
        <div className="badge-container">
            <div style={{ backgroundColor: color }} className="badge-number">
                {count}
            </div>
            <div className="badge-value">${formattedValue}</div>

            {/* Player Action Drop Box - positioned below the price */}
            <ActionDisplay 
                actionDisplay={actionDisplay}
                playerColor={color}
            />
            
            {/* Timer Extension Icon - Timer icon inside badge */}
            {canExtend && onExtend && (
                <div 
                    className="timer-extension-button"
                    onClick={onExtend}
                >
                    <svg 
                        className="timer-extension-icon" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        {/* Clock circle */}
                        <circle cx="12" cy="12" r="8" strokeWidth="2"/>
                        {/* Clock hands */}
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"/>
                        {/* Plus symbol in corner */}
                        <circle cx="18" cy="6" r="3" fill="currentColor"/>
                        <path stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 6h2M18 5v2"/>
                    </svg>
                </div>
            )}
        </div>
    );
});

export default Badge;
