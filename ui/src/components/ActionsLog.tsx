import React from "react";
import { useParams } from "react-router-dom";
import { useGameProgress } from "../hooks/useGameProgress";
import { formatPlayerId, formatAmount } from "../utils/accountUtils";
import { ActionDTO } from "@bitcoinbrisbane/block52";
import { colors } from "../utils/colorConfig";

// Function to format action names with proper capitalization and spacing
const formatActionName = (action: string): string => {
    switch (action.toLowerCase()) {
        case "join":
            return "Join";
        case "post-small-blind":
            return "Post Small Blind";
        case "post-big-blind":
            return "Post Big Blind";
        case "deal":
            return "Deal";
        case "call":
            return "Call";
        case "check":
            return "Check";
        case "bet":
            return "Bet";
        case "raise":
            return "Raise";
        case "fold":
            return "Fold";
        case "show":
            return "Show";
        case "muck":
            return "Muck";
        case "all-in":
            return "All In";
        case "leave":
            return "Leave";
        case "sit-out":
            return "Sit Out";
        case "sit-in":
            return "Sit In";
        case "new-hand":
            return "New Hand";
        default:
            // Fallback: capitalize first letter and replace hyphens with spaces
            return action.charAt(0).toUpperCase() + action.slice(1).replace(/-/g, " ");
    }
};

// Function to format round names with proper poker terminology
const formatRoundName = (round: string): string => {
    switch (round.toLowerCase()) {
        case "ante":
            return "Ante";
        case "preflop":
            return "Pre-flop";
        case "flop":
            return "Flop";
        case "turn":
            return "Turn";
        case "river":
            return "River";
        case "showdown":
            return "Showdown";
        case "end":
            return "End";
        default:
            // Fallback: capitalize first letter
            return round.charAt(0).toUpperCase() + round.slice(1);
    }
};

// Simple component to display only the action log
const ActionsLog: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { previousActions } = useGameProgress(id);

    return (
        <div 
            className="rounded w-full h-full overflow-y-auto scrollbar-hide backdrop-blur-sm"
            style={{
                color: "white",
                backgroundColor: colors.table.bgBase + "/30"
            }}
        >
            <div 
                className="flex justify-between items-center p-2 border-b"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
            >
                <h3 className="text-sm font-semibold">History</h3>
            </div>
            
            {previousActions && previousActions.length > 0 ? (
                <div className="space-y-0.5 p-2">
                    {previousActions.map((action: ActionDTO, index: number) => (
                        <div 
                            key={index} 
                            className="text-xs py-1 border-b" 
                            style={{ borderColor: "rgba(255,255,255,0.1)" }}
                        >
                            <div className="flex justify-between">
                                <span 
                                    className="font-mono"
                                    style={{ color: colors.brand.primary + "e6" }}
                                >
                                    {formatPlayerId(action.playerId)}
                                </span>
                                <span 
                                    className="text-[10px]"
                                    style={{ color: colors.ui.textSecondary }}
                                >
                                    Seat {action.seat}
                                </span>
                            </div>
                            <div className="flex justify-between mt-0.5">
                                <span style={{ color: "#e5e7eb" }}>
                                    {formatActionName(action.action)}
                                    {action.amount && ` ${formatAmount(action.amount)}`}
                                </span>
                                <span 
                                    className="text-[10px]"
                                    style={{ color: colors.ui.textSecondary }}
                                >
                                    {formatRoundName(action.round)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p 
                    className="text-xs p-3"
                    style={{ color: colors.ui.textSecondary }}
                >
                    No actions recorded yet.
                </p>
            )}
        </div>
    );
};

export default ActionsLog; 