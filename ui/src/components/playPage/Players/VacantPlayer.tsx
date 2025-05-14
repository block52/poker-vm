import * as React from "react";
import { memo, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import PokerProfile from "../../../assets/PokerProfile.svg";
import { toDisplaySeat } from "../../../utils/tableUtils";
import { useVacantSeatData } from "../../../hooks/useVacantSeatData";
import { useNodeRpc } from "../../../context/NodeRpcContext";


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
        // These states are kept but we won't show the success modal
        const [joinSuccess, setJoinSuccess] = useState(false);
        const [joinResponse, setJoinResponse] = useState<any>(null);

        const isSeatVacant = useMemo(() => checkSeatVacant(index), [checkSeatVacant, index]);
        const canJoinThisSeat = useMemo(() => checkCanJoinSeat(index), [checkCanJoinSeat, index]);

        const handleJoinClick = useCallback(() => {
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

                // Call the playerJoin method directly from the SDK
                const response = await client.playerJoin(tableId, BigInt(buyInWei.toString()), index, account.nonce);

                // Store response in state but don't show it - just for debugging if needed
                setJoinResponse(response);
                setJoinSuccess(true);
                
                // Close the modal immediately and let the page update naturally via normal data flow
                setShowConfirmModal(false);
                
                // PLACEHOLDER: A future animation could be displayed here before refresh
                // For now, we just reload the page after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 300); // Short delay to allow for potential animation
                
            } catch (err) {
                console.error("Failed to join table:", err);
                setJoinError(err instanceof Error ? err.message : "Unknown error joining table");
                setIsJoining(false);
            }
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
                        className="fixed inset-0 flex items-center justify-center z-50"
                        onClick={() => !isJoining && setShowConfirmModal(false)}
                    >
                        <div
                            className="bg-gray-800 p-6 rounded-xl w-96 shadow-2xl border border-blue-400/20"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-white mb-4">Join Seat {toDisplaySeat(index)}</h3>
                            
                            {joinError && (
                                <div className="mb-4 p-3 bg-red-900/30 text-red-200 rounded-lg text-sm border border-red-500/20">
                                    {joinError}
                                </div>
                            )}
                            
                            <p className="text-gray-300 mb-6 text-center">
                                Ready to join at seat {toDisplaySeat(index)}?
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
                                    disabled={isJoining || clientLoading}
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
            </div>
        );
    },
    (prev, next) => prev.left === next.left && prev.top === next.top && prev.index === next.index
);

VacantPlayer.displayName = "VacantPlayer";

export default VacantPlayer;
