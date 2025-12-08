import React from "react";
import { LoadingSpinner } from "../common";
import { PlayerStatus } from "@bitcoinbrisbane/block52";

interface BlindButtonGroupProps {
    showSmallBlind: boolean;
    showBigBlind: boolean;
    smallBlindAmount: string;
    bigBlindAmount: string;
    canFold: boolean;
    playerStatus: PlayerStatus;
    loading: string | null;
    isMobileLandscape: boolean;
    onPostSmallBlind: () => void;
    onPostBigBlind: () => void;
    onFold: () => void;
}

export const BlindButtonGroup: React.FC<BlindButtonGroupProps> = ({
    showSmallBlind,
    showBigBlind,
    smallBlindAmount,
    bigBlindAmount,
    canFold,
    playerStatus,
    loading,
    isMobileLandscape,
    onPostSmallBlind,
    onPostBigBlind,
    onFold
}) => {
    return (
        <div className={`flex justify-center items-center ${isMobileLandscape ? "gap-0.5" : "gap-1 lg:gap-2"}`}>
            {showSmallBlind && playerStatus !== PlayerStatus.FOLDED && (
                <button
                    onClick={onPostSmallBlind}
                    disabled={loading !== null}
                    className="btn-small-blind text-white font-medium py-1.5 lg:py-2 px-2 lg:px-4 rounded-lg shadow-md transition-all duration-200 text-xs lg:text-sm border flex items-center transform hover:scale-105 mr-1 lg:mr-2 disabled:opacity-50 disabled:cursor-not-allowed gap-1"
                >
                    {loading === "small-blind" && <LoadingSpinner size="sm" />}
                    {loading === "small-blind" ? (
                        <span>Posting...</span>
                    ) : (
                        <>
                            <span className="mr-1">Post Small Blind</span>
                            <span className="btn-small-blind-amount backdrop-blur-sm px-1 lg:px-2 py-1 rounded text-xs border">
                                ${smallBlindAmount}
                            </span>
                        </>
                    )}
                </button>
            )}

            {showBigBlind && playerStatus !== PlayerStatus.FOLDED && (
                <button
                    onClick={onPostBigBlind}
                    disabled={loading !== null}
                    className="btn-big-blind text-white font-medium py-1.5 lg:py-2 px-2 lg:px-4 rounded-lg shadow-md transition-all duration-200 text-xs lg:text-sm border flex items-center transform hover:scale-105 mr-1 lg:mr-2 disabled:opacity-50 disabled:cursor-not-allowed gap-1"
                >
                    {loading === "big-blind" && <LoadingSpinner size="sm" />}
                    {loading === "big-blind" ? (
                        <span>Posting...</span>
                    ) : (
                        <>
                            <span className="mr-1">Post Big Blind</span>
                            <span className="btn-big-blind-amount backdrop-blur-sm px-1 lg:px-2 py-1 rounded text-xs border">
                                ${bigBlindAmount}
                            </span>
                        </>
                    )}
                </button>
            )}

            {canFold && (
                <button
                    className={`btn-fold cursor-pointer active:scale-105 px-3 lg:px-6 py-1.5 lg:py-2 rounded-lg border text-xs lg:text-sm transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                        loading === "fold" ? "min-w-[110px] lg:min-w-[130px]" : "min-w-[80px] lg:min-w-[100px]"
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
        </div>
    );
};
