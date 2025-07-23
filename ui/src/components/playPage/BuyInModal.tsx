import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ethers } from "ethers";
import { useMinAndMaxBuyIns } from "../../hooks/useMinAndMaxBuyIns";
import { useNavigate } from "react-router-dom";
import { formatWeiToSimpleDollars } from "../../utils/numberUtils";
import { getAccountBalance } from "../../utils/b52AccountUtils";
import { colors, getHexagonStroke } from "../../utils/colorConfig";

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
    tableId: string;
    onClose: () => void;
    onJoin: (buyInAmount: string, waitForBigBlind: boolean) => void;
}

const BuyInModal: React.FC<BuyInModalProps> = React.memo(({ tableId, onClose, onJoin }) => {
    const [accountBalance, setAccountBalance] = useState<string>("0");
    const [, setIsBalanceLoading] = useState<boolean>(true);
    const [, setBalanceError] = useState<Error | null>(null);
    const [publicKey, ] = useState<string | undefined>(localStorage.getItem("user_eth_public_key") || undefined);

    const { minBuyInWei, maxBuyInWei } = useMinAndMaxBuyIns();

    // Format the buy-in values using utility functions
    const minBuyInFormatted = formatWeiToSimpleDollars(minBuyInWei);
    const maxBuyInFormatted = formatWeiToSimpleDollars(maxBuyInWei);

    // ──────────── derive big/small blind ────────────
    // maxBuyIn = 100 × bigBlind  ⇒  bigBlind = maxBuyIn / 100
    const bigBlind = parseFloat(maxBuyInFormatted) / 100;
    const smallBlind = bigBlind / 2;
    const stakeLabel = `$${smallBlind.toFixed(2)} / $${bigBlind.toFixed(2)}`;

    const [buyInAmount, setBuyInAmount] = useState("" + maxBuyInFormatted);
    const [buyInError, setBuyInError] = useState("");
    const [waitForBigBlind, setWaitForBigBlind] = useState(true);

    const navigate = useNavigate();
    const balanceFormatted = accountBalance ? parseFloat(ethers.formatUnits(accountBalance, 18)) : 0;
    
    // Memoized styles to prevent re-renders
    const modalStyle = useMemo(() => ({
        backgroundColor: colors.ui.bgDark,
        border: `1px solid ${colors.ui.borderColor}`
    }), []);
    
    const dividerStyle = useMemo(() => ({
        background: `linear-gradient(to right, transparent, ${colors.brand.primary}, transparent)`
    }), []);
    
    const playableBalanceStyle = useMemo(() => ({
        backgroundColor: colors.ui.bgDark + "/60",
        border: `1px solid ${colors.ui.borderColor}`
    }), []);
    
    const balanceIconStyle = useMemo(() => ({
        backgroundColor: colors.brand.primary + "/20"
    }), []);
    
    const selectStyle = useMemo(() => ({
        backgroundColor: colors.ui.bgMedium,
        border: `1px solid ${colors.ui.textSecondary}`
    }), []);
    
    const buttonStyle = useMemo(() => ({
        backgroundColor: colors.ui.bgMedium,
        border: `1px solid ${colors.ui.borderColor}`
    }), []);
    
    const inputStyle = useMemo(() => ({
        backgroundColor: colors.ui.bgMedium,
        border: `1px solid ${colors.ui.textSecondary}`
    }), []);
    
    const checkboxStyle = useMemo(() => ({
        accentColor: colors.brand.primary,
        backgroundColor: colors.ui.bgMedium,
        borderColor: colors.ui.textSecondary
    }), []);
    
    const joinButtonGradient = useMemo(() => 
        `linear-gradient(to bottom right, ${colors.brand.primary}, ${colors.brand.secondary})`,
    []);
    
    const joinButtonGradientHover = useMemo(() => 
        `linear-gradient(to bottom right, ${colors.brand.primary}aa, ${colors.brand.secondary}aa)`,
    []);

    const fetchAccountBalance = async () => {
        try {
            setIsBalanceLoading(true);

            if (!publicKey) {
                setBalanceError(new Error("No address available"));
                setIsBalanceLoading(false);
                return;
            }

            const balance = await getAccountBalance();
            setAccountBalance(balance);
            setBalanceError(null);
        } catch (err) {
            console.error("Error fetching account balance:", err);
            setBalanceError(err instanceof Error ? err : new Error("Failed to fetch balance"));
        } finally {
            setIsBalanceLoading(false);
        }
    };

    useEffect(() => {
        if (publicKey) {
            fetchAccountBalance();
        }
    }, [publicKey]);

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
            const buyInWei = ethers.parseUnits(buyInAmount, 18).toString();

            if (BigInt(buyInWei) < BigInt(minBuyInWei)) {
                setBuyInError(`Minimum buy-in is $${minBuyInFormatted}`);
                return;
            }

            if (BigInt(buyInWei) > BigInt(maxBuyInWei)) {
                setBuyInError(`Maximum buy-in is $${maxBuyInFormatted}`);
                return;
            }

            if (balanceFormatted < parseFloat(minBuyInFormatted)) {
                setBuyInError("Your available balance does not reach the minimum buy-in amount for this game. Please deposit to continue.");
                return;
            }

            localStorage.setItem("buy_in_amount", buyInAmount);
            localStorage.setItem("wait_for_big_blind", JSON.stringify(waitForBigBlind));

            onJoin(buyInAmount, waitForBigBlind);
        } catch (error) {
            setBuyInError("Invalid input amount.");
        }
    }, [buyInAmount, minBuyInWei, maxBuyInWei, minBuyInFormatted, maxBuyInFormatted, balanceFormatted, waitForBigBlind, onJoin]);

    const isDisabled = balanceFormatted < parseFloat(minBuyInFormatted);

    return (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div 
                className="p-8 rounded-xl shadow-2xl w-96 overflow-hidden relative"
                style={modalStyle}
            >
                {/* Hexagon pattern background */}
                <HexagonPattern />
                
                <div className="absolute -right-8 -top-8 text-6xl opacity-10 rotate-12">♠</div>
                <div className="absolute -left-8 -bottom-8 text-6xl opacity-10 -rotate-12">♥</div>

                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                    <span style={{ color: colors.brand.primary }} className="mr-2">♣</span>
                    Buy In
                    <span style={{ color: colors.accent.danger }} className="ml-2">♦</span>
                </h2>
                <div 
                    className="w-full h-0.5 mb-4 opacity-50"
                    style={dividerStyle}
                ></div>

                {/* Playable Balance */}
                <div 
                    className="mb-5 p-3 rounded-lg"
                    style={playableBalanceStyle}
                >
                    <p style={{ color: colors.ui.textSecondary }} className="text-sm mb-1">Playable Balance:</p>
                    <div className="flex items-center">
                        <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                            style={balanceIconStyle}
                        >
                            <span style={{ color: colors.brand.primary }} className="font-bold text-xs">$</span>
                        </div>
                        <p className="text-white text-xl font-bold">{balanceFormatted.toFixed(2)}</p>
                    </div>
                </div>

                {/* Stake Dropdown (now dynamic) */}
                <div className="mb-6">
                    <label className="block text-gray-300 mb-1 font-medium text-sm">Select Stake</label>
                    <select 
                        disabled 
                        value={stakeLabel} 
                        className="w-full p-2 rounded text-white focus:outline-none text-sm"
                        style={selectStyle}
                    >
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
                            style={buttonStyle}
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
                            style={buttonStyle}
                            onMouseEnter={handleButtonMouseEnter}
                            onMouseLeave={handleButtonMouseLeave}
                        >
                            MIN
                            <br />
                            {minBuyInFormatted}
                        </button>
                        <div className="flex-1">
                            <label style={{ color: colors.ui.textSecondary }} className="text-xs block mb-1 text-center">OTHER</label>
                            <input
                                type="number"
                                value={buyInAmount}
                                onChange={e => handleBuyInChange(e.target.value)}
                                className="w-full p-2 text-white rounded-lg text-sm text-center focus:outline-none"
                                style={inputStyle}
                                onFocus={handleInputFocus}
                                onBlur={handleInputBlur}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    {buyInError && <p style={{ color: colors.accent.danger }} className="mt-2">⚠️ {buyInError}</p>}
                </div>

                {/* Wait for Big Blind */}
                <div className="flex items-center mb-6">
                    <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded mr-2"
                        style={checkboxStyle}
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
                        disabled={isDisabled}
                        className="px-5 py-3 rounded-lg font-medium flex-1 text-white shadow-md transition-all duration-200"
                        style={{
                            background: isDisabled 
                                ? colors.ui.textSecondary 
                                : joinButtonGradient,
                            cursor: isDisabled ? "not-allowed" : "pointer"
                        }}
                        onMouseEnter={(e) => {
                            if (!isDisabled) {
                                e.currentTarget.style.transform = "scale(1.02)";
                                e.currentTarget.style.background = joinButtonGradientHover;
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isDisabled) {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.background = joinButtonGradient;
                            }
                        }}
                    >
                        Take My Seat
                    </button>
                </div>

                {isDisabled && (
                    <div style={{ color: colors.accent.danger }} className="text-sm mb-4">
                        Your available balance does not reach the minimum buy-in amount for this game. Please{" "}
                        <span 
                            className="underline cursor-pointer"
                            style={{ color: colors.brand.primary }}
                            onClick={handleDepositClick}
                        >
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
