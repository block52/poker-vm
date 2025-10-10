import React from "react";
import { usePlayerTimeoutManager } from "../../hooks/usePlayerTimeoutManager";
import { useGameStateContext } from "../../context/GameStateContext";

/**
 * Debug component to show player timeout information
 * Only visible in development mode
 */
interface PlayerTimeoutDebugProps {
    tableId?: string;
}

export const PlayerTimeoutDebug: React.FC<PlayerTimeoutDebugProps> = ({ tableId }) => {
    const { timeoutCounts, isActive } = usePlayerTimeoutManager(tableId);
    const { gameState } = useGameStateContext();

    // Only show in development mode
    if (import.meta.env.VITE_NODE_ENV !== "development") {
        return null;
    }

    if (!isActive || !gameState?.players) {
        return (
            <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
                <div>Timeout Manager: Inactive</div>
            </div>
        );
    }

    const nextToActPlayer = gameState.players.find(p => p.seat === gameState.nextToAct);
    
    return (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs max-w-xs">
            <div className="font-bold mb-1">Timeout Manager</div>
            <div>Status: {isActive ? "Active" : "Inactive"}</div>
            <div>Next to Act: Seat {gameState.nextToAct}</div>
            {nextToActPlayer && (
                <div>Player: {nextToActPlayer.address?.slice(0, 6)}...</div>
            )}
            <div className="mt-2">
                <div className="font-semibold">Timeout Counts:</div>
                {timeoutCounts.size === 0 ? (
                    <div>None</div>
                ) : (
                    Array.from(timeoutCounts.entries()).map(([address, count]) => (
                        <div key={address}>
                            {address.slice(0, 6)}...: {count}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};