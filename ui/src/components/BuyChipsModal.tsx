import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ethers } from "ethers";
import { useParams } from "react-router-dom";
import { getAccountBalance } from "../utils/b52AccountUtils";
import { formatWeiToUSD } from "../utils/numberUtils";
import { useGameOptions } from "../hooks/useGameOptions";
import { usePlayerSeatInfo } from "../hooks/usePlayerSeatInfo";
import { topUpChips } from "../hooks/playerActions/topUpChips";

interface BuyChipsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const BuyChipsModal: React.FC<BuyChipsModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { id: tableId } = useParams<{ id: string }>();
    const { gameOptions } = useGameOptions();
    const { userDataBySeat } = usePlayerSeatInfo();
    
    // Get current user's data
    const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
    const currentUserData = Object.values(userDataBySeat).find(
        player => player?.address?.toLowerCase() === userAddress
    );

    // State management
    const [walletBalance, setWalletBalance] = useState<string>("0");
    const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);
    const [topUpAmount, setTopUpAmount] = useState<string>("");
    const [isTopUpLoading, setIsTopUpLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate max top-up amount allowed
    const maxTopUpData = useMemo(() => {
        if (!gameOptions || !currentUserData) {
            return { maxTopUpUSD: 0, maxTopUpWei: "0" };
        }

        const maxBuyInWei = BigInt(gameOptions.maxBuyIn);
        const currentStackWei = BigInt(currentUserData.stack);
        const walletBalanceWei = BigInt(walletBalance);

        const maxByTableLimit = maxBuyInWei - currentStackWei;
        const maxByWallet = walletBalanceWei;
        
        // Take the minimum of table limit and wallet balance
        const maxTopUpWei = maxByTableLimit > 0n ? 
            (maxByTableLimit < maxByWallet ? maxByTableLimit : maxByWallet) : 0n;

        return {
            maxTopUpUSD: Number(ethers.formatUnits(maxTopUpWei, 18)),
            maxTopUpWei: maxTopUpWei.toString()
        };
    }, [gameOptions, currentUserData, walletBalance]);

    // Validation
    const isValidAmount = useMemo(() => {
        if (!topUpAmount || isNaN(Number(topUpAmount))) return false;
        const amount = Number(topUpAmount);
        return amount > 0 && amount <= maxTopUpData.maxTopUpUSD;
    }, [topUpAmount, maxTopUpData.maxTopUpUSD]);

    // Fetch wallet balance
    const fetchWalletBalance = useCallback(async () => {
        try {
            setIsLoadingBalance(true);
            setError(null);
            const balance = await getAccountBalance();
            setWalletBalance(balance);
        } catch (err) {
            console.error("Error fetching wallet balance:", err);
            setError("Failed to fetch wallet balance");
        } finally {
            setIsLoadingBalance(false);
        }
    }, []);

    // Handle MAX button click
    const handleMaxClick = useCallback(() => {
        setTopUpAmount(maxTopUpData.maxTopUpUSD.toFixed(2));
    }, [maxTopUpData.maxTopUpUSD]);

    // Handle buy chips
    const handleBuyChips = useCallback(async () => {
        if (!tableId || !isValidAmount) return;

        try {
            setIsTopUpLoading(true);
            setError(null);

            // Convert amount to Wei
            const amountWei = ethers.parseUnits(topUpAmount, 18).toString();
            
            await topUpChips(tableId, amountWei);
            
            // Success
            setTopUpAmount("");
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error("Top-up failed:", err);
            setError(err instanceof Error ? err.message : "Top-up failed");
        } finally {
            setIsTopUpLoading(false);
        }
    }, [tableId, topUpAmount, isValidAmount, onSuccess, onClose]);

    // Fetch balance when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchWalletBalance();
        }
    }, [isOpen, fetchWalletBalance]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setTopUpAmount("");
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-gray-800 p-6 rounded-xl w-96 shadow-2xl border border-blue-400/20">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Buy Chips</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Current Wallet Balance */}
                <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-300">Wallet Balance:</div>
                    <div className="text-lg font-bold text-white">
                        {isLoadingBalance ? "Loading..." : `$${formatWeiToUSD(walletBalance)}`}
                    </div>
                </div>

                {/* Current Stack Info */}
                {currentUserData && (
                    <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                        <div className="text-sm text-gray-300">Current Stack:</div>
                        <div className="text-lg font-bold text-white">
                            ${Number(ethers.formatUnits(currentUserData.stack, 18)).toFixed(2)}
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-3 bg-red-900/30 text-red-200 rounded-lg text-sm border border-red-500/20">
                        {error}
                    </div>
                )}

                {/* Amount Input */}
                <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-2">
                        Top-up Amount (USD)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={maxTopUpData.maxTopUpUSD}
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        className={`w-full p-3 rounded-lg text-white bg-gray-700 border transition-colors ${
                            topUpAmount && !isValidAmount 
                                ? "border-red-500 focus:border-red-400" 
                                : "border-gray-600 focus:border-blue-400"
                        } focus:outline-none`}
                        placeholder="Enter amount..."
                        disabled={isTopUpLoading}
                    />
                    {topUpAmount && !isValidAmount && (
                        <div className="text-red-400 text-xs mt-1">
                            Amount must be between $0.01 and ${maxTopUpData.maxTopUpUSD.toFixed(2)}
                        </div>
                    )}
                </div>

                {/* MAX Button */}
                <div className="mb-6">
                    <button
                        onClick={handleMaxClick}
                        disabled={maxTopUpData.maxTopUpUSD <= 0 || isTopUpLoading}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                    >
                        MAX Buy-In (${maxTopUpData.maxTopUpUSD.toFixed(2)})
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isTopUpLoading}
                        className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleBuyChips}
                        disabled={!isValidAmount || isTopUpLoading || maxTopUpData.maxTopUpUSD <= 0}
                        className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
                    >
                        {isTopUpLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Buying...
                            </>
                        ) : (
                            "BUY"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}; 