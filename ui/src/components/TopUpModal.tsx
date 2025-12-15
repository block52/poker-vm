import React, { useState, useMemo, useCallback } from "react";
import { colors } from "../utils/colorConfig";
import { formatUSDCToSimpleDollars } from "../utils/numberUtils";
import { microToUsdc, USDC_TO_MICRO } from "../constants/currency";

// TODO: Import actual hook when implemented
// import { useTableTopUp } from "../hooks/useTableTopUp";

interface TopUpModalProps {
    tableId: string;
    currentStack: string; // Current chips in USDC micro-units
    maxBuyIn: string; // Max buy-in in USDC micro-units
    walletBalance: string; // Wallet balance in USDC micro-units
    onClose: () => void;
    onTopUp: (amount: string) => void; // Amount in USDC micro-units
}

const TopUpModal: React.FC<TopUpModalProps> = ({
    currentStack,
    maxBuyIn,
    walletBalance,
    onClose,
    onTopUp
}) => {
    const [topUpError, setTopUpError] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Calculate formatted values
    const {
        currentStackFormatted,
        maxBuyInFormatted,
        walletBalanceFormatted,
        maxTopUpFormatted,
        maxTopUpMicro
    } = useMemo(() => {
        const current = microToUsdc(currentStack);
        const max = microToUsdc(maxBuyIn);
        const wallet = microToUsdc(walletBalance);

        // Max top-up is the lower of: (maxBuyIn - currentStack) or walletBalance
        const maxTopUpAmount = Math.min(max - current, wallet);
        const maxTopUpMicrounits = BigInt(Math.floor(maxTopUpAmount * USDC_TO_MICRO));

        return {
            currentStackFormatted: current.toFixed(2),
            maxBuyInFormatted: max.toFixed(2),
            walletBalanceFormatted: wallet.toFixed(2),
            maxTopUpFormatted: maxTopUpAmount.toFixed(2),
            maxTopUpMicro: maxTopUpMicrounits
        };
    }, [currentStack, maxBuyIn, walletBalance]);

    // Initialize with max top-up amount
    const [topUpAmount, setTopUpAmount] = useState(() => maxTopUpFormatted);

    // Check if top-up is possible
    const canTopUp = useMemo(() => {
        return parseFloat(maxTopUpFormatted) > 0;
    }, [maxTopUpFormatted]);

    const handleTopUpChange = useCallback((amount: string) => {
        setTopUpAmount(amount);
        setTopUpError("");
    }, []);

    const handleMaxClick = useCallback(() => {
        handleTopUpChange(maxTopUpFormatted);
    }, [maxTopUpFormatted, handleTopUpChange]);

    const handleTopUpClick = useCallback(async () => {
        try {
            setTopUpError("");
            setIsProcessing(true);

            // Convert dollar amount to USDC microunits
            const topUpMicrounits = BigInt(Math.floor(parseFloat(topUpAmount) * USDC_TO_MICRO));

            // Validation
            if (topUpMicrounits <= 0n) {
                setTopUpError("Top-up amount must be positive");
                return;
            }

            if (topUpMicrounits > maxTopUpMicro) {
                setTopUpError(`Maximum top-up allowed is $${maxTopUpFormatted}`);
                return;
            }

            // Execute top-up
            await onTopUp(topUpMicrounits.toString());
        } catch (error) {
            console.error("Error in top-up:", error);
            setTopUpError("Failed to top up. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    }, [topUpAmount, maxTopUpMicro, maxTopUpFormatted, onTopUp]);

    if (!canTopUp) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
                <div
                    className="relative p-8 rounded-xl shadow-2xl w-96"
                    style={{
                        backgroundColor: colors.ui.bgDark,
                        border: `1px solid ${colors.ui.borderColor}`
                    }}
                >
                    <h2 className="text-2xl font-bold mb-4 text-white">Cannot Top Up</h2>
                    <p className="text-gray-300 mb-6">
                        {parseFloat(walletBalanceFormatted) === 0
                            ? "Insufficient wallet balance. Please deposit USDC to continue."
                            : "You are already at the table maximum buy-in."}
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full px-5 py-3 rounded-lg text-white font-medium"
                        style={{ backgroundColor: colors.ui.textSecondary }}
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div
                className="relative p-8 rounded-xl shadow-2xl w-96"
                style={{
                    backgroundColor: colors.ui.bgDark,
                    border: `1px solid ${colors.ui.borderColor}`
                }}
            >
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                    <span style={{ color: colors.brand.primary }} className="mr-2">
                        💰
                    </span>
                    Buy Chips
                </h2>
                <div
                    className="w-full h-0.5 mb-6 opacity-50"
                    style={{
                        background: `linear-gradient(to right, transparent, ${colors.brand.primary}, transparent)`
                    }}
                />

                {/* Current Stack */}
                <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: colors.ui.bgMedium }}>
                    <div className="text-sm text-gray-400 mb-1">Current Stack</div>
                    <div className="text-2xl font-bold text-white">${currentStackFormatted}</div>
                    <div className="text-xs text-gray-500 mt-1">Table Max: ${maxBuyInFormatted}</div>
                </div>

                {/* Wallet Balance */}
                <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.ui.bgMedium }}>
                    <div className="text-sm text-gray-400 mb-1">Wallet Balance</div>
                    <div className="text-xl font-bold text-white">${walletBalanceFormatted}</div>
                </div>

                {/* Top-Up Amount Selection */}
                <div className="mb-6">
                    <label className="block text-gray-300 mb-2 font-medium text-sm">Top-Up Amount</label>
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={handleMaxClick}
                            className="flex-1 py-2 text-white rounded transition duration-200 hover:bg-opacity-80"
                            style={{ backgroundColor: colors.ui.bgMedium }}
                        >
                            <div className="text-xs text-gray-400">MAX</div>
                            <div className="font-bold">${maxTopUpFormatted}</div>
                        </button>
                        <div className="flex-1">
                            <input
                                type="number"
                                value={topUpAmount}
                                onChange={e => handleTopUpChange(e.target.value)}
                                className="w-full p-2 text-white rounded-lg text-center focus:outline-none"
                                style={{
                                    backgroundColor: colors.ui.bgMedium,
                                    border: `1px solid ${colors.ui.textSecondary}`
                                }}
                                placeholder="0.00"
                                step="0.01"
                            />
                        </div>
                    </div>
                    {topUpError && <p className="text-sm" style={{ color: colors.accent.danger }}>⚠️ {topUpError}</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex-1 px-5 py-3 rounded-lg text-white font-medium transition-all duration-200"
                        style={{ backgroundColor: colors.ui.textSecondary }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleTopUpClick}
                        disabled={isProcessing || !topUpAmount || parseFloat(topUpAmount) <= 0}
                        className="flex-1 px-5 py-3 rounded-lg font-medium text-white shadow-md"
                        style={{
                            background: colors.brand.primary,
                            opacity: isProcessing || !topUpAmount || parseFloat(topUpAmount) <= 0 ? 0.5 : 1,
                            cursor: isProcessing || !topUpAmount || parseFloat(topUpAmount) <= 0 ? "not-allowed" : "pointer"
                        }}
                    >
                        {isProcessing ? "Processing..." : "BUY"}
                    </button>
                </div>

                <div className="mt-4 text-xs" style={{ color: colors.ui.textSecondary }}>
                    <strong>Note:</strong> You can only top up when not in an active hand.
                </div>
            </div>
        </div>
    );
};

export default TopUpModal;
