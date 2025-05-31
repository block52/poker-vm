import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { usePlayerTimer } from "../../../hooks/usePlayerTimer";
import { useGameOptions } from "../../../hooks/useGameOptions";
import { useGameStateContext } from "../../../context/GameStateContext";


type ProgressBarProps = {
    index: number;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ index }) => {
    const { id } = useParams<{ id: string }>();
    const { 
        isActive, 
        timeRemaining, 
        timeoutValue, 
        extendTime, 
        hasUsedExtension, 
        canExtend 
    } = usePlayerTimer(id, index);
    const { gameOptions } = useGameOptions();
    const { gameState } = useGameStateContext();
    
    // State for extension UI feedback only
    const [showExtensionPopup, setShowExtensionPopup] = useState(false);
    const [isExtending, setIsExtending] = useState(false);

    // Check if this seat belongs to the current user
    const isCurrentUser = useMemo(() => {
        const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
        if (!userAddress || !gameState?.players) return false;
        
        const playerAtThisSeat = gameState.players.find(p => p.seat === index);
        return playerAtThisSeat?.address?.toLowerCase() === userAddress;
    }, [gameState?.players, index]);

    // Check if it's currently this user's turn
    const isCurrentUserTurn = useMemo(() => {
        return isCurrentUser && gameState?.nextToAct === index;
    }, [isCurrentUser, gameState?.nextToAct, index]);

    // Get the timeout duration from game options
    const timeoutDuration = useMemo(() => {
        if (!gameOptions?.timeout) return 30;
        return Math.floor((gameOptions.timeout * 100) / 1000); // Convert deciseconds to seconds
    }, [gameOptions]);

    // Show popup based on canExtend from timer hook
    useEffect(() => {
        if (canExtend && isCurrentUserTurn && !isExtending) {
            setShowExtensionPopup(true);
        } else {
            setShowExtensionPopup(false);
        }
    }, [canExtend, isCurrentUserTurn, isExtending]);

    // Reset extending state when turn changes
    useEffect(() => {
        if (!isActive || !isCurrentUserTurn) {
            setShowExtensionPopup(false);
            setIsExtending(false);
        }
    }, [isActive, isCurrentUserTurn]);

    // Handle time extension using the timer hook function
    const handleExtendTime = () => {
        setIsExtending(true);
        setShowExtensionPopup(false);
        
        // Use the timer hook's extend function
        extendTime?.();
        
        // Show brief feedback then reset
        setTimeout(() => {
            setIsExtending(false);
        }, 1500);
    };

    // If player is not active, don't show progress bar
    if (!isActive) {
        return null;
    }

    // Calculate progress percentage (100% when full time, 0% when time's up)
    const progressPercentage = (timeRemaining / timeoutValue) * 100;

    // Determine color based on extension status from timer hook
    const getProgressColor = () => {
        if (hasUsedExtension) {
            return "#ef4444"; // Red after extension used
        }
        return "#ffffff"; // White for normal
    };

    return (
        <div className="animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 relative">
            <span className="ml-2 text-white text-sm w-[15px]">{timeRemaining}</span>
            <div className="relative flex-1 mr-[10px] h-full w-[calc(100%-25px)] bg-[#f0f0f030] rounded-md overflow-hidden">
                <div
                    className="absolute top-0 left-0 h-full transition-all duration-1000 ease-linear"
                    style={{
                        width: `${progressPercentage}%`,
                        backgroundColor: getProgressColor()
                    }}
                ></div>
            </div>
            
            {/* Extension Popup - Only show for current user on their turn */}
            {showExtensionPopup && isCurrentUserTurn && (
                <div className="absolute right-[-120px] top-[-40px] z-50 animate-pulse">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg shadow-lg border border-blue-400 flex items-center gap-2 cursor-pointer hover:from-blue-500 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
                         onClick={handleExtendTime}>
                        {/* Stopwatch Icon */}
                        <svg 
                            className="w-4 h-4 text-white animate-spin" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                            />
                        </svg>
                        <span className="text-sm font-medium">+{timeoutDuration}s</span>
                    </div>
                    
                    {/* Pointer arrow */}
                    <div className="absolute left-[-8px] top-1/2 transform -translate-y-1/2">
                        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-blue-600 border-b-[8px] border-b-transparent"></div>
                    </div>
                </div>
            )}
            
            {/* Extension in progress indicator */}
            {isExtending && isCurrentUserTurn && (
                <div className="absolute right-[-80px] top-[-20px] z-50">
                    <div className="bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Extended!</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgressBar;
