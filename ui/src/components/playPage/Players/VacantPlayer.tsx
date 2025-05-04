import * as React from "react";
import { memo, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import useUserWallet from "../../../hooks/useUserWallet";
import LoadingPokerIcon from "../../common/LoadingPokerIcon";
import { toDisplaySeat } from "../../../utils/tableUtils";
import { useTableJoin } from "../../../hooks/playerActions/useTableJoin"; 
import { useTableTurnIndex } from "../../../hooks/useTableTurnIndex";
import { useTableNonce } from "../../../hooks/useTableNonce";
import { useVacantSeatData } from "../../../hooks/useVacantSeatData";

const DEBUG_MODE = false;
const debugLog = (...args: any[]) => DEBUG_MODE && console.log(...args);

type VacantPlayerProps = {
    left?: string;
    top?: string;
    index: number;
};

const CleanPlayerIcon: React.FC = () => (
    <div className="w-12 h-12 relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.25)]"></div>
        <svg width="24" height="24" viewBox="0 0 24 24" className="relative z-10">
            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#111827" />
            <path d="M12 14C7.03172 14 3 18.0317 3 23H21C21 18.0317 16.9683 14 12 14Z" fill="#111827" />
        </svg>
    </div>
);

const VacantPlayer: React.FC<VacantPlayerProps> = memo(({ left, top, index }) => {
    const { isUserAlreadyPlaying, tableInfo, isSeatVacant: checkSeatVacant, canJoinSeat: checkCanJoinSeat } = useVacantSeatData(useParams<{ id: string }>().id);
    const { nonce, refreshNonce } = useTableNonce();
    const { id: tableId } = useParams();
    const userAddress = localStorage.getItem("user_eth_public_key");
    const privateKey = localStorage.getItem("user_eth_private_key");
    const { balance } = useUserWallet();
    const actionIndex = useTableTurnIndex(tableId);
    const [isConfirming, setIsConfirming] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const isSeatVacant = React.useMemo(() => checkSeatVacant(index), [checkSeatVacant, index]);
    const canJoinThisSeat = React.useMemo(() => checkCanJoinSeat(index), [checkCanJoinSeat, index]);

    const smallBlindDisplay = tableInfo.smallBlindDisplay;
    const bigBlindDisplay = tableInfo.bigBlindDisplay;
    const dealerPosition = tableInfo.dealerPosition;
    const smallBlindPosition = tableInfo.smallBlindPosition;
    const bigBlindPosition = tableInfo.bigBlindPosition;

    const getPositionName = (index: number): string => "";

    const { joinTable, isJoining, error: joinError } = tableId 
        ? useTableJoin(tableId) 
        : { joinTable: null, isJoining: false, error: null };

    const handleJoinClick = React.useCallback(() => {
        if (!canJoinThisSeat) return;
        setShowConfirmation(true);
    }, [canJoinThisSeat]);

    const handleConfirmSeat = async () => {
        const buyInAmount = localStorage.getItem("buy_in_amount") || "0";
        const waitForBigBlind = JSON.parse(localStorage.getItem("wait_for_big_blind") || "true");

        if (!tableId || !userAddress || !privateKey || !joinTable) {
            console.error("Missing required values");
            return;
        }

        try {
            const buyInWei = ethers.parseUnits(buyInAmount, 18).toString();
            setIsConfirming(true);

            const result = await joinTable({
                buyInAmount: buyInWei,
                userAddress,
                privateKey,
                publicKey: userAddress,
                
                index: actionIndex,
            });

            if (result?.result?.data) {
                window.location.reload();
                setTimeout(async () => {
                    if (userAddress) await refreshNonce(userAddress);
                }, 1000);
            }
        } catch (err) {
            console.error("Error joining table:", err);
        } finally {
            setIsConfirming(false);
        }
    };

    useEffect(() => {
        debugLog("VacantPlayer mounted at position:", { left, top, index });
    }, []);

    return (
        <div 
            className={`absolute ${isSeatVacant ? "cursor-pointer" : ""}`} 
            style={{ left, top }} 
            onClick={canJoinThisSeat ? handleJoinClick : undefined}
        >
            <div className={`flex justify-center mb-2 ${canJoinThisSeat ? "transition-transform hover:translate-y-[-2px] duration-200" : ""}`}>
                <CleanPlayerIcon />
            </div>
            <div className="text-white text-center">
                <div className="text-sm font-medium mb-1 text-shadow-sm">
                    {isUserAlreadyPlaying ? "Vacant Seat" : `Seat ${toDisplaySeat(index)}`}
                </div>
                {!isUserAlreadyPlaying && (
                    <div className="text-xs text-shadow-sm">
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
            {getPositionName(index) && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="px-2 py-1 bg-gray-800/80 rounded-md text-xs text-white">{getPositionName(index)}</div>
                </div>
            )}

            {isConfirming && (
                <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black bg-opacity-60">
                    <LoadingPokerIcon size={80} />
                </div>
            )}

            {showConfirmation && (
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                    <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl w-80 border border-gray-700 overflow-hidden relative">
                        <div className="text-white text-lg font-semibold mb-4">Sit at Seat {toDisplaySeat(index)}?</div>
                        <div className="flex justify-between space-x-4">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="px-4 py-2 rounded-lg bg-gray-600 text-white font-medium hover:bg-gray-500 flex-1"
                            >
                                No
                            </button>
                            <button
                                onClick={handleConfirmSeat}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white font-medium shadow-lg hover:from-green-500 hover:to-green-400 transform hover:scale-105 flex-1"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.left === nextProps.left && prevProps.top === nextProps.top && prevProps.index === nextProps.index;
});

VacantPlayer.displayName = "VacantPlayer";

export default VacantPlayer;
