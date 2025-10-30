import React, { useState, useMemo, useCallback } from "react";
import { useMinAndMaxBuyIns } from "../../hooks/useMinAndMaxBuyIns";
import { useNavigate } from "react-router-dom";
import { formatUSDCToSimpleDollars } from "../../utils/numberUtils";
import { colors, getHexagonStroke, hexToRgba } from "../../utils/colorConfig";
import { useVacantSeatData } from "../../hooks/useVacantSeatData";
import { joinTable } from "../../hooks/playerActions/joinTable";
import { JoinTableOptions } from "../../hooks/playerActions/types";
import { useCosmosWallet } from "../../hooks";

// Move static styles outside component to avoid recreation
const STATIC_STYLES = {
    modal: {
        backgroundColor: colors.ui.bgDark,
        border: `1px solid ${colors.ui.borderColor}`
    },
    divider: {
        background: `linear-gradient(to right, transparent, ${colors.brand.primary}, transparent)`
    },
    playableBalance: {
        backgroundColor: colors.ui.bgDark + "/60",
        border: `1px solid ${colors.ui.borderColor}`
    },
    balanceIcon: {
        backgroundColor: colors.brand.primary + "/20"
    },
    select: {
        backgroundColor: colors.ui.bgMedium,
        border: `1px solid ${colors.ui.textSecondary}`
    },
    button: {
        backgroundColor: colors.ui.bgMedium,
        border: `1px solid ${colors.ui.borderColor}`
    },
    input: {
        backgroundColor: colors.ui.bgMedium,
        border: `1px solid ${colors.ui.textSecondary}`
    },
    checkbox: {
        accentColor: colors.brand.primary,
        backgroundColor: colors.ui.bgMedium,
        borderColor: colors.ui.textSecondary
    },
    joinButtonGradient: `linear-gradient(to bottom right, ${colors.brand.primary}, ${colors.brand.secondary})`,
    joinButtonGradientHover: `linear-gradient(to bottom right, ${colors.brand.primary}aa, ${colors.brand.secondary}aa)`
};

// Memoized hexagon pattern component
const HexagonPattern = React.memo(() => (
    <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="hexagons-buyin" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(5)">
                    <path d="M25,3.4 L45,17 L45,43.4 L25,56.7 L5,43.4 L5,17 L25,3.4 z" stroke={getHexagonStroke()} strokeWidth="0.6" fill="none" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagons-buyin)" />
        </svg>
    </div>
));

interface BuyInModalProps {
    tableId?: string; // Optional tableId for joining specific table
    minBuyIn?: string; // Optional min buy-in from Dashboard (USDC micro-units)
    maxBuyIn?: string; // Optional max buy-in from Dashboard (USDC micro-units)
    onClose: () => void;
    onJoin: (amount: string, waitForBigBlind: boolean) => void;
}

const BuyInModal: React.FC<BuyInModalProps> = React.memo(({ onClose, onJoin, tableId, minBuyIn, maxBuyIn }) => {
    const [buyInError, setBuyInError] = useState("");
    const [waitForBigBlind, setWaitForBigBlind] = useState(true);
    const [isJoiningRandomSeat, setIsJoiningRandomSeat] = useState(false);

    // Get Cosmos wallet hook
    const cosmosWallet = useCosmosWallet();

    // Use props if provided, otherwise fall back to hook
    const hookBuyIns = useMinAndMaxBuyIns();
    const minBuyInWei = minBuyIn || hookBuyIns.minBuyInWei;
    const maxBuyInWei = maxBuyIn || hookBuyIns.maxBuyInWei;

    const { emptySeatIndexes, isUserAlreadyPlaying } = useVacantSeatData();
    const navigate = useNavigate();

    // Memoize formatted values and calculations
    const {
        minBuyInFormatted,
        maxBuyInFormatted,
        balanceFormatted,
        stakeLabel,
        minBuyInNumber,
        maxBuyInNumber: _maxBuyInNumber
    } = useMemo(() => {
        console.log("🎰 BuyInModal - Using buy-in values:", {
            fromProps: { minBuyIn, maxBuyIn },
            fromHook: { min: hookBuyIns.minBuyInWei, max: hookBuyIns.maxBuyInWei },
            finalUsed: { minBuyInWei, maxBuyInWei }
        });

        // Format USDC microunits (6 decimals) from Cosmos
        const minFormatted = formatUSDCToSimpleDollars(minBuyInWei);
        const maxFormatted = formatUSDCToSimpleDollars(maxBuyInWei);

        // Get USDC balance from cosmosWallet hook (which shows all token balances)
        const usdcBalance = cosmosWallet.balance.find(b => b.denom === "usdc");
        const balance = usdcBalance ? Number(usdcBalance.amount) / 1_000_000 : 0;

        console.log("💵 BuyInModal - Buy-in limits (Cosmos USDC):");
        console.log("  minBuyInWei:", minBuyInWei);
        console.log("  maxBuyInWei:", maxBuyInWei);
        console.log("  minFormatted:", minFormatted);
        console.log("  maxFormatted:", maxFormatted);
        console.log("  USDC balance from wallet:", usdcBalance?.amount);
        console.log("  balanceFormatted (dollars):", balance);

        // Calculate stake label from max buy-in
        const bigBlind = parseFloat(maxFormatted) / 100;
        const smallBlind = bigBlind / 2;
        const stake = `$${smallBlind.toFixed(2)} / $${bigBlind.toFixed(2)}`;

        return {
            minBuyInFormatted: minFormatted,
            maxBuyInFormatted: maxFormatted,
            balanceFormatted: balance,
            stakeLabel: stake,
            minBuyInNumber: parseFloat(minFormatted),
            maxBuyInNumber: parseFloat(maxFormatted)
        };
    }, [minBuyInWei, maxBuyInWei, cosmosWallet.balance, minBuyIn, maxBuyIn, hookBuyIns.minBuyInWei, hookBuyIns.maxBuyInWei]);

    // Initialize buyInAmount with maxBuyInFormatted
    const [buyInAmount, setBuyInAmount] = useState(() => maxBuyInFormatted);

    // Memoize isDisabled calculation
    const isDisabled = useMemo(() => {
        return balanceFormatted < minBuyInNumber;
    }, [balanceFormatted, minBuyInNumber]);

    // Check if random seat join is available
    const canJoinRandomSeat = useMemo(() => {
        return !isUserAlreadyPlaying && emptySeatIndexes.length > 0 && !isDisabled && !isJoiningRandomSeat;
    }, [isUserAlreadyPlaying, emptySeatIndexes.length, isDisabled, isJoiningRandomSeat]);

    // Memoized event handlers
    const handleBuyInChange = useCallback((amount: string) => {
        setBuyInAmount(amount);
        setBuyInError("");
        localStorage.setItem("buy_in_amount", amount);
    }, []);

    const handleMaxClick = useCallback(() => {
        handleBuyInChange(maxBuyInFormatted);
    }, [maxBuyInFormatted, handleBuyInChange]);

    const handleMinClick = useCallback(() => {
        handleBuyInChange(minBuyInFormatted);
    }, [minBuyInFormatted, handleBuyInChange]);

    // Simplified mouse event handlers
    const handleButtonMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor = colors.ui.textSecondary;
    }, []);

    const handleButtonMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor = colors.ui.bgMedium;
    }, []);

    const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.style.borderColor = colors.brand.primary;
    }, []);

    const handleInputBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.style.borderColor = colors.ui.textSecondary;
    }, []);

    const handleCancelMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor = colors.ui.bgMedium;
    }, []);

    const handleCancelMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor = colors.ui.textSecondary;
    }, []);

    const handleDepositClick = useCallback(() => {
        navigate("/qr-deposit");
    }, [navigate]);

    const handleJoinClick = useCallback(() => {
        try {
            // Convert dollar amount to USDC microunits (6 decimals)
            const buyInMicrounits = BigInt(Math.floor(parseFloat(buyInAmount) * 1_000_000));

            console.log("💰 BuyInModal - handleJoinClick:");
            console.log("  buyInAmount (input):", buyInAmount);
            console.log("  buyInMicrounits:", buyInMicrounits.toString());
            console.log("  minBuyInWei:", minBuyInWei);
            console.log("  maxBuyInWei:", maxBuyInWei);

            if (buyInMicrounits < BigInt(minBuyInWei)) {
                setBuyInError(`Minimum buy-in is $${minBuyInFormatted}`);
                return;
            }

            if (buyInMicrounits > BigInt(maxBuyInWei)) {
                setBuyInError(`Maximum buy-in is $${maxBuyInFormatted}`);
                return;
            }

            if (balanceFormatted < minBuyInNumber) {
                setBuyInError("Your available balance does not reach the minimum buy-in amount for this game. Please deposit to continue.");
                return;
            }

            localStorage.setItem("buy_in_amount", buyInAmount);
            localStorage.setItem("wait_for_big_blind", JSON.stringify(waitForBigBlind));

            onJoin(buyInAmount, waitForBigBlind);
        } catch (error) {
            console.error("❌ Error in handleJoinClick:", error);
            setBuyInError("Invalid input amount.");
        }
    }, [buyInAmount, minBuyInWei, maxBuyInWei, minBuyInFormatted, maxBuyInFormatted, balanceFormatted, minBuyInNumber, waitForBigBlind, onJoin]);

    const handleRandomSeatJoin = useCallback(async () => {
        try {
            setBuyInError("");
            setIsJoiningRandomSeat(true);

            // Validate buy-in amount first - convert to USDC microunits (6 decimals)
            const buyInMicrounits = BigInt(Math.floor(parseFloat(buyInAmount) * 1_000_000));

            console.log("💰 BuyInModal - Random seat join:");
            console.log("  buyInAmount (input):", buyInAmount);
            console.log("  buyInMicrounits:", buyInMicrounits.toString());

            if (buyInMicrounits < BigInt(minBuyInWei)) {
                setBuyInError(`Minimum buy-in is ${minBuyInFormatted}`);
                return;
            }

            if (buyInMicrounits > BigInt(maxBuyInWei)) {
                setBuyInError(`Maximum buy-in is ${maxBuyInFormatted}`);
                return;
            }

            if (balanceFormatted < minBuyInNumber) {
                setBuyInError("Your available balance does not reach the minimum buy-in amount for this game. Please deposit to continue.");
                return;
            }

            // Get a random empty seat
            if (emptySeatIndexes.length === 0) {
                setBuyInError("No empty seats available.");
                return;
            }

            const joinOptions: JoinTableOptions = {
                amount: buyInMicrounits.toString(),
                seatNumber: undefined // Let the server handle random seat assignment
            };

            console.log("💰 BuyInModal - Join attempt:");
            console.log("  joinOptions.amount:", joinOptions.amount);
            console.log("  tableId:", tableId);

            joinTable(tableId || "default-game-id", joinOptions);

            // Navigate to table
            navigate(`/table/${tableId}`);
        } catch (error) {
            console.error("❌ Error joining random seat:", error);
            setBuyInError("Failed to join table. Please try again.");
        } finally {
            setIsJoiningRandomSeat(false);
        }
    }, [
        buyInAmount,
        minBuyInWei,
        maxBuyInWei,
        balanceFormatted,
        minBuyInNumber,
        emptySeatIndexes.length,
        navigate,
        tableId,
        minBuyInFormatted,
        maxBuyInFormatted
    ]);

    return (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="p-8 rounded-xl shadow-2xl w-96 overflow-hidden relative" style={STATIC_STYLES.modal}>
                {/* Hexagon pattern background */}
                <HexagonPattern />

                <div className="absolute -right-8 -top-8 text-6xl opacity-10 rotate-12">♠</div>
                <div className="absolute -left-8 -bottom-8 text-6xl opacity-10 -rotate-12">♥</div>

                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                    <span style={{ color: colors.brand.primary }} className="mr-2">
                        ♣
                    </span>
                    Buy In
                    <span style={{ color: colors.accent.danger }} className="ml-2">
                        ♦
                    </span>
                </h2>
                <div className="w-full h-0.5 mb-4 opacity-50" style={STATIC_STYLES.divider}></div>

                {/* Cosmos Wallet Balances Section */}
                <div className="mb-5 space-y-2">
                    <p className="text-white text-xs font-semibold mb-2">Cosmos Balances:</p>
                    {cosmosWallet.isLoading ? (
                        <div className="text-gray-400 text-sm text-center py-2">Loading balances...</div>
                    ) : cosmosWallet.error ? (
                        <div className="text-red-400 text-sm text-center py-2">Error loading balances</div>
                    ) : !cosmosWallet.address ? (
                        <div className="text-gray-400 text-sm text-center py-2">No wallet connected</div>
                    ) : cosmosWallet.balance.length === 0 ? (
                        <div className="text-yellow-400 text-sm text-center py-2">⚠️ No tokens found - You need tokens to play!</div>
                    ) : (
                        <div className="space-y-2">
                            {cosmosWallet.balance.map((balance, idx) => {
                                // Format balance with proper decimals (6 for micro-denominated tokens)
                                const isMicroDenom = balance.denom === "b52Token" || balance.denom === "usdc";
                                const numericAmount = isMicroDenom ? Number(balance.amount) / 1_000_000 : Number(balance.amount);

                                const displayAmount = numericAmount.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 6
                                });

                                // For usdc, show USD equivalent
                                const isUSDC = balance.denom === "usdc";
                                const usdValue = isUSDC
                                    ? numericAmount.toLocaleString("en-US", {
                                          style: "currency",
                                          currency: "USD",
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                      })
                                    : null;

                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 rounded-lg"
                                        style={{
                                            backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                                            border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                                        }}
                                    >
                                        <div>
                                            <p className="text-white text-sm font-bold">{balance.denom}</p>
                                            <p className="text-gray-400 text-xs">Cosmos Chain</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-white font-bold text-lg">{displayAmount}</span>
                                                <span className="text-gray-400 text-xs">{balance.denom}</span>
                                            </div>
                                            {usdValue && <div className="text-gray-400 text-xs">≈ {usdValue}</div>}
                                            <div className="text-xs text-gray-500">{Number(balance.amount).toLocaleString("en-US")} micro-units</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Stake Dropdown */}
                <div className="mb-6">
                    <label className="block text-gray-300 mb-1 font-medium text-sm">Select Stake</label>
                    <select disabled value={stakeLabel} className="w-full p-2 rounded text-white focus:outline-none text-sm" style={STATIC_STYLES.select}>
                        <option>{stakeLabel}</option>
                    </select>
                </div>

                {/* Buy-In Amount Selection */}
                <div className="mb-6">
                    <label className="block text-gray-300 mb-2 font-medium text-sm">Select Buy-In Amount</label>
                    <div className="flex justify-between gap-2 mb-2">
                        <button
                            onClick={handleMaxClick}
                            className="flex-1 py-2 text-sm text-white rounded transition duration-200"
                            style={STATIC_STYLES.button}
                            onMouseEnter={handleButtonMouseEnter}
                            onMouseLeave={handleButtonMouseLeave}
                        >
                            MAX
                            <br />
                            {maxBuyInFormatted}
                        </button>
                        <button
                            onClick={handleMinClick}
                            className="flex-1 py-2 text-sm text-white rounded transition duration-200"
                            style={STATIC_STYLES.button}
                            onMouseEnter={handleButtonMouseEnter}
                            onMouseLeave={handleButtonMouseLeave}
                        >
                            MIN
                            <br />
                            {minBuyInFormatted}
                        </button>
                        <div className="flex-1">
                            <label style={{ color: colors.ui.textSecondary }} className="text-xs block mb-1 text-center">
                                OTHER
                            </label>
                            <input
                                type="number"
                                value={buyInAmount}
                                onChange={e => handleBuyInChange(e.target.value)}
                                className="w-full p-2 text-white rounded-lg text-sm text-center focus:outline-none"
                                style={STATIC_STYLES.input}
                                onFocus={handleInputFocus}
                                onBlur={handleInputBlur}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    {buyInError && (
                        <p style={{ color: colors.accent.danger }} className="mt-2">
                            ⚠️ {buyInError}
                        </p>
                    )}
                </div>

                {/* Wait for Big Blind */}
                <div className="flex items-center mb-6">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded mr-2"
                        style={STATIC_STYLES.checkbox}
                        checked={waitForBigBlind}
                        onChange={() => setWaitForBigBlind(!waitForBigBlind)}
                    />
                    <label className="text-gray-300 text-sm">Wait for Big Blind</label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between space-x-4 mb-4">
                    <button
                        onClick={onClose}
                        className="px-5 py-3 rounded-lg text-white font-medium flex-1 transition-all duration-200"
                        style={{ backgroundColor: colors.ui.textSecondary }}
                        onMouseEnter={handleCancelMouseEnter}
                        onMouseLeave={handleCancelMouseLeave}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleJoinClick}
                        className="px-4 py-3 rounded-lg font-medium flex-1 text-white shadow-md text-sm"
                        style={{
                            background: `${colors.brand.primary}`,
                            cursor: !canJoinRandomSeat ? "not-allowed" : "pointer"
                        }}
                    >
                        View Table
                    </button>
                    <button
                        onClick={handleRandomSeatJoin}
                        disabled={!canJoinRandomSeat}
                        className="px-4 py-3 rounded-lg font-medium flex-1 text-white shadow-md text-sm"
                        style={{
                            background: !canJoinRandomSeat ? `${colors.brand.primary}` : `${colors.brand.secondary}, ${colors.brand.primary}`,
                            cursor: !canJoinRandomSeat ? "not-allowed" : "pointer"
                        }}
                    >
                        {isJoiningRandomSeat ? "Joining..." : "Take My Seat"}
                    </button>
                </div>

                {isDisabled && (
                    <div style={{ color: colors.accent.danger }} className="text-sm mb-4">
                        Your available balance does not reach the minimum buy-in amount for this game. Please{" "}
                        <span className="underline cursor-pointer" style={{ color: colors.brand.primary }} onClick={handleDepositClick}>
                            deposit
                        </span>{" "}
                        to continue.
                    </div>
                )}

                <div style={{ color: colors.ui.textSecondary }} className="text-xs">
                    <strong>Please Note:</strong> This table has no all-in protection.
                </div>
            </div>
        </div>
    );
});

export default BuyInModal;
