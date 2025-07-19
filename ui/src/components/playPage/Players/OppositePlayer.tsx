/**
 * OppositePlayer Component
 *
 * This component represents other players at the poker table (not the current user).
 * It displays:
 * - Player's cards (face down unless showing)
 * - Player's stack amount
 * - Player's status (folded, all-in, etc.)
 * - Winner information if applicable
 *
 * PlayerPopUpCard Integration:
 * The PlayerPopUpCard is a popup menu that appears when clicking on an opponent's position.
 * It provides:
 * 1. Seat Changing:
 *    - Shows "SIT HERE" button
 *    - Triggers table rotation when clicked
 *    - Updates player positions via setStartIndex
 *
 * 2. Player Information:
 *    - Shows the seat number
 *    - Displays player's color theme
 *    - Future: Will show player statistics and history
 *
 * 3. Interactive Features:
 *    - Note-taking capability (placeholder)
 *    - Player rating system (placeholder)
 *    - Quick actions menu (placeholder)
 *
 * The popup appears when:
 * - isCardVisible === index (meaning this specific player's card should be shown)
 * - It slides in from the top with an animation
 * - It can be closed using the X button
 *
 * Props:
 * - left/top: Position on the table
 * - index: Seat number
 * - currentIndex: Current round index
 * - color: Player's color theme
 * - status: Player's current status
 * - isCardVisible: Controls card visibility
 * - setCardVisible: Function to toggle card visibility
 * - setStartIndex: Function to change table rotation
 */

import * as React from "react";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import PlayerPopUpCard from "./PlayerPopUpCard";
import { useWinnerInfo } from "../../../hooks/useWinnerInfo";
import { usePlayerData } from "../../../hooks/usePlayerData";
import { useShowingCardsByAddress } from "../../../hooks/useShowingCardsByAddress";
import { useDealerPosition } from "../../../hooks/useDealerPosition";
import CustomDealer from "../../../assets/CustomDealer.svg";

type OppositePlayerProps = {
    left?: string;
    top?: string;
    index: number;
    currentIndex: number;
    color?: string;
    status?: string;
    isCardVisible: number;
    setCardVisible: (index: number) => void;
    setStartIndex: (index: number) => void;
};

const OppositePlayer: React.FC<OppositePlayerProps> = React.memo(({ left, top, index, color, isCardVisible, setCardVisible, setStartIndex }) => {
    const { playerData, stackValue, isFolded, isAllIn, holeCards, round } = usePlayerData(index);
    const { winnerInfo } = useWinnerInfo();
    const { showingPlayers } = useShowingCardsByAddress();
    const { dealerSeat } = useDealerPosition();
    
    // Check if this seat is the dealer
    const isDealer = dealerSeat === index;

    // 1) detect when any winner exists
    const hasWinner = React.useMemo(() => Array.isArray(winnerInfo) && winnerInfo.length > 0, [winnerInfo]);

    // Check if this player is a winner
    const isWinner = React.useMemo(() => {
        if (!winnerInfo) return false;
        return winnerInfo.some((winner: any) => winner.seat === index);
    }, [winnerInfo, index]);

    // 2) dim non-winners when someone has won
    const opacityClass = hasWinner ? (isWinner ? "opacity-100" : "opacity-40") : isFolded ? "opacity-60" : "opacity-100";

    // Get winner amount if this player is a winner
    const winnerAmount = React.useMemo(() => {
        if (!isWinner || !winnerInfo) return null;
        const winner = winnerInfo.find((w: any) => w.seat === index);
        return winner ? winner.formattedAmount : null;
    }, [isWinner, winnerInfo, index]);

    // Check if this player is showing cards
    const isShowingCards = React.useMemo(() => {
        if (!showingPlayers || !playerData) return false;
        return showingPlayers.some((p: { seat: number }) => p.seat === index);
    }, [showingPlayers, playerData, index]);

    // Get the showing cards for this player if available
    const showingCards = React.useMemo(() => {
        if (!isShowingCards || !showingPlayers) return null;
        const playerShowingCards = showingPlayers.find((p: { seat: number; holeCards: string[] }) => p.seat === index);
        return playerShowingCards ? playerShowingCards.holeCards : null;
    }, [isShowingCards, showingPlayers, index]);

    if (!playerData) {
        return <></>;
    }

    return (
        <>
            {/* Main player display */}
            <div
                key={index}
                className={`${opacityClass} absolute flex flex-col justify-center text-gray-600 w-[160px] h-[140px] mt-[40px] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-[20]`}
                style={{
                    left: left,
                    top: top,
                    transition: "top 1s ease, left 1s ease"
                }}
                onClick={() => {
                    console.log("OppositePlayer clicked:", index);
                    setCardVisible(index);
                }}
            >
                <div className="flex justify-center gap-1">
                    {holeCards && holeCards.length === 2 ? (
                        isShowingCards && showingCards ? (
                            // Show the actual cards if player is showing
                            <>
                                <img src={`/cards/${showingCards[0]}.svg`} alt="Player Card 1" width={60} height={80} className="mb-[11px]" />
                                <img src={`/cards/${showingCards[1]}.svg`} alt="Player Card 2" width={60} height={80} className="mb-[11px]" />
                            </>
                        ) : (
                            // Show card backs if not showing
                            <>
                                <img src="/cards/BackCustom.svg" alt="Opposite Player Card" width={60} height={80} className="mb-[11px]"  />
                                <img src="/cards/BackCustom.svg" alt="Opposite Player Card" width={60} height={80} className="mb-[11px]"  />
                            </>
                        )
                    ) : (
                        <div className="w-[120px] h-[80px]"></div>
                    )}
                </div>
                <div className="relative flex flex-col justify-end mt-[-6px] mx-1">
                    <div
                        style={{ backgroundColor: isWinner ? "#2c8a3c" : color }}
                        className={`b-[0%] mt-[auto] w-full h-[55px] shadow-[1px_2px_6px_2px_rgba(0,0,0,0.3)] rounded-tl-2xl rounded-tr-2xl rounded-bl-md rounded-br-md flex flex-col ${
                            isWinner 
                        }`}
                    >
                        {/* Progress bar is not shown in showdown */}
                        {!isWinner && round !== "showdown" && <ProgressBar index={index} />}
                        {!isWinner && isFolded && (
                            <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">FOLD</span>
                        )}
                        {!isWinner && isAllIn && (
                            <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">
                                ALL IN
                            </span>
                        )}
                        {isShowingCards && !isWinner && (
                            <span className="text-white animate-progress delay-2000 flex items-center w-full h-2 mb-2 mt-auto gap-2 justify-center">
                                SHOWING
                            </span>
                        )}
                        {isWinner && winnerAmount && (
                            <span className="text-white font-bold flex items-center justify-center w-full h-8 mt-[22px] gap-1 text-base">
                                WINS: {winnerAmount}
                            </span>
                        )}
                    </div>
                    <div className="absolute top-[-10px] w-full">
                        <Badge count={index} value={stackValue} color={color} />
                    </div>

                    {/* Dealer Button - TODO: Implement framer motion animation in future iteration */}
                    {isDealer && (
                        <div className="absolute top-[-85px] right-[-40px] w-12 h-12 z-20">
                            <img src={CustomDealer} alt="Dealer Button" className="w-full h-full" />
                        </div>
                    )}
                </div>
            </div>

            {/* PlayerPopUpCard Integration
                This popup menu appears when clicking on a player's position.
                It provides:
                1. Quick seat changing functionality
                2. Player information display
                3. Future features for notes and ratings
                
                The popup is positioned absolutely and uses animations for smooth transitions.
                It's only rendered when isCardVisible matches this player's index.
            */}
            <div
                className={`absolute z-[1000] transition-all duration-1000 ease-in-out transform ${
                    isCardVisible === index ? "opacity-100 animate-slide-left-to-right" : "opacity-0 animate-slide-top-to-bottom"
                }`}
                style={{
                    left: left,
                    top: top,
                    transform: "translate(-50%, -50%)"
                }}
            >
                {isCardVisible === index && (
                    <PlayerPopUpCard
                        id={index + 1}
                        label="SIT HERE"
                        color={color}
                        isVacant={false}
                        setStartIndex={(index: number) => setStartIndex(index)}
                        onClose={() => setCardVisible(-1)}
                    />
                )}
            </div>
        </>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function - only re-render if meaningful props change
    return (
        prevProps.left === nextProps.left &&
        prevProps.top === nextProps.top &&
        prevProps.index === nextProps.index &&
        prevProps.color === nextProps.color &&
        prevProps.isCardVisible === nextProps.isCardVisible
        // Note: setCardVisible and setStartIndex are function props that shouldn't cause re-renders
    );
});

export default OppositePlayer;
