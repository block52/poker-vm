import { useEffect, useState } from "react";
import * as React from "react";
import { usePlayerContext } from "../context/usePlayerContext";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { STORAGE_PUBLIC_KEY } from "../hooks/useUserWallet";
import useUserBySeat from "../hooks/useUserBySeat";
import axios from "axios";

const PokerActionPanel: React.FC = () => {
    const { setPlayerAction, seat, totalPot, nextToAct, gamePlayers } = usePlayerContext();
    const [publicKey, setPublicKey] = useState<string>();
    const [raiseAmount, setRaiseAmount] = useState(0);
    const [isBetAction, setIsBetAction] = useState(false);
    const [isCallAction, setIsCallAction] = useState(false);
    const [isCheckAction, setIsCheckAction] = useState(false);
    const [isRaiseAction, setIsRaiseAction] = useState(false);
    const [balance, setBalance] = useState(0);
    const { data } = useUserBySeat(publicKey || "", seat);

    // Get current player's possible actions
    const currentPlayerActions = gamePlayers?.find(p => p.seat === nextToAct)?.actions || [];

    // Check if each action is available
    const canFold = currentPlayerActions.some(a => a.action === PlayerActionType.FOLD);
    const canCall = currentPlayerActions.some(a => a.action === PlayerActionType.CALL);
    const canRaise = currentPlayerActions.some(a => a.action === PlayerActionType.RAISE);
    const canCheck = currentPlayerActions.some(a => a.action === PlayerActionType.CHECK);
    const canBet = currentPlayerActions.some(a => a.action === PlayerActionType.BET);

    // Get min/max for raise if available
    const raiseAction = currentPlayerActions.find(a => a.action === PlayerActionType.RAISE);
    const minRaise = raiseAction?.min;
    const maxRaise = raiseAction?.max;

    // Update the find action for call amount
    const callAmount = currentPlayerActions.find(a => a.action === PlayerActionType.CALL)?.min;

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
    }, [publicKey]);

    const handleRaiseChange = (newAmount: number) => {
        setRaiseAmount(newAmount);  
    };

    // Action handlers with TODOs for API integration
    const handleFold = () => {
        console.log("Player folded");
        // TODO: Call API endpoint /table/:id/action with:
        // {
        //    action: PlayerActionType.FOLD,
        //    seat: seat,
        //    amount: null
        // }
        setPlayerAction(PlayerActionType.FOLD);
    };

    const handleCall = () => {
        console.log("Player called", callAmount);
        // TODO: Call API endpoint /table/:id/action with:
        // {
        //    action: PlayerActionType.CALL,
        //    seat: seat,
        //    amount: callAmount
        // }
        setPlayerAction(PlayerActionType.CALL);
    };

    const handleRaise = () => {
        console.log("Player raised to", raiseAmount);
        // TODO: Call API endpoint /table/:id/action with:
        // {
        //    action: PlayerActionType.RAISE,
        //    seat: seat,
        //    amount: raiseAmount
        // }
        setPlayerAction(PlayerActionType.RAISE, raiseAmount);
    };

    const handleCheck = () => {
        console.log("Player checked");
        // TODO: Call API endpoint /table/:id/action with:
        // {
        //    action: PlayerActionType.CHECK,
        //    seat: seat,
        //    amount: null
        // }
        setPlayerAction(PlayerActionType.CHECK);
    };

    const handleBet = () => {
        console.log("Player bet");
        // TODO: Call API endpoint /table/:id/action with:
        // {
        //    action: PlayerActionType.BET,
        //    seat: seat,
        //    amount: raiseAmount
        // }
        setPlayerAction(PlayerActionType.BET);
    };

    if(!data) {
        return <></>
    }

    return (
        <div className="flex justify-center rounded-lg h-full text-white z-[0]">
            {/* Action Buttons */}
            {/* <div className="left-0 absolute">
                <CheckboxList />
            </div> */}
            {/* <ChipPurchase /> */}
            <div className="flex flex-col w-[600px] space-y-6 mb-2 justify-center rounded-lg">
                <div className="flex justify-between gap-2">
                    {canFold && (
                        <button
                            disabled={seat != nextToAct}
                            className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                            onClick={handleFold}
                        >
                            FOLD
                        </button>
                    )}
                    {canCheck && (
                        <button
                            disabled={seat != nextToAct}
                            className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                            onClick={handleCheck}
                        >
                            CHECK
                        </button>
                    )}
                    {canCall && (
                        <button
                            disabled={seat != nextToAct}
                            className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                            onClick={handleCall}
                        >
                            CALL {callAmount}
                        </button>
                    )}
                    {canRaise && (
                        <button
                            disabled={seat != nextToAct}
                            className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                            onClick={handleRaise}
                        >
                            RAISE {raiseAmount}
                        </button>
                    )}
                    {canBet && (
                        <button
                            disabled={seat != nextToAct}
                            className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                            onClick={handleBet}
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
