import { useEffect, useState } from "react";
import * as React from "react";
import { usePlayerContext } from "../context/usePlayerContext";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { STORAGE_PUBLIC_KEY } from "../hooks/useUserWallet";
import useUserBySeat from "../hooks/useUserBySeat";
import { twoPlayerGameMock } from "../context/PlayerContext";

const PokerActionPanel: React.FC = () => {
    const { setPlayerAction, playerIndex, pots, seat, totalPot } = usePlayerContext();
    const [error, setError] = useState<Error | null>(null);
    const [publicKey, setPublicKey] = useState<string>();
    const [raiseAmount, setRaiseAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isBetAction, setIsBetAction] = useState(false);
    const [isCallAction, setIsCallAction] = useState(false);
    const [isCheckAction, setIsCheckAction] = useState(false);
    const [isRaiseAction, setIsRaiseAction] = useState(false);
    const [balance, setBalance] = useState(0);
    const { data } = useUserBySeat(publicKey || "", seat);
    const { nextToAct } = twoPlayerGameMock;

    useEffect(() => {
        if (data) {
            setBalance(data.stack);

            for (const item of data.actions) {
                if (item.action === PlayerActionType.BET) {
                    setIsBetAction(true);
                }
                if (item.action === PlayerActionType.CHECK) {
                    setIsCheckAction(true);
                }
                if (item.action === PlayerActionType.CALL) {
                    setIsCallAction(true);
                }
                if (item.action === PlayerActionType.RAISE) {
                    setIsRaiseAction(true);
                }
            }
        }
    }, [publicKey, seat]);

    useEffect(() => {
        const localKey = localStorage.getItem(STORAGE_PUBLIC_KEY);
        if (!localKey) return setPublicKey(undefined);

        setPublicKey(localKey);
    }, []);

    const handleRaiseChange = (newAmount: number) => {
        setRaiseAmount(newAmount);
    };

    const onFold = () => {
        setPlayerAction(PlayerActionType.FOLD);
    };

    const onCheck = () => {
        setPlayerAction(PlayerActionType.CHECK);
    };

    const onCall = () => {
        setPlayerAction(PlayerActionType.CALL);
    };

    const onRaise = () => {
        setPlayerAction(PlayerActionType.RAISE, raiseAmount);
    };

    const onBet = () => {
        setPlayerAction(PlayerActionType.BET);
    };

    return (
        <div className="flex justify-center rounded-lg h-full text-white z-[0]">
            {/* Action Buttons */}
            {/* <div className="left-0 absolute">
                <CheckboxList />
            </div> */}
            {/* <ChipPurchase /> */}
            <div className="flex flex-col w-[600px] space-y-6 mb-2 justify-center rounded-lg">
                <div className="flex justify-between gap-2">
                    <button
                        disabled={seat != nextToAct}
                        className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={onFold}
                    >
                        FOLD
                    </button>
                    {isCheckAction && (
                        <button
                            disabled={seat != nextToAct}
                            className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                            onClick={onCheck}
                        >
                            CHECK
                        </button>
                    )}
                    {isCallAction && (
                        <button
                            disabled={seat != nextToAct}
                            className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                            onClick={onCall}
                        >
                            CALL
                        </button>
                    )}
                    {isRaiseAction && (
                        <button
                            disabled={seat != nextToAct}
                            className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                            onClick={onRaise}
                        >
                            {raiseAmount === +balance ? "All-IN" : `RAISE ${raiseAmount}`}
                        </button>
                    )}
                    {isBetAction && (
                        <button
                            disabled={seat != nextToAct}
                            className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                            onClick={onBet}
                        >
                            BET
                        </button>
                    )}
                </div>

                {/* Slider and Controls */}
                <div className="flex items-center space-x-4">
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] py-1 px-4 rounded-lg  border-[1px] border-gray-400"
                        onClick={() => handleRaiseChange(Math.max(raiseAmount - 1, 0))}
                        disabled={seat != nextToAct}
                    >
                        -
                    </button>
                    <input
                        type="range"
                        min="0"
                        max={balance}
                        value={raiseAmount}
                        onChange={e => handleRaiseChange(Number(e.target.value))}
                        className="flex-1"
                        disabled={seat != nextToAct}
                    />
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] py-1 px-4 rounded-lg  border-[1px] border-gray-400"
                        onClick={() => handleRaiseChange(raiseAmount + 1)}
                        disabled={seat != nextToAct}
                    >
                        +
                    </button>
                </div>

                {/* Additional Options */}
                <div className="flex justify-between gap-2">
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-2 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={() => setRaiseAmount(totalPot / 4)}
                        disabled={seat != nextToAct}
                    >
                        1 / 4 Pot
                    </button>
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-2 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={() => setRaiseAmount(totalPot / 2)}
                        disabled={seat != nextToAct}
                    >
                        1 / 2 Pot
                    </button>
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-2 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={() => setRaiseAmount((totalPot / 4) * 3)}
                        disabled={seat != nextToAct}
                    >
                        3 / 4 Pot
                    </button>
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-2 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={() => setRaiseAmount(totalPot)}
                        disabled={seat != nextToAct}
                    >
                        Pot
                    </button>
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-2 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={() => setRaiseAmount(+balance)}
                        disabled={seat != nextToAct}
                    >
                        ALL-IN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PokerActionPanel;
