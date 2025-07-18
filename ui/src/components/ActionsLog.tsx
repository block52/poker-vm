import React from "react";
import { useParams } from "react-router-dom";
import { useGameProgress } from "../hooks/useGameProgress";
import { formatPlayerId, formatAmount } from "../utils/accountUtils";
import { ActionDTO } from "@bitcoinbrisbane/block52";

// Function to format action names with proper capitalization and spacing
const formatActionName = (action: string): string => {
    switch (action.toLowerCase()) {
        case 'join':
            return 'Join';
        case 'post-small-blind':
            return 'Post Small Blind';
        case 'post-big-blind':
            return 'Post Big Blind';
        case 'deal':
            return 'Deal';
        case 'call':
            return 'Call';
        case 'check':
            return 'Check';
        case 'bet':
            return 'Bet';
        case 'raise':
            return 'Raise';
        case 'fold':
            return 'Fold';
        case 'show':
            return 'Show';
        case 'muck':
            return 'Muck';
        case 'all-in':
            return 'All In';
        case 'leave':
            return 'Leave';
        case 'sit-out':
            return 'Sit Out';
        case 'sit-in':
            return 'Sit In';
        case 'new-hand':
            return 'New Hand';
        default:
            // Fallback: capitalize first letter and replace hyphens with spaces
            return action.charAt(0).toUpperCase() + action.slice(1).replace(/-/g, ' ');
    }
};

// Function to format round names with proper poker terminology
const formatRoundName = (round: string): string => {
    switch (round.toLowerCase()) {
        case 'ante':
            return 'Ante';
        case 'preflop':
            return 'Pre-flop';
        case 'flop':
            return 'Flop';
        case 'turn':
            return 'Turn';
        case 'river':
            return 'River';
        case 'showdown':
            return 'Showdown';
        case 'end':
            return 'End';
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
        <div className="text-white rounded w-full h-full overflow-y-auto scrollbar-hide bg-black/30 backdrop-blur-sm">
            <div className="flex justify-between items-center p-2 border-b border-white/20">
                <h3 className="text-sm font-semibold">Action Log</h3>
            </div>
            
            {previousActions && previousActions.length > 0 ? (
                <div className="space-y-0.5 p-2">
                    {previousActions.map((action: ActionDTO, index: number) => (
                        <div key={index} className="text-xs py-1 border-b border-white/10">
                            <div className="flex justify-between">
                                <span className="font-mono text-blue-300/90">
                                    {formatPlayerId(action.playerId)}
                                </span>
                                <span className="text-gray-400 text-[10px]">
                                    Seat {action.seat}
                                </span>
                            </div>
                            <div className="flex justify-between mt-0.5">
                                <span className="text-gray-200">
                                    {formatActionName(action.action)}
                                    {action.amount && ` ${formatAmount(action.amount)}`}
                                </span>
                                <span className="text-gray-400 text-[10px]">
                                    {formatRoundName(action.round)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400 text-xs p-3">No actions recorded yet.</p>
            )}
        </div>
    );
};

export default ActionsLog; 