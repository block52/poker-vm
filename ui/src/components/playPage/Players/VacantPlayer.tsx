import * as React from "react";
import { memo, useEffect, useState } from "react";
import PokerProfile from "../../../assets/PokerProfile.svg"
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import useUserWallet from "../../../hooks/useUserWallet";
import LoadingPokerIcon from "../../common/LoadingPokerIcon";
import { toDisplaySeat } from "../../../utils/tableUtils";
import { useTableJoin } from "../../../hooks/playerActions/useTableJoin"; 
import { useMinAndMaxBuyIns } from "../../../hooks/useMinAndMaxBuyIns";
import { useTableTurnIndex } from "../../../hooks/useTableTurnIndex";
import { useTableNonce } from "../../../hooks/useTableNonce";
import { useVacantSeatData } from "../../../hooks/useVacantSeatData";

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
        const { 
            isUserAlreadyPlaying, 
            tableInfo, 
            isSeatVacant: checkSeatVacant, 
            canJoinSeat: checkCanJoinSeat 
        } = useVacantSeatData(useParams<{id: string}>().id);
        
        const { nonce, refreshNonce } = useTableNonce();
        const [localTableData, setLocalTableData] = useState(null);
        const { id: tableId } = useParams();
        const userAddress = localStorage.getItem("user_eth_public_key");
        const privateKey = localStorage.getItem("user_eth_private_key");

        const { balance } = useUserWallet(); // this is the wallet in the browser.
        const actionIndex = useTableTurnIndex(tableId);

        // Add state for buy-in modal
        const [showBuyInModal, setShowBuyInModal] = useState(false);
        const [buyInAmount, setBuyInAmount] = useState("");
        const [buyInError, setBuyInError] = useState("");
        const [isConfirming, setIsConfirming] = useState(false);

        // Add the hook at the top of your component
        const { minBuyInWei, maxBuyInWei, minBuyInFormatted, maxBuyInFormatted } = useMinAndMaxBuyIns(tableId);

        // Debug logs for initial state
        debugLog(`VacantPlayer ${index} initial state:`, {
            userAddress,
            hasLocalTableData: !!localTableData,
            tableId,
            actionIndex
        });

        // Use the hook values directly
        // const isSeatVacant = checkSeatVacant(index);
        // const canJoinThisSeat = checkCanJoinSeat(index);
        
        // For backwards compatibility, keep using these variable names
        const isSeatVacant = React.useMemo(() => checkSeatVacant(index), [checkSeatVacant, index]);
        const canJoinThisSeat = React.useMemo(() => checkCanJoinSeat(index), [checkCanJoinSeat, index]);
        
        // Get blinds directly from the tableInfo
        const smallBlindDisplay = tableInfo.smallBlindDisplay;
        const bigBlindDisplay = tableInfo.bigBlindDisplay;
        const dealerPosition = tableInfo.dealerPosition;
        const smallBlindPosition = tableInfo.smallBlindPosition;
        const bigBlindPosition = tableInfo.bigBlindPosition;

        // Helper function to get position name
        const getPositionName = (index: number): string => {
            return "";
        };

        const { joinTable, isJoining, error: joinError } = tableId 
            ? useTableJoin(tableId) 
            : { joinTable: null, isJoining: false, error: null };

        const handleJoinClick = React.useCallback(async () => {
            debugLog("\n=== JOIN CLICK DETECTED ===");
            debugLog("Can join?", canJoinThisSeat);
            debugLog("isSeatVacant:", isSeatVacant);
            debugLog("isUserAlreadyPlaying:", isUserAlreadyPlaying);
            debugLog("Seat Index:", index);
            debugLog("Table ID:", tableId);
            debugLog("Action Index:", actionIndex);

            if (!canJoinThisSeat) {
                debugLog("Cannot join: either seat is taken or user is already playing");
                return;
            }

            // Instead of joining immediately, show the buy-in modal
            setShowBuyInModal(true);
            setBuyInAmount(maxBuyInFormatted); // Set default to max buy-in
        }, [canJoinThisSeat, isUserAlreadyPlaying, tableId, index, actionIndex, maxBuyInFormatted]);

        // Function to handle the actual join after user confirms buy-in amount
        const handleConfirmBuyIn = async () => {
            setShowBuyInModal(false);
            if (!buyInAmount || parseFloat(buyInAmount) <= 0) {
                setBuyInError("Please enter a valid buy-in amount");
                return;
            }

            // Verify required values exist
            if (!tableId || !userAddress || !privateKey || !joinTable) {
                console.error("Missing required values:", { 
                    hasTableId: !!tableId, 
                    hasUserAddress: !!userAddress, 
                    hasPrivateKey: !!privateKey,
                    hasJoinFunction: !!joinTable
                });
                setBuyInError("Missing required information to join table.");
                return;
            }

            try {
                // Convert ETH to Wei
                const buyInWei = ethers.parseUnits(buyInAmount, 18).toString();
                
                // Validation against min/max
                if (BigInt(buyInWei) < BigInt(minBuyInWei)) {
                    setBuyInError(`Minimum buy-in is $${minBuyInFormatted}`);
                    setShowBuyInModal(true);
                    return;
                }
                
                if (BigInt(buyInWei) > BigInt(maxBuyInWei)) {
                    setBuyInError(`Maximum buy-in is $${maxBuyInFormatted}`);
                    setShowBuyInModal(true);
                    return;
                }

                // Show loading state
                setIsConfirming(true);
                setBuyInError("");
                
                console.log("Joining table with action index:", actionIndex);
                
                // Use the mutation hook to join with the action index
                const result = await joinTable({
                    buyInAmount: buyInWei,
                    userAddress,
                    privateKey,
                    publicKey: userAddress,
                    index: actionIndex
                });
                
                // Handle success (setting table data)
                if (result?.result?.data) {
                    // This will force the hooks to refetch data
                    window.location.reload();
                    
                    // Wait for backend to process the join, then refresh nonce
                    setTimeout(async () => {
                        if (userAddress) {
                            await refreshNonce(userAddress);
                        }
                    }, 1000);
                }
            } catch (error) {
                console.error("Error joining table:", error);
                setShowBuyInModal(true);
                setBuyInError("Failed to join table. Please try again.");
            } finally {
                setIsConfirming(false);
            }
        };

        // Only log position once during mount
        useEffect(() => {
            debugLog("VacantPlayer mounted at position:", { left, top, index });
        }, []);

        return (
            <div className={`absolute ${isSeatVacant ? "cursor-pointer" : ""}`} style={{ left, top }} onClick={canJoinThisSeat ? handleJoinClick : undefined}>
                <div className={`flex justify-center gap-4 mb-2 ${canJoinThisSeat ? "hover:cursor-pointer" : "cursor-default"}`}>
                    <img src={PokerProfile} className="w-12 h-12" />
                </div>
                <div className="text-white text-center">
                    <div className="text-sm mb-1 whitespace-nowrap">
                        {isUserAlreadyPlaying ? "Vacant Seat" : `Seat ${toDisplaySeat(index)}`}
                    </div>

                    {!isUserAlreadyPlaying && (
                        <div className="whitespace-nowrap">
                            {canJoinThisSeat
                                ? index === bigBlindPosition
                                    ? `Click to Join ($${bigBlindDisplay})`
                                    : index === smallBlindPosition
                                        ? `Click to Join ($${smallBlindDisplay})`
                                        : "Click to Join"
                                : "Seat Taken"}
                        </div>
                    )}
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
