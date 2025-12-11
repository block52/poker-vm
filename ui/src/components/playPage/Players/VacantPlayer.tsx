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
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import PokerProfile from "../../../assets/PokerProfile.svg";

import { useVacantSeatData } from "../../../hooks/useVacantSeatData";
import type { VacantPlayerProps } from "../../../types/index";
import PlayerPopUpCard from "./PlayerPopUpCard";
import { useDealerPosition } from "../../../hooks/useDealerPosition";
import { joinTable } from "../../../hooks/playerActions/joinTable";
import { useGameOptions } from "../../../hooks/useGameOptions";
import CustomDealer from "../../../assets/CustomDealer.svg";
import { colors } from "../../../utils/colorConfig";
import { formatUSDCToSimpleDollars } from "../../../utils/numberUtils";
import { useCosmosWallet } from "../../../hooks";
import { microToUsdc } from "../../../constants/currency";
import { useNetwork } from "../../../context/NetworkContext";

const VacantPlayer: React.FC<VacantPlayerProps & { uiPosition?: number }> = memo(
    ({ left, top, index, onJoin, uiPosition }) => {
        const { isUserAlreadyPlaying, canJoinSeat: checkCanJoinSeat } = useVacantSeatData();
        const { id: tableId } = useParams<{ id: string }>();
        const { gameOptions } = useGameOptions();
        const cosmosWallet = useCosmosWallet();
        const { currentNetwork } = useNetwork();

        const [showConfirmModal, setShowConfirmModal] = useState(false);
        const [showBuyInModal, setShowBuyInModal] = useState(false);
        const [isJoining, setIsJoining] = useState(false);
        const [joinError, setJoinError] = useState<string | null>(null);
        const [joinSuccess, setJoinSuccess] = useState(false);
        const [, setJoinResponse] = useState<any>(null);
        const [isCardVisible, setIsCardVisible] = useState(false);
        const [buyInAmount, setBuyInAmount] = useState<string>("");

        const { dealerSeat } = useDealerPosition();

        // Check if this seat is the dealer
        const isDealer = dealerSeat === index;

        // Memoize seat status checks
        const canJoinThisSeat = useMemo(() => checkCanJoinSeat(index), [checkCanJoinSeat, index]);

        // Memoize handlers
        const handleJoinClick = useCallback(() => {
            console.log("🪑 VacantPlayer - handleJoinClick called for seat:", index);
            if (!canJoinThisSeat) return;
            setShowConfirmModal(true);
            setJoinError(null);
            setJoinSuccess(false);
            setJoinResponse(null);
        }, [canJoinThisSeat, index]);

        const handleSeatClick = useCallback(() => {
            console.log("🪑 VacantPlayer - handleSeatClick called:", {
                index,
                isUserAlreadyPlaying,
                canJoinThisSeat,
                gameOptions: gameOptions ? "present" : "null"
            });
            if (isUserAlreadyPlaying) {
                console.log("🪑 VacantPlayer - User already playing, showing card popup");
                setIsCardVisible(true);
            } else if (canJoinThisSeat) {
                console.log("🪑 VacantPlayer - Can join seat, calling handleJoinClick");
                handleJoinClick();
            } else {
                console.log("🪑 VacantPlayer - Cannot join seat (canJoinThisSeat is false)");
            }
        }, [isUserAlreadyPlaying, canJoinThisSeat, handleJoinClick, index, gameOptions]);

        // Step 1: Confirm seat selection
        const handleConfirmSeatYes = useCallback(() => {
            // Initialize buy-in amount with minBuyIn for Cash games
            const minBuyInDollars = formatUSDCToSimpleDollars(gameOptions?.minBuyIn || "0");
            setBuyInAmount(minBuyInDollars);

            // Close confirmation modal and open buy-in modal
            setShowConfirmModal(false);
            setShowBuyInModal(true);
        }, [gameOptions?.minBuyIn]);

        // Detect if this is Sit & Go (fixed buy-in) or Cash game (variable buy-in)
        const isSitAndGo = useMemo(() => {
            return gameOptions?.minBuyIn === gameOptions?.maxBuyIn;
        }, [gameOptions?.minBuyIn, gameOptions?.maxBuyIn]);

        // Step 2: Handle buy-in confirmation and join
        const handleBuyInConfirm = useCallback(async () => {
            if (!tableId) {
                setJoinError("Missing table ID");
                return;
            }

            // For Sit & Go: use minBuyIn (fixed amount)
            // For Cash Game: use user-selected buyInAmount
            let buyInDollars: string;

            if (isSitAndGo) {
                // Sit & Go: Fixed buy-in
                const buyInMicrounits = gameOptions?.minBuyIn || gameOptions?.maxBuyIn;
                if (!buyInMicrounits) {
                    setJoinError("Unable to determine buy-in amount");
                    return;
                }
                buyInDollars = formatUSDCToSimpleDollars(buyInMicrounits);
            } else {
                // Cash Game: User-selected amount
                buyInDollars = buyInAmount;

                // Validate buy-in range
                const minBuyInDollars = parseFloat(formatUSDCToSimpleDollars(gameOptions?.minBuyIn || "0"));
                const maxBuyInDollars = parseFloat(formatUSDCToSimpleDollars(gameOptions?.maxBuyIn || "0"));
                const buyInValue = parseFloat(buyInDollars);

                if (buyInValue < minBuyInDollars) {
                    setJoinError(`Buy-in must be at least $${minBuyInDollars.toFixed(2)}`);
                    return;
                }
                if (buyInValue > maxBuyInDollars) {
                    setJoinError(`Buy-in cannot exceed $${maxBuyInDollars.toFixed(2)}`);
                    return;
                }
            }

            console.log("💰 VacantPlayer - Buy-in values:", {
                isSitAndGo,
                minBuyIn: gameOptions?.minBuyIn,
                maxBuyIn: gameOptions?.maxBuyIn,
                userAmount: buyInDollars
            });

            setIsJoining(true);
            setJoinError(null);
            setJoinSuccess(false);

            try {
                console.log("🪑 VacantPlayer - Joining seat:", {
                    seat: index,
                    buyInDollars: buyInDollars
                });

                // joinTable expects amount in USDC dollar format (e.g., "5.00")
                // The hook will convert it to microunits internally
                const response = await joinTable(
                    tableId,
                    {
                        amount: buyInDollars,
                        seatNumber: index
                    },
                    currentNetwork
                );

                setJoinResponse(response);
                setJoinSuccess(true);
                setShowBuyInModal(false);
                setIsJoining(false);

                // Trigger seat join notification via global window object
                // Small delay to ensure player component is rendered
                setTimeout(() => {
                    if (window.seatJoinNotifications && window.seatJoinNotifications[index]) {
                        window.seatJoinNotifications[index]();
                    }
                }, 100);

                // Call onJoin after successful join
                if (onJoin) {
                    onJoin();
                }
            } catch (err) {
                console.error("Failed to join table:", err);
                setJoinError(err instanceof Error ? err.message : "Unknown error joining table");
                setIsJoining(false);
            }
        }, [tableId, index, onJoin, gameOptions?.minBuyIn, gameOptions?.maxBuyIn, buyInAmount, isSitAndGo, currentNetwork]);

        // Memoize container styles
        const containerStyle = useMemo(
            () => ({
                left,
                top
            }),
            [left, top]
        );

        // Memoize popup styles
        const popupStyle = useMemo(
            () => ({
                left,
                top,
                transform: "translate(-50%, -50%)"
            }),
            [left, top]
        );

        // Memoize popup class names
        const popupClassName = useMemo(
            () =>
                `absolute z-[1000] transition-all duration-1000 ease-in-out transform ${
                    isCardVisible ? "opacity-100 animate-slide-left-to-right" : "opacity-0 animate-slide-top-to-bottom"
                }`,
            [isCardVisible]
        );

        // Memoize seat text
        const seatText = useMemo(
            () => ({
                title: isUserAlreadyPlaying ? "Vacant Seat" : `Seat ${index}`,
                subtitle: !isUserAlreadyPlaying ? (canJoinThisSeat ? "Click to Join" : "Seat Taken") : null
            }),
            [isUserAlreadyPlaying, canJoinThisSeat, index]
        );

        return (
            <>
                <div className="absolute cursor-pointer" style={containerStyle} onClick={handleSeatClick}>
                    {/* Development Mode Debug Info */}
                    {import.meta.env.VITE_NODE_ENV === "development" && (
                        <div className="absolute top-[-50px] left-1/2 transform -translate-x-1/2 bg-gray-600 bg-opacity-80 text-white px-2 py-1 rounded text-[10px] whitespace-nowrap z-50 border border-gray-400">
                            <div className="text-gray-300">UI Pos: {uiPosition ?? "N/A"}</div>
                            <div className="text-yellow-300">Vacant Seat: {index}</div>
                            <div className="text-gray-300">
                                XY: {left}, {top}
                            </div>
                        </div>
                    )}
                    <div className="flex justify-center mb-2">
                        <img src={PokerProfile} className="w-12 h-12" alt="Vacant Seat" />
                    </div>
                    <div className="text-center" style={{ color: "white" }}>
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
                    <div className={popupClassName} style={popupStyle}>
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

                {/* Step 1: Simple confirmation modal - using portal to render at document body */}
                {showConfirmModal && createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => !isJoining && setShowConfirmModal(false)} />

                        {/* Modal */}
                        <div
                            className="relative p-6 rounded-xl w-96 shadow-2xl"
                            style={{
                                backgroundColor: colors.ui.bgDark,
                                border: `1px solid ${colors.ui.borderColor}`
                            }}
                        >
                            <h3 className="text-xl font-bold mb-4" style={{ color: "white" }}>
                                Join Seat {index}
                            </h3>

                            <p className="mb-6 text-center" style={{ color: colors.ui.textSecondary + "dd" }}>
                                Ready to join at seat {index}?
                            </p>

                            <div className="flex flex-col space-y-3">
                                <button
                                    onClick={handleConfirmSeatYes}
                                    className="w-full px-6 py-3 text-sm font-semibold rounded-lg transition duration-300 transform shadow-md"
                                    style={{
                                        background: colors.brand.primary,
                                        color: "white"
                                    }}
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="w-full px-6 py-3 text-sm font-semibold rounded-lg transition duration-300 shadow-inner"
                                    style={{
                                        backgroundColor: colors.ui.textSecondary,
                                        color: "white"
                                    }}
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Step 2: Sit & Go Buy-in modal - using portal to render at document body */}
                {showBuyInModal && gameOptions && createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => !isJoining && setShowBuyInModal(false)} />

                        {/* Modal */}
                        <div
                            className="relative p-8 rounded-xl w-96 shadow-2xl"
                            style={{
                                backgroundColor: colors.ui.bgDark,
                                border: `1px solid ${colors.ui.borderColor}`
                            }}
                        >
                            <h3 className="text-2xl font-bold mb-4 text-white text-center">{isSitAndGo ? "Sit & Go Buy-In" : "Cash Game Buy-In"}</h3>

                            {/* Buy-In Amount - Fixed for Sit & Go, Input for Cash Game */}
                            {isSitAndGo ? (
                                // Sit & Go: Fixed buy-in amount
                                <div
                                    className="mb-6 p-4 rounded-lg border-2"
                                    style={{
                                        backgroundColor: colors.ui.bgMedium,
                                        borderColor: colors.brand.primary
                                    }}
                                >
                                    <div className="text-center">
                                        <div className="text-xs text-gray-400 mb-1">Required Buy-In</div>
                                        <div className="text-3xl font-bold text-white">
                                            ${formatUSDCToSimpleDollars(gameOptions.minBuyIn || gameOptions.maxBuyIn)}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">Fixed amount for this tournament</div>
                                    </div>
                                </div>
                            ) : (
                                // Cash Game: Editable buy-in amount
                                <div className="mb-6">
                                    <label className="block text-xs text-gray-400 mb-2">
                                        Buy-In Amount (between ${formatUSDCToSimpleDollars(gameOptions.minBuyIn)} - $
                                        {formatUSDCToSimpleDollars(gameOptions.maxBuyIn)})
                                    </label>
                                    <div className="flex gap-2 mb-3">
                                        <button
                                            onClick={() => setBuyInAmount(formatUSDCToSimpleDollars(gameOptions.minBuyIn || "0"))}
                                            className="px-4 py-2 rounded-lg text-sm transition"
                                            style={{
                                                backgroundColor: colors.ui.bgMedium,
                                                color: "white",
                                                border: `1px solid ${colors.ui.borderColor}`
                                            }}
                                        >
                                            MIN
                                            <br />${formatUSDCToSimpleDollars(gameOptions.minBuyIn)}
                                        </button>
                                        <button
                                            onClick={() => setBuyInAmount(formatUSDCToSimpleDollars(gameOptions.maxBuyIn || "0"))}
                                            className="px-4 py-2 rounded-lg text-sm transition"
                                            style={{
                                                backgroundColor: colors.ui.bgMedium,
                                                color: "white",
                                                border: `1px solid ${colors.ui.borderColor}`
                                            }}
                                        >
                                            MAX
                                            <br />${formatUSDCToSimpleDollars(gameOptions.maxBuyIn)}
                                        </button>
                                        <input
                                            type="number"
                                            value={buyInAmount}
                                            onChange={e => setBuyInAmount(e.target.value)}
                                            placeholder="Enter amount"
                                            className="flex-1 px-4 py-2 rounded-lg text-white text-center text-lg"
                                            style={{
                                                backgroundColor: colors.ui.bgMedium,
                                                border: `1px solid ${colors.ui.borderColor}`
                                            }}
                                            step="0.01"
                                            min={formatUSDCToSimpleDollars(gameOptions.minBuyIn)}
                                            max={formatUSDCToSimpleDollars(gameOptions.maxBuyIn)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* User Balance */}
                            <div className="mb-6">
                                <div className="text-xs text-gray-400 mb-2">Your USDC Balance:</div>
                                {cosmosWallet.balance.map((balance, idx) => {
                                    if (balance.denom === "usdc") {
                                        const usdcAmount = microToUsdc(balance.amount);
                                        return (
                                            <div
                                                key={idx}
                                                className="p-3 rounded-lg"
                                                style={{
                                                    backgroundColor: colors.ui.bgMedium + "80",
                                                    border: `1px solid ${colors.ui.borderColor}`
                                                }}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white font-semibold">USDC</span>
                                                    <span
                                                        className={`text-lg font-bold ${
                                                            usdcAmount >= parseFloat(formatUSDCToSimpleDollars(gameOptions.maxBuyIn))
                                                                ? "text-green-400"
                                                                : "text-red-400"
                                                        }`}
                                                    >
                                                        ${usdcAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>

                            {/* Error Message */}
                            {joinError && (
                                <div
                                    className="mb-4 p-3 rounded-lg text-sm"
                                    style={{
                                        backgroundColor: colors.accent.danger + "30",
                                        color: colors.accent.danger,
                                        border: `1px solid ${colors.accent.danger}40`
                                    }}
                                >
                                    ⚠️ {joinError}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col space-y-3">
                                <button
                                    onClick={handleBuyInConfirm}
                                    disabled={isJoining}
                                    className="w-full px-6 py-3 text-sm font-semibold rounded-lg transition duration-300 flex items-center justify-center"
                                    style={{
                                        background: colors.brand.primary,
                                        color: "white"
                                    }}
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
                                        "Confirm & Join"
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowBuyInModal(false)}
                                    className="w-full px-6 py-3 text-sm font-semibold rounded-lg transition duration-300"
                                    style={{
                                        backgroundColor: colors.ui.textSecondary,
                                        color: "white"
                                    }}
                                    disabled={isJoining}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
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
        return prevProps.left === nextProps.left && prevProps.top === nextProps.top && prevProps.index === nextProps.index;
    }
);

VacantPlayer.displayName = "VacantPlayer";

export default VacantPlayer;
