import React from "react";
import { LoadingSpinner } from "../common";
import { PlayerStatus } from "@bitcoinbrisbane/block52";
import { colors } from "../../utils/colorConfig";

interface MainActionButtonsProps {
    canFold: boolean;
    canCheck: boolean;
    canCall: boolean;
    callAmount: string;
    canBet: boolean;
    canRaise: boolean;
    raiseAmount: number;
    isRaiseAmountInvalid: boolean;
    playerStatus: PlayerStatus;
    loading: string | null;
    isMobileLandscape: boolean;
    onFold: () => void;
    onCheck: () => void;
    onCall: () => void;
    onBetOrRaise: () => void;
}

export const MainActionButtons: React.FC<MainActionButtonsProps> = ({
    canFold,
    canCheck,
    canCall,
    callAmount,
    canBet,
    canRaise,
    raiseAmount,
    isRaiseAmountInvalid,
    playerStatus,
    loading,
    isMobileLandscape,
    onFold,
    onCheck,
    onCall,
    onBetOrRaise
}) => {
    return (
        <div className={`flex justify-between ${isMobileLandscape ? "gap-0.5" : "gap-1 lg:gap-2"}`}>
            {/* Fold button with loading spinner - issue #1377 */}
            {canFold && (
                <button
                    className={`btn-fold cursor-pointer active:scale-105 rounded-lg border transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${
                        isMobileLandscape
                            ? "px-2 py-0.5 text-[10px] min-w-[50px]"
                            : "px-3 lg:px-6 py-1.5 lg:py-2 text-xs lg:text-sm min-w-[80px] lg:min-w-[100px]"
                    }`}
                    onClick={onFold}
                    disabled={loading !== null}
                >
                    {loading === "fold" && <LoadingSpinner size="sm" />}
                    {loading === "fold" ? "FOLDING..." : "FOLD"}
                </button>
            )}

            {playerStatus === PlayerStatus.FOLDED && (
                <div className="text-gray-400 py-1.5 lg:py-2 px-2 lg:px-4 bg-gray-800 bg-opacity-50 rounded-lg text-xs lg:text-sm">
                    You have folded this hand
                </div>
            )}

            {canCheck && (
                <button
                    className={`cursor-pointer bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#1e3a8a]/90 hover:to-[#1e40af]/90 active:from-[#1e40af] active:to-[#2563eb]
                    rounded-lg w-full border border-[#3a546d] hover:border-[#1e3a8a]/50 active:border-[#3b82f6]/70 shadow-md backdrop-blur-sm
                    transition-all duration-200 font-medium transform active:scale-105 active:shadow-[0_0_15px_rgba(59,130,246,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${
                        isMobileLandscape ? "px-2 py-0.5 text-[10px]" : "px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm"
                    }`}
                    onClick={onCheck}
                    disabled={loading !== null}
                >
                    {loading === "check" && <LoadingSpinner size="sm" />}
                    {loading === "check" ? "CHECKING..." : "CHECK"}
                </button>
            )}

            {canCall && (
                <button
                    className={`btn-call cursor-pointer rounded-lg w-full border shadow-md backdrop-blur-sm
                    transition-all duration-200 font-medium transform active:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${
                        isMobileLandscape ? "px-2 py-0.5 text-[10px]" : "px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm"
                    }`}
                    onClick={onCall}
                    disabled={loading !== null}
                >
                    {loading === "call" && <LoadingSpinner size="sm" />}
                    {loading === "call" ? (
                        "CALLING..."
                    ) : (
                        <>
                            CALL <span style={{ color: colors.brand.primary }}>${callAmount}</span>
                        </>
                    )}
                </button>
            )}

            {(canRaise || canBet) && (
                <button
                    onClick={onBetOrRaise}
                    disabled={loading !== null || (canRaise ? isRaiseAmountInvalid : false)}
                    className={`cursor-pointer hover:scale-105 btn-raise rounded-lg w-full border shadow-md backdrop-blur-sm transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${
                        isMobileLandscape ? "px-2 py-0.5 text-[10px]" : "px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm"
                    }`}
                >
                    {(loading === "raise" || loading === "bet") && <LoadingSpinner size="sm" />}
                    {loading === "raise" || loading === "bet" ? (
                        canRaise ? (
                            "RAISING..."
                        ) : (
                            "BETTING..."
                        )
                    ) : (
                        <>
                            {canRaise ? "RAISE" : "BET"}{" "}
                            <span style={{ color: colors.brand.primary }}>${raiseAmount.toFixed(2)}</span>
                        </>
                    )}
                </button>
            )}
        </div>
    );
};
