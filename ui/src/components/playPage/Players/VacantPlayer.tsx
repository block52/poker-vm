import * as React from "react";
import { memo, useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import PokerProfile from "../../../assets/PokerProfile.svg";
import { toDisplaySeat } from "../../../utils/tableUtils";
import { useVacantSeatData } from "../../../hooks/useVacantSeatData";
import { useNodeRpc } from "../../../context/NodeRpcContext";

// Enable this to see verbose logging
const DEBUG_MODE = false;
const debugLog = (...args: any[]) => {
    if (DEBUG_MODE) console.log(...args);
};

type VacantPlayerProps = {
    left?: string;
    top?: string;
    index: number;
};

const VacantPlayer: React.FC<VacantPlayerProps> = memo(
    ({ left, top, index }) => {
        const { isUserAlreadyPlaying, isSeatVacant: checkSeatVacant, canJoinSeat: checkCanJoinSeat } = useVacantSeatData(useParams<{ id: string }>().id);
        const { id: tableId } = useParams<{ id: string }>();
        const userAddress = localStorage.getItem("user_eth_public_key");
        const privateKey = localStorage.getItem("user_eth_private_key");

        // Get NodeRpcClient
        const { client, isLoading: clientLoading } = useNodeRpc();
        const [showConfirmModal, setShowConfirmModal] = useState(false);
        const [isJoining, setIsJoining] = useState(false);
        const [joinError, setJoinError] = useState<string | null>(null);
        const [joinSuccess, setJoinSuccess] = useState(false);
        const [joinResponse, setJoinResponse] = useState<any>(null);

        const isSeatVacant = useMemo(() => checkSeatVacant(index), [checkSeatVacant, index]);
        const canJoinThisSeat = useMemo(() => checkCanJoinSeat(index), [checkCanJoinSeat, index]);

        const handleJoinClick = useCallback(() => {
            debugLog("Join click:", { index, tableId });
            if (!canJoinThisSeat) return;
            setShowConfirmModal(true);
            setJoinError(null);
            setJoinSuccess(false);
            setJoinResponse(null);
        }, [canJoinThisSeat, index, tableId]);

        const handleConfirmSeat = async () => {
            if (!client || !userAddress || !privateKey || !tableId) {
                setJoinError("Missing required information to join table");
                return;
            }

            const storedAmount = localStorage.getItem("buy_in_amount");
            if (!storedAmount) {
                setJoinError("Missing buy-in amount");
                return;
            }

            setIsJoining(true);
            setJoinError(null);
            setJoinSuccess(false);

            try {
                // Convert the buy-in amount to bigint
                const buyInWei = ethers.parseUnits(storedAmount, 18);

                // Get the latest account info to get the current nonce
                const account = await client.getAccount(userAddress);

                // Log the join attempt
                console.log(`Joining table at seat ${index} with amount ${buyInWei} and nonce ${account.nonce}`);

                // Call the playerJoin method directly from the SDK
                const response = await client.playerJoin(tableId, BigInt(buyInWei.toString()), index, account.nonce);

                console.log("Join table response:", response);
                setJoinResponse(response);
                setJoinSuccess(true);
                setIsJoining(false);

                // Don't reload the page automatically so network requests can be inspected
                // window.location.reload();
            } catch (err) {
                console.error("Failed to join table:", err);
                setJoinError(err instanceof Error ? err.message : "Unknown error joining table");
                setIsJoining(false);
            }
        };

        const handleManualReload = () => {
            window.location.reload();
        };

        return (
            <div className={`absolute ${isSeatVacant ? "cursor-pointer" : ""}`} style={{ left, top }} onClick={canJoinThisSeat ? handleJoinClick : undefined}>
                <div className={`flex justify-center mb-2 ${canJoinThisSeat ? "hover:cursor-pointer" : "cursor-default"}`}>
                    <img src={PokerProfile} className="w-12 h-12" alt="Vacant Seat" />
                </div>
                <div className="text-white text-center">
                    <div className="text-sm mb-1 whitespace-nowrap">{isUserAlreadyPlaying ? "Vacant Seat" : `Seat ${toDisplaySeat(index)}`}</div>
                    {!isUserAlreadyPlaying && <div className="whitespace-nowrap">{canJoinThisSeat ? "Click to Join" : "Seat Taken"}</div>}
                </div>

                {showConfirmModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        onClick={() => !isJoining && !joinSuccess && setShowConfirmModal(false)}
                    >
                        <div
                            className="bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-xl shadow-2xl w-96 border border-gray-700 relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute -right-8 -top-8 text-6xl opacity-10 rotate-12">♠</div>
                            <div className="absolute -left-8 -bottom-8 text-6xl opacity-10 -rotate-12">♥</div>

                            {joinSuccess ? (
                                <>
                                    <h2 className="text-2xl font-bold mb-4 text-white text-center flex items-center justify-center">
                                        <span className="text-green-400 mr-2">♣</span>
                                        Join Request Sent!
                                        <span className="text-red-400 ml-2">♦</span>
                                    </h2>

                                    <div className="mb-4 p-3 bg-green-900/50 text-green-200 rounded-lg">
                                        <p className="mb-2">Join request for seat {index} has been sent to the network.</p>
                                        <p className="mb-2 text-yellow-300 text-sm">
                                            Note: Join not confirmed by mining yet and state not persisted. Check network status.
                                        </p>
                                        <p className="text-xs text-gray-300">
                                            Transaction Hash:{" "}
                                            {joinResponse?.hash ? `${joinResponse.hash.slice(0, 10)}...${joinResponse.hash.slice(-8)}` : "N/A"}
                                        </p>
                                    </div>

                                    <div className="mb-4 overflow-hidden bg-gray-900 rounded-lg p-2">
                                        <pre className="text-xs text-gray-300 overflow-auto max-h-40">{JSON.stringify(joinResponse, null, 2)}</pre>
                                    </div>

                                    <button
                                        onClick={handleManualReload}
                                        className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-lg hover:from-blue-500 hover:to-blue-400 transition"
                                    >
                                        Reload Page to See Changes
                                    </button>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold mb-4 text-white text-center flex items-center justify-center">
                                        <span className="text-green-400 mr-2">♣</span>
                                        Sit Here?
                                        <span className="text-red-400 ml-2">♦</span>
                                    </h2>

                                    {joinError && <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-lg text-sm">Error: {joinError}</div>}

                                    <div className="flex justify-between space-x-4 mt-6">
                                        <button
                                            onClick={() => setShowConfirmModal(false)}
                                            className="px-5 py-3 bg-gray-600 text-white rounded-lg flex-1 hover:bg-gray-500 transition"
                                            disabled={isJoining}
                                        >
                                            No
                                        </button>
                                        <button
                                            onClick={handleConfirmSeat}
                                            disabled={isJoining || clientLoading}
                                            className="px-5 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg flex-1 shadow-lg hover:from-green-500 hover:to-green-400 transform hover:scale-105 transition flex items-center justify-center"
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
                                                "Yes"
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    },
    (prev, next) => prev.left === next.left && prev.top === next.top && prev.index === next.index
);

VacantPlayer.displayName = "VacantPlayer";

export default VacantPlayer;
