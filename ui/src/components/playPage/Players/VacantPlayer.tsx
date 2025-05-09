import * as React from "react";
import { memo, useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import PokerProfile from "../../../assets/PokerProfile.svg";
import { toDisplaySeat } from "../../../utils/tableUtils";
import { useTableJoin } from "../../../hooks/playerActions/useTableJoin";
import { useTableTurnIndex } from "../../../hooks/useTableTurnIndex";
import { useVacantSeatData } from "../../../hooks/useVacantSeatData";

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
        const actionIndex = useTableTurnIndex(tableId);

        const [showConfirmModal, setShowConfirmModal] = useState(false);
        const isSeatVacant = useMemo(() => checkSeatVacant(index), [checkSeatVacant, index]);
        const canJoinThisSeat = useMemo(() => checkCanJoinSeat(index), [checkCanJoinSeat, index]);

        const { joinTable } = useTableJoin(tableId);

        const handleJoinClick = useCallback(() => {
            debugLog("Join click:", { index, tableId });
            if (!canJoinThisSeat) return;
            setShowConfirmModal(true);
        }, [canJoinThisSeat, index, tableId]);

        const handleConfirmSeat = async () => {
            setShowConfirmModal(false);

            const storedAmount = localStorage.getItem("buy_in_amount");

            if (!storedAmount || !joinTable || !userAddress || !privateKey) {
                console.error("Missing join parameters");
                return;
            }

            try {
                const buyInWei = ethers.parseUnits(storedAmount, 18).toString();
                await joinTable({
                    buyInAmount: buyInWei,
                    userAddress,
                    privateKey,
                    publicKey: userAddress,
                    index: actionIndex
                });
                window.location.reload();
            } catch (err) {
                console.error("Failed to join:", err);
            }
        };

        useEffect(() => {
            debugLog("VacantPlayer mounted:", { left, top, index });
        }, [left, top, index]);

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
                        onClick={() => setShowConfirmModal(false)}
                    >
                        <div
                            className="bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-xl shadow-2xl w-96 border border-gray-700 relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute -right-8 -top-8 text-6xl opacity-10 rotate-12">♠</div>
                            <div className="absolute -left-8 -bottom-8 text-6xl opacity-10 -rotate-12">♥</div>
                            <h2 className="text-2xl font-bold mb-4 text-white text-center flex items-center justify-center">
                                <span className="text-green-400 mr-2">♣</span>
                                Sit Here?
                                <span className="text-red-400 ml-2">♦</span>
                            </h2>
                            <div className="flex justify-between space-x-4 mt-6">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-5 py-3 bg-gray-600 text-white rounded-lg flex-1 hover:bg-gray-500 transition"
                                >
                                    No
                                </button>
                                <button
                                    onClick={handleConfirmSeat}
                                    className="px-5 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg flex-1 shadow-lg hover:from-green-500 hover:to-green-400 transform hover:scale-105 transition"
                                >
                                    Yes
                                </button>
                            </div>
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
