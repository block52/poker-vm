import React from "react";
import { useParams } from "react-router-dom";
import { useGameProgress } from "../hooks/useGameProgress";
import { IoMdRefresh } from "react-icons/io";
import { formatPlayerId, formatAmount } from "../utils/accountUtils";
import { ActionsLogPokerAction } from "../types/index";

// Simple component to display only the action log
const ActionsLog: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { previousActions, refresh } = useGameProgress(id);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    
    // Handle manual refresh
    const handleRefresh = () => {
        if (refresh && !isRefreshing) {
            setIsRefreshing(true);
            refresh().finally(() => {
                setTimeout(() => setIsRefreshing(false), 500);
            });
        }
    };

    return (
        <div className="text-white rounded w-full h-full overflow-y-auto scrollbar-hide bg-black/30 backdrop-blur-sm">
            <div className="flex justify-between items-center p-2 border-b border-white/20">
                <h3 className="text-sm font-semibold">Action Log</h3>
                <button 
                    onClick={handleRefresh} 
                    disabled={isRefreshing}
                    className={`text-white/70 hover:text-white/90 transition-all ${isRefreshing ? "animate-spin" : ""}`}
                    title="Refresh actions"
                >
                    <IoMdRefresh size={16} />
                </button>
            </div>
            
            {previousActions && previousActions.length > 0 ? (
                <div className="space-y-0.5 p-2">
                    {previousActions.map((action: ActionsLogPokerAction, index: number) => (
                        <div key={index} className="text-xs py-1 border-b border-white/10">
                            <div className="flex justify-between">
                                <span className="font-mono text-blue-300/90">
                                    {formatPlayerId((action.playerId || action.address) as string)}
                                </span>
                                <span className="text-gray-400 text-[10px]">
                                    Seat {action.seat}
                                </span>
                            </div>
                            <div className="flex justify-between mt-0.5">
                                <span className="text-gray-200">
                                    {action.action}
                                    {action.amount && formatAmount(action.amount)}
                                </span>
                                <span className="text-gray-400 text-[10px]">
                                    {action.round}
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