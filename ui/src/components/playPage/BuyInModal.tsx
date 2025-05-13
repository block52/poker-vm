import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useMinAndMaxBuyIns } from "../../hooks/useMinAndMaxBuyIns";
import { useNavigate } from "react-router-dom";
import { useNodeRpc } from "../../context/NodeRpcContext";

interface BuyInModalProps {
    tableId: string;
    onClose: () => void;
    onJoin: (buyInAmount: string, waitForBigBlind: boolean) => void;
}

const BuyInModal: React.FC<BuyInModalProps> = ({ tableId, onClose, onJoin }) => {
    const { client, isLoading: clientLoading } = useNodeRpc();
    const [accountBalance, setAccountBalance] = useState<string>("0");
    const [, setIsBalanceLoading] = useState<boolean>(true);
    const [, setBalanceError] = useState<Error | null>(null);
    const [publicKey, ] = useState<string | undefined>(localStorage.getItem("user_eth_public_key") || undefined);

    const { minBuyInWei, maxBuyInWei, minBuyInFormatted, maxBuyInFormatted } = useMinAndMaxBuyIns(tableId);

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

    const fetchAccountBalance = async () => {
        if (!client) {
            setBalanceError(new Error("RPC client not initialized"));
            setIsBalanceLoading(false);
            return;
        }

        try {
            setIsBalanceLoading(true);

            if (!publicKey) {
                setBalanceError(new Error("No address available"));
                setIsBalanceLoading(false);
                return;
            }

            const account = await client.getAccount(publicKey);
            setAccountBalance(account.balance);
            setBalanceError(null);
        } catch (err) {
            console.error("Error fetching account balance:", err);
            setBalanceError(err instanceof Error ? err : new Error("Failed to fetch balance"));
        } finally {
            setIsBalanceLoading(false);
        }
    };

    useEffect(() => {
        if (publicKey && client && !clientLoading) {
            fetchAccountBalance();
        }
    }, [publicKey, client, clientLoading]);

    const handleBuyInChange = (amount: string) => {
        setBuyInAmount(amount);
        setBuyInError("");
        localStorage.setItem("buy_in_amount", amount);
    };

    const handleJoinClick = () => {
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
    };

    const isDisabled = balanceFormatted < parseFloat(minBuyInFormatted);

    return (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-gray-800/90 backdrop-blur-md p-8 rounded-xl shadow-2xl w-96 border border-blue-400/20 overflow-hidden relative">
                {/* Hexagon pattern background */}
                <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(5)">
                                <path d="M25,3.4 L45,17 L45,43.4 L25,56.7 L5,43.4 L5,17 L25,3.4 z" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="0.6" fill="none" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#hexagons)" />
                    </svg>
                </div>
                
                <div className="absolute -right-8 -top-8 text-6xl opacity-10 rotate-12">♠</div>
                <div className="absolute -left-8 -bottom-8 text-6xl opacity-10 -rotate-12">♥</div>

                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                    <span className="text-blue-400 mr-2">♣</span>
                    Buy In
                    <span className="text-red-400 ml-2">♦</span>
                </h2>
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-4 opacity-50"></div>

                {/* Playable Balance */}
                <div className="mb-5 p-3 bg-gray-800/60 rounded-lg border border-blue-500/10">
                    <p className="text-gray-400 text-sm mb-1">Playable Balance:</p>
                    <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mr-2">
                            <span className="text-blue-400 font-bold text-xs">$</span>
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
                        className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-sm"
                    >
                        <option>{stakeLabel}</option>
                    </select>
                </div>

                {/* Buy-In Amount Selection */}
                <div className="mb-6">
                    <label className="block text-gray-300 mb-2 font-medium text-sm">Select Buy-In Amount</label>
                    <div className="flex justify-between gap-2 mb-2">
                        <button 
                            onClick={() => handleBuyInChange(maxBuyInFormatted)} 
                            className="flex-1 py-2 text-sm text-white bg-gray-700 hover:bg-gray-600 rounded border border-blue-500/10 transition duration-200"
                        >
                            MAX
                            <br />
                            {maxBuyInFormatted}
                        </button>
                        <button 
                            onClick={() => handleBuyInChange(minBuyInFormatted)} 
                            className="flex-1 py-2 text-sm text-white bg-gray-700 hover:bg-gray-600 rounded border border-blue-500/10 transition duration-200"
                        >
                            MIN
                            <br />
                            {minBuyInFormatted}
                        </button>
                        <div className="flex-1">
                            <label className="text-xs text-gray-400 block mb-1 text-center">OTHER</label>
                            <input
                                type="number"
                                value={buyInAmount}
                                onChange={e => handleBuyInChange(e.target.value)}
                                className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 text-sm text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    {buyInError && <p className="text-red-400 mt-2">⚠️ {buyInError}</p>}
                </div>

                {/* Wait for Big Blind */}
                <div className="flex items-center mb-6">
                    <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-gray-800 mr-2"
                        checked={waitForBigBlind}
                        onChange={() => setWaitForBigBlind(!waitForBigBlind)} 
                    />
                    <label className="text-gray-300 text-sm">Wait for Big Blind</label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between space-x-4 mb-4">
                    <button 
                        onClick={onClose} 
                        className="px-5 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium flex-1 transition-all duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleJoinClick}
                        disabled={isDisabled}
                        className={`px-5 py-3 rounded-lg font-medium flex-1 ${
                            isDisabled
                                ? "bg-gray-500 cursor-not-allowed text-white"
                                : "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-md hover:scale-[1.02] transition-all duration-200"
                        }`}
                    >
                        Take My Seat
                    </button>
                </div>

                {isDisabled && (
                    <div className="text-red-400 text-sm mb-4">
                        Your available balance does not reach the minimum buy-in amount for this game. Please{" "}
                        <span className="underline cursor-pointer text-blue-400 hover:text-blue-300" onClick={() => navigate("/qr-deposit")}>
                            deposit
                        </span>{" "}
                        to continue.
                    </div>
                )}

                <div className="text-xs text-gray-400">
                    <strong>Please Note:</strong> This table has no all-in protection.
                </div>
            </div>
        </div>
    );
};

export default BuyInModal;
