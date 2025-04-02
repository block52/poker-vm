import * as React from "react";
import { memo, useEffect, useState } from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { PROXY_URL } from "../../../config/constants";
import axios from "axios";
import { ethers } from "ethers";
import { useTableContext } from "../../../context/TableContext";
import { getSignature } from "../../../utils/accountUtils";
import useUserWallet from "../../../hooks/useUserWallet";
import LoadingPokerIcon from "../../common/LoadingPokerIcon";

// Enable this to see verbose logging
const DEBUG_MODE = false;

// Helper function that only logs when DEBUG_MODE is true
const debugLog = (...args: any[]) => {
    if (DEBUG_MODE) {
        console.log(...args);
    }
};

type VacantPlayerProps = {
    left?: string; // Front side image source
    top?: string; // Back side image source
    index: number;
};

const VacantPlayer: React.FC<VacantPlayerProps> = memo(
    ({ left, top, index }) => {
        const { tableData, setTableData, nonce, refreshNonce, userPublicKey } = useTableContext();
        const [localTableData, setLocalTableData] = useState(tableData);
        const { id: tableId } = useParams();
        const userAddress = localStorage.getItem("user_eth_public_key");
        const privateKey = localStorage.getItem("user_eth_private_key");

        const { balance } = useUserWallet(); // this is the wallet in the browser.

        // Add state for buy-in modal
        const [showBuyInModal, setShowBuyInModal] = useState(false);
        const [buyInAmount, setBuyInAmount] = useState("");
        const [buyInError, setBuyInError] = useState("");
        const [isConfirming, setIsConfirming] = useState(false);

        // Debug logs for initial state
        debugLog(`VacantPlayer ${index} initial state:`, {
            userAddress,
            hasTableData: !!tableData,
            hasLocalTableData: !!localTableData,
            tableId
        });

        // Update local table data with debounce
        useEffect(() => {
            const timer = setTimeout(() => {
                setLocalTableData(tableData);
                debugLog(`VacantPlayer ${index} updated localTableData:`, {
                    hasData: !!tableData,
                    players: tableData?.data?.players?.map((p: any) => ({
                        address: p.address,
                        seat: p.seat
                    }))
                });
            }, 1000); // 1 second debounce

            return () => clearTimeout(timer);
        }, [tableData, index]);

        // First, check if user is already playing
        // First, check if user is already playing
        const isUserAlreadyPlaying = React.useMemo(() => {
            if (!userAddress) {
                debugLog(`VacantPlayer ${index} - No user address found`);
                return false;
            }

            if (!localTableData?.data?.players) {
                debugLog(`VacantPlayer ${index} - No players data found`);
                return false;
            }

            // Log each player for comparison
            localTableData.data.players.forEach((player: any, idx: number) => {
                debugLog(`Player ${idx} comparison:`, {
                    playerAddress: player.address,
                    userAddress: userAddress,
                    isMatch: player.address?.toLowerCase() === userAddress?.toLowerCase(),
                    playerSeat: player.seat
                });
            });

            const result = localTableData.data.players.some((player: any) => player.address?.toLowerCase() === userAddress?.toLowerCase());

            debugLog(`VacantPlayer ${index} - isUserAlreadyPlaying:`, result);
            return result;
        }, [localTableData?.data?.players, userAddress, index]);

        // Calculate next available seat
        const nextAvailableSeat = React.useMemo(() => {
            if (isUserAlreadyPlaying) {
                debugLog(`VacantPlayer ${index} - User already playing, no available seat`);
                return -1;
            }

            // Get occupied seats
            const occupiedSeats = new Set();
            if (localTableData?.data?.players) {
                localTableData.data.players.forEach((player: any) => {
                    if (player.address && player.address !== "0x0000000000000000000000000000000000000000") {
                        occupiedSeats.add(player.seat);
                    }
                });
            }

            debugLog(`VacantPlayer ${index} - Occupied seats:`, Array.from(occupiedSeats));

            // Find the first available seat (0-8)
            for (let i = 0; i < 9; i++) {
                if (!occupiedSeats.has(i)) {
                    debugLog(`VacantPlayer ${index} - First available seat:`, i);
                    return i;
                }
            }

            debugLog(`VacantPlayer ${index} - No available seats found`);
            return -1;
        }, [isUserAlreadyPlaying, localTableData?.data?.players, index]);

        // Check if this seat is vacant (not occupied by any player)
        const isSeatVacant = React.useMemo(() => {
            if (!localTableData?.data?.players) {
                return true; // If no player data, assume seat is vacant
            }

            // Check if any player occupies this seat
            const isOccupied = localTableData.data.players.some(
                (player: any) => player.seat === index && player.address && player.address !== "0x0000000000000000000000000000000000000000"
            );

            debugLog(`VacantPlayer ${index} - isSeatVacant:`, !isOccupied);
            return !isOccupied;
        }, [localTableData?.data?.players, index]);

        // Check if this seat is available to join
        // Allow joining at any vacant seat
        const canJoinThisSeat = React.useMemo(() => {
            // User can join if:
            // 1. The seat is vacant
            // 2. The user is not already playing
            const result = isSeatVacant && !isUserAlreadyPlaying;

            debugLog(`VacantPlayer ${index} - canJoinThisSeat:`, {
                isSeatVacant,
                isUserAlreadyPlaying,
                result
            });

            return result;
        }, [isSeatVacant, isUserAlreadyPlaying]);

        const isNextAvailableSeat = index === nextAvailableSeat;
        debugLog(`VacantPlayer ${index} - isNextAvailableSeat:`, isNextAvailableSeat, {
            index,
            nextAvailableSeat
        });

        // Get blind values from table data
        const smallBlindWei = localTableData?.data?.smallBlind || "0";
        const bigBlindWei = localTableData?.data?.bigBlind || "0";
        const smallBlindDisplay = ethers.formatUnits(smallBlindWei, 18);
        const bigBlindDisplay = ethers.formatUnits(bigBlindWei, 18);

        // Get dealer position from table data
        const dealerPosition = localTableData?.data?.dealer || 0;
        debugLog(`VacantPlayer ${index} - Dealer position:`, dealerPosition);

        // Calculate small blind and big blind positions
        const smallBlindPosition = (dealerPosition + 1) % 9; // Assuming 9 max seats
        const bigBlindPosition = (dealerPosition + 2) % 9;
        debugLog(`VacantPlayer ${index} - Blind positions:`, {
            dealer: dealerPosition,
            smallBlind: smallBlindPosition,
            bigBlind: bigBlindPosition
        });

        // Helper function to get position name
        const getPositionName = (index: number): string => {
            return "";
        };

        const handleJoinClick = React.useCallback(async () => {
            debugLog("\n=== JOIN CLICK DETECTED ===");
            debugLog("Can join?", canJoinThisSeat);
            debugLog("isSeatVacant:", isSeatVacant);
            debugLog("isUserAlreadyPlaying:", isUserAlreadyPlaying);
            debugLog("Seat Index:", index);
            debugLog("Table ID:", tableId);

            if (!canJoinThisSeat) {
                debugLog("Cannot join: either seat is taken or user is already playing");
                return;
            }

            // Instead of joining immediately, show the buy-in modal
            setShowBuyInModal(true);

            // Set default buy-in amount (20x big blind)
            const bigBlindValue = localTableData?.data?.bigBlind || "200000000000000000"; // 0.2 USDC
            const twentyBigBlinds = (BigInt(bigBlindValue) * BigInt(20)).toString();
            const defaultBuyIn = ethers.formatUnits(twentyBigBlinds, 18);
            setBuyInAmount(defaultBuyIn);
        }, [canJoinThisSeat, isUserAlreadyPlaying, tableId, localTableData, index]);

        // Function to handle the actual join after user confirms buy-in amount
        const handleConfirmBuyIn = async () => {

            setShowBuyInModal(false);
            if (!buyInAmount || parseFloat(buyInAmount) <= 0) {
                setBuyInError("Please enter a valid buy-in amount");
                return;
            }

            try {
                // Convert ETH to Wei
                const buyInWei = ethers.parseUnits(buyInAmount, 18).toString();
                debugLog("Buy-in amount in Wei:", buyInWei);

                // Show loading icon and hide modal
                setIsConfirming(true);
                setBuyInError("");

                // Use setTimeout with 0 delay to ensure UI updates before proceeding
                setTimeout(async () => {
                    try {
                        // Call the join table function with the specified amount
                        await handleJoinTable(buyInWei);
                    } catch (error) {
                        console.error("Error joining table:", error);
                        setShowBuyInModal(true);
                        setBuyInError("Failed to join table. Please try again.");
                        setIsConfirming(false);
                    } finally {
                        // Reset confirming state when done
                        setTimeout(() => {
                            setIsConfirming(false);
                        }, 1000);
                    }
                }, 0);
            } catch (error) {
                console.error("Error converting buy-in amount:", error);
                setBuyInError("Invalid buy-in amount");
                setIsConfirming(false);
            }
        };

        const handleJoinTable = async (buyInWei: string) => {
            if (!userAddress || !privateKey) {
                console.error("Missing user address or private key");
                return;
            }

            try {
                await refreshNonce(userAddress);
                const currentNonce = nonce?.toString() || "0";

                debugLog("User balance:", balance);

                // Get minimum buy-in from table data with proper fallback
                const bigBlindValue = localTableData?.data?.bigBlind || "200000000000000000"; // 0.2 USDC default
                const twentyBigBlinds = (BigInt(bigBlindValue) * BigInt(20)).toString();
                const minBuyIn = localTableData?.data?.minBuyIn || twentyBigBlinds; // Default to 20x big blind

                debugLog("=== MIN BUY IN ===");
                debugLog("minBuyIn:", minBuyIn);
                debugLog("bigBlindValue:", bigBlindValue);
                debugLog("twentyBigBlinds:", twentyBigBlinds);

                // Use the user's input amount directly
                const buyInAmount = buyInWei;

                // Check if user's input exceeds their balance
                if (balance && BigInt(buyInWei) > BigInt(balance)) {
                    debugLog(`User input (${buyInWei}) exceeds balance (${balance})`);
                    setShowBuyInModal(true);
                    setBuyInError(`Amount exceeds your balance of ${ethers.formatUnits(balance, 18)} USDC`);
                    return;
                }

                debugLog("Final buy-in amount:", buyInAmount);

                const signature = await getSignature(privateKey, currentNonce, userAddress, tableId, buyInAmount, "join");

                const requestData = {
                    id: "1",
                    method: "transfer",
                    userAddress,
                    tableId,
                    buyInAmount,
                    signature,
                    publicKey: userPublicKey
                };

                debugLog("Sending join request:", requestData);
                const response = await axios.post(`${PROXY_URL}/table/${tableId}/join`, requestData);
                debugLog("Join response:", response.data);

                if (response.data?.result?.data) {
                    setTableData(response.data.result.data);

                    // Wait for backend to process the join, then fetch fresh data
                    setTimeout(async () => {
                        try {
                            debugLog("Fetching fresh table data after join...");
                            const freshDataResponse = await axios.get(`${PROXY_URL}/get_game_state/${tableId}`);
                            debugLog("Fresh table data received:", freshDataResponse.data);
                            setTableData({ data: freshDataResponse.data });
                        } catch (refreshError) {
                            console.error("Error refreshing table data:", refreshError);
                        }
                    }, 1500); // Wait 1.5 seconds before refreshing
                }
            } catch (error) {
                console.error("Error joining table:", error);
                // Show error to user
                setShowBuyInModal(true);
                setBuyInError("Failed to join table. Please try again.");
            }
        };

        // Update the useEffect to set default buy-in to max wallet amount
        useEffect(() => {
            if (showBuyInModal && balance) {
                // Set the buy-in amount to the player's full balance
                const maxBuyIn = ethers.formatUnits(balance, 18);
                
                // Get minimum buy-in from table data
                const bigBlindValue = localTableData?.data?.bigBlind || "200000000000000000"; // 0.2 USDC default
                const twentyBigBlinds = (BigInt(bigBlindValue) * BigInt(20)).toString();
                const minBuyInWei = localTableData?.data?.minBuyIn || twentyBigBlinds;
                const minBuyIn = ethers.formatUnits(minBuyInWei, 18);
                
                // Set to maximum wallet amount (or min buy-in if that's higher)
                const defaultAmount = Number(maxBuyIn) < Number(minBuyIn) ? maxBuyIn : maxBuyIn;
                setBuyInAmount(defaultAmount);
            }
        }, [showBuyInModal, balance, localTableData?.data?.bigBlind, localTableData?.data?.minBuyIn]);

        // Only log position once during mount
        useEffect(() => {
            debugLog("VacantPlayer mounted at position:", { left, top, index });
        }, []);

        return (
            <div className={`absolute ${isSeatVacant ? "cursor-pointer" : ""}`} style={{ left, top }} onClick={canJoinThisSeat ? handleJoinClick : undefined}>
                <div className={`flex justify-center gap-4 mb-2 ${canJoinThisSeat ? "hover:cursor-pointer" : "cursor-default"}`}>
                    <FaRegUserCircle style={{ color: "rgba(255, 255, 255, 0.4)" }} className="w-12 h-12" />
                </div>
                <div className="text-white text-center">
                    <div className="text-sm mb-1 whitespace-nowrap">Seat {index}</div>

                    <div className="whitespace-nowrap">
                        {isUserAlreadyPlaying
                            ? "Already playing"
                            : canJoinThisSeat
                              ? index === localTableData?.data?.bigBlindPosition
                                  ? `Click to Join ($${bigBlindDisplay})`
                                  : index === localTableData?.data?.smallBlindPosition
                                    ? `Click to Join ($${smallBlindDisplay})`
                                    : "Click to Join"
                              : "Seat Taken"}
                    </div>
                </div>
                {/* Position indicator */}
                {getPositionName(index) && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        <div className="px-2 py-1 bg-gray-800/80 rounded-md text-xs text-white">{getPositionName(index)}</div>
                    </div>
                )}

                {/* Loading Animation - with semi-transparent background */}
                {isConfirming && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black bg-opacity-60">
                        <LoadingPokerIcon size={80} />
                    </div>
                )}

                {/* Enhanced Buy-in Modal - remove full-screen overlay */}
                {showBuyInModal && (
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                        <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-xl shadow-2xl w-96 border border-gray-700 overflow-hidden relative">
                            {/* Decorative card suits in the background */}
                            <div className="absolute -right-8 -top-8 text-6xl opacity-10 rotate-12">♠</div>
                            <div className="absolute -left-8 -bottom-8 text-6xl opacity-10 -rotate-12">♥</div>
                            
                            <h2 className="text-2xl font-bold mb-2 text-white flex items-center">
                                <span className="text-green-400 mr-2">♣</span>
                                Buy In
                                <span className="text-red-400 ml-2">♦</span>
                            </h2>
                            
                            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent mb-4 opacity-50"></div>
                            
                            <p className="mb-6 text-gray-300">How much would you like to bring to the table?</p>

                            <div className="mb-6">
                                <label className="block text-gray-300 mb-2 font-medium">Amount (USDC):</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        value={buyInAmount}
                                        onChange={e => setBuyInAmount(e.target.value)}
                                        className="w-full p-3 pl-8 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400 transition-all duration-200"
                                        placeholder="0.00"
                                        step="0.1"
                                        min="0.1"
                                    />
                                </div>
                                {buyInError && (
                                    <p className="text-red-400 mt-2 flex items-center">
                                        <span className="mr-1">⚠️</span>
                                        {buyInError}
                                    </p>
                                )}
                                <p className="text-xs text-gray-400 mt-2">
                                    Your balance: ${balance ? ethers.formatUnits(balance, 18) : "0.00"} USDC
                                </p>
                            </div>

                            <div className="flex justify-between space-x-4">
                                <button
                                    onClick={() => {
                                        setShowBuyInModal(false);
                                        setBuyInError("");
                                    }}
                                    className="px-5 py-3 rounded-lg bg-gray-600 text-white font-medium transition-all duration-200 hover:bg-gray-500 flex-1"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleConfirmBuyIn} 
                                    className="px-5 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white font-medium shadow-lg transition-all duration-200 hover:from-green-500 hover:to-green-400 transform hover:scale-105 flex-1"
                                >
                                    Take Seat
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    },
    (prevProps, nextProps) => {
        // Custom comparison for memo
        return prevProps.left === nextProps.left && prevProps.top === nextProps.top && prevProps.index === nextProps.index;
    }
);

VacantPlayer.displayName = "VacantPlayer";

export default VacantPlayer;
