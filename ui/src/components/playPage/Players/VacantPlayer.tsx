/**
 * VacantPlayer Component
 * 
 * This component represents an empty seat at the poker table.
 * It displays:
 * - Empty seat indicator
 * - Join button for available seats
 * - Confirmation modal for joining
 * 
 * Behavior:
 * 1. For New Users (not in table):
 *    - Clicking shows join confirmation modal directly
 *    - No popup is shown
 *    - Direct path to joining the table
 * 
 * 2. For Existing Users (already in table):
 *    - Clicking shows "CHANGE SEAT" popup
 *    - Popup triggers join confirmation modal
 *    - Allows seat changing functionality
 * 
 * PlayerPopUpCard Integration:
 * The PlayerPopUpCard is a popup menu that appears when clicking on a vacant seat.
 * It serves several purposes:
 * 1. Seat Management:
 *    - Shows seat number and availability
 *    - Provides "CHANGE SEAT" button for future implementation
 *    - Will handle seat change confirmation
 * 
 * 2. Seat Information:
 *    - Displays seat number
 *    - Shows seat status (available/taken)
 *    - Future: Will show seat preferences and history
 * 
 * 3. Interactive Features:
 *    - Note-taking for seat preferences (placeholder)
 *    - Seat rating system (placeholder)
 *    - Quick actions menu (placeholder)
 * 
 * The popup appears when:
 * - isCardVisible is true
 * - It slides in with an animation
 * - It can be closed using the X button
 * 
 * Props:
 * - left/top: Position on the table
 * - index: Seat number
 */

import * as React from "react";
import { memo, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import PokerProfile from "../../../assets/PokerProfile.svg";

import { useVacantSeatData } from "../../../hooks/useVacantSeatData";
import type { VacantPlayerProps } from "../../../types/index";
import PlayerPopUpCard from "./PlayerPopUpCard";
import { useDealerPosition } from "../../../hooks/useDealerPosition";
import { joinTable } from "../../../hooks/playerActions/joinTable";
import { useGameOptions } from "../../../hooks/useGameOptions";
import CustomDealer from "../../../assets/CustomDealer.svg";

const VacantPlayer: React.FC<VacantPlayerProps> = memo(
    ({ left, top, index, onJoin }) => {
        const { isUserAlreadyPlaying, isSeatVacant: checkSeatVacant, canJoinSeat: checkCanJoinSeat } = useVacantSeatData();
        const { id: tableId } = useParams<{ id: string }>();
        const { gameOptions } = useGameOptions();
        const userAddress = localStorage.getItem("user_eth_public_key");
        const privateKey = localStorage.getItem("user_eth_private_key");

        const [showConfirmModal, setShowConfirmModal] = useState(false);
        const [isJoining, setIsJoining] = useState(false);
        const [joinError, setJoinError] = useState<string | null>(null);
        const [joinSuccess, setJoinSuccess] = useState(false);
        const [joinResponse, setJoinResponse] = useState<any>(null);
        const [isCardVisible, setIsCardVisible] = useState(false);

        const { dealerSeat } = useDealerPosition();
    
        // Check if this seat is the dealer
        const isDealer = dealerSeat === index;

        // Memoize seat status checks
        const isSeatVacant = useMemo(() => checkSeatVacant(index), [checkSeatVacant, index]);
        const canJoinThisSeat = useMemo(() => checkCanJoinSeat(index), [checkCanJoinSeat, index]);

        // Memoize handlers
        const handleJoinClick = useCallback(() => {
            if (!canJoinThisSeat) return;
            setShowConfirmModal(true);
            setJoinError(null);
            setJoinSuccess(false);
            setJoinResponse(null);
        }, [canJoinThisSeat]);

        const handleSeatClick = useCallback(() => {
            if (isUserAlreadyPlaying) {
                setIsCardVisible(true);
            } else if (canJoinThisSeat) {
                handleJoinClick();
            }
        }, [isUserAlreadyPlaying, canJoinThisSeat, handleJoinClick]);

        const handleConfirmSeat = useCallback(async () => {
            if (!userAddress || !privateKey || !tableId) {
                setJoinError("Missing required information to join table");
                return;
            }

            let buyInAmount = localStorage.getItem("buy_in_amount");
            if (!buyInAmount) {
                // No saved amount, use max buy-in from game options
                const maxBuyInWei = gameOptions?.maxBuyIn;
                if (!maxBuyInWei) {
                    setJoinError("Unable to determine buy-in amount");
                    return;
                }
                // Convert from Wei to regular units and save it
                buyInAmount = ethers.formatUnits(maxBuyInWei, 18);
                localStorage.setItem("buy_in_amount", buyInAmount);
            }

            setIsJoining(true);
            setJoinError(null);
            setJoinSuccess(false);

            try {
                // Convert amount to Wei for the join function
                const buyInWei = ethers.parseUnits(buyInAmount, 18).toString();
                
                // Use actual maxPlayers from game options, fallback to 9 if not available
                const maxPlayers = gameOptions?.maxPlayers || 9;
                
                const response = await joinTable(tableId, {
                    buyInAmount: buyInWei,
                    seatNumber: index
                }, maxPlayers);
                
                setJoinResponse(response);
                setJoinSuccess(true);
                setShowConfirmModal(false);
                setIsJoining(false);
                
                // Call onJoin after successful join
                if (onJoin) {
                    onJoin();
                }
            } catch (err) {
                console.error("Failed to join table:", err);
                setJoinError(err instanceof Error ? err.message : "Unknown error joining table");
                setIsJoining(false);
            }
        }, [userAddress, privateKey, tableId, index, onJoin, gameOptions?.maxPlayers, gameOptions?.maxBuyIn]);


        // Memoize container styles
        const containerStyle = useMemo(() => ({
            left,
            top
        }), [left, top]);

        // Memoize popup styles
        const popupStyle = useMemo(() => ({
            left,
            top,
            transform: "translate(-50%, -50%)"
        }), [left, top]);

        // Memoize popup class names
        const popupClassName = useMemo(() => 
            `absolute z-[1000] transition-all duration-1000 ease-in-out transform ${
                isCardVisible ? "opacity-100 animate-slide-left-to-right" : "opacity-0 animate-slide-top-to-bottom"
            }`,
            [isCardVisible]
        );

        // Memoize seat text
        const seatText = useMemo(() => ({
            title: isUserAlreadyPlaying ? "Vacant Seat" : `Seat ${index}`,
            subtitle: !isUserAlreadyPlaying ? (canJoinThisSeat ? "Click to Join" : "Seat Taken") : null
        }), [isUserAlreadyPlaying, canJoinThisSeat, index]);

        return (
            <>
                <div 
                    className="absolute cursor-pointer" 
                    style={containerStyle}
                    onClick={handleSeatClick}
                >
                    <div className="flex justify-center mb-2">
                        <img src={PokerProfile} className="w-12 h-12" alt="Vacant Seat" />
                    </div>
                    <div className="text-white text-center">
                        <div className="text-lg sm:text-sm mb-1 whitespace-nowrap font-medium">{seatText.title}</div>
                        {seatText.subtitle && <div className="text-base sm:text-xs whitespace-nowrap">{seatText.subtitle}</div>}
                    </div>

                    {/* Dealer Button - TODO: Implement framer motion animation in future iteration */}
                    {isDealer && (
                        <div className="absolute top-[-85px] right-[-40px] w-12 h-12 z-20">
                            <img src={CustomDealer} alt="Dealer Button" className="w-full h-full" />
                        </div>
                    )}
                </div>

                {/* PlayerPopUpCard - Only show for seat changing */}
                {isUserAlreadyPlaying && (
                    <div
                        className={popupClassName}
                        style={popupStyle}
                    >
                        {isCardVisible && (
                            <PlayerPopUpCard
                                id={index + 1}
                                label="CHANGE SEAT"
                                color="#4a5568"
                                isVacant={true}
                                setStartIndex={() => {
                                    handleJoinClick();
                                    setIsCardVisible(false);
                                }}
                                onClose={() => setIsCardVisible(false)}
                            />
                        )}
                    </div>
                )}

                {showConfirmModal && (
                    <div
                        className="fixed inset-0 flex items-center justify-center z-50"
                        onClick={() => !isJoining && setShowConfirmModal(false)}
                    >
                        <div
                            className="bg-gray-800 p-6 rounded-xl w-96 shadow-2xl border border-blue-400/20"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-white mb-4">Join Seat {index}</h3>
                            
                            {joinError && (
                                <div className="mb-4 p-3 bg-red-900/30 text-red-200 rounded-lg text-sm border border-red-500/20">
                                    {joinError}
                                </div>
                            )}
                            
                            <p className="text-gray-300 mb-6 text-center">
                                Ready to join at seat {index}?
                            </p>

                            <div className="flex justify-center space-x-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-300 shadow-inner"
                                    disabled={isJoining}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmSeat}
                                    disabled={isJoining}
                                    className="px-4 py-2 text-sm bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-lg transition duration-300 transform hover:scale-105 shadow-md border border-blue-500/20 flex items-center"
                                >
                                    {isJoining ? (
                                        <>
                                            <svg
                                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Joining...
                                        </>
                                    ) : (
                                        "Join Seat"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Placeholder div for potential future loading animation */}
                {joinSuccess && !showConfirmModal && (
                    <div id="loading-animation-placeholder" style={{ display: "none" }}>
                        {/* Future loading animation will go here */}
                    </div>
                )}
            </>
        );
    },
    (prevProps, nextProps) => {
        // Custom comparison function for memo
        return (
            prevProps.left === nextProps.left &&
            prevProps.top === nextProps.top &&
            prevProps.index === nextProps.index
        );
    }
);

VacantPlayer.displayName = "VacantPlayer";

export default VacantPlayer;
