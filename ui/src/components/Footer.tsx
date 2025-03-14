import { useEffect, useState } from "react";
import * as React from "react";
import { useTableContext } from "../context/TableContext";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { STORAGE_PUBLIC_KEY } from "../hooks/useUserWallet";
import useUserBySeat from "../hooks/useUserBySeat";
import axios from "axios";
import { getUserTableStatus } from "../utils/accountUtils";
import { isPlayerTurnToPostBlind } from "../utils/tableUtils";
import { ethers } from "ethers";

// Define a type for the user status
type UserTableStatus = {
    isInTable: boolean;
    isPlayerTurn: boolean;
    seat: any;
    stack: any;
    status: any;
    availableActions: any;
    canPostSmallBlind: any;
    canPostBigBlind: any;
    canCheck: any;
    canCall: any;
    canBet: any;
    canRaise: any;
    canFold: any;
    betLimits: any;
    raiseLimits: any;
    callAmount: any;
    smallBlindAmount: any;
    bigBlindAmount: any;
} | null;

const PokerActionPanel: React.FC = () => {
    const { tableData, playerLegalActions, isPlayerTurn } = useTableContext();
    const [publicKey, setPublicKey] = useState<string>();
    const [raiseAmount, setRaiseAmount] = useState(0);
    const [isBetAction, setIsBetAction] = useState(false);
    const [isCallAction, setIsCallAction] = useState(false);
    const [isCheckAction, setIsCheckAction] = useState(false);
    const [isRaiseAction, setIsRaiseAction] = useState(false);
    const [balance, setBalance] = useState(0);

    // Get user's seat from localStorage or tableData
    const userAddress = localStorage.getItem("user_eth_public_key")
    const userPlayer = tableData?.players?.find((player: any) => player.address?.toLowerCase() === userAddress);
    const userSeat = userPlayer?.seat;

    const { data } = useUserBySeat(publicKey || "", userSeat);
    const [userStatus, setUserStatus] = useState<UserTableStatus>(null);

    // Get current player's possible actions
    const nextToAct = tableData?.nextToAct;
    const currentPlayer = tableData?.players?.find((p: any) => p.seat === nextToAct);
    const currentPlayerActions = currentPlayer?.legalActions || [];

    // Check if each action is available
    const canFold = currentPlayerActions.some((a: any) => a.action === PlayerActionType.FOLD);
    const canCall = currentPlayerActions.some((a: any) => a.action === PlayerActionType.CALL);
    const canRaise = currentPlayerActions.some((a: any) => a.action === PlayerActionType.RAISE);
    const canCheck = currentPlayerActions.some((a: any) => a.action === PlayerActionType.CHECK);
    const canBet = currentPlayerActions.some((a: any) => a.action === PlayerActionType.BET);

    // Get min/max for raise if available
    const raiseAction = currentPlayerActions.find((a: any) => a.action === PlayerActionType.RAISE);
    const minRaise = raiseAction?.min;
    const maxRaise = raiseAction?.max;

    // Update the find action for call amount
    const callAmount = currentPlayerActions.find((a: any) => a.action === PlayerActionType.CALL)?.min;

    useEffect(() => {
        if (tableData) {
            console.log("Table Data:asdfasd", tableData);
            const status = getUserTableStatus(tableData);
            console.log("User Status:", status);
            setUserStatus(status);

            // Check if it's the current user's turn directly from tableData
            const nextToActPlayer = tableData.players?.find((player: any) => player.seat === tableData.nextToAct);

            if (nextToActPlayer && nextToActPlayer.address?.toLowerCase() === userAddress) {
                console.log("It's your turn to act!");

                // Check if this is a small blind posting situation
                const isSmallBlindPosition = tableData.smallBlindPosition === nextToActPlayer.seat;
                console.log("Is small blind position:", isSmallBlindPosition);

                // Set minimal user status if needed
                if (!status) {
                    setUserStatus({
                        isInTable: true,
                        isPlayerTurn: true,
                        seat: nextToActPlayer.seat,
                        availableActions: nextToActPlayer.legalActions || [],
                        // Add other necessary properties with default values
                        stack: nextToActPlayer.stack || "0",
                        status: "active",
                        canPostSmallBlind: isSmallBlindPosition,
                        canPostBigBlind: tableData.bigBlindPosition === nextToActPlayer.seat,
                        canCheck: nextToActPlayer.legalActions?.some((a: any) => a.action === PlayerActionType.CHECK),
                        canCall: nextToActPlayer.legalActions?.some((a: any) => a.action === PlayerActionType.CALL),
                        canBet: nextToActPlayer.legalActions?.some((a: any) => a.action === PlayerActionType.BET),
                        canRaise: nextToActPlayer.legalActions?.some((a: any) => a.action === PlayerActionType.RAISE),
                        canFold: nextToActPlayer.legalActions?.some((a: any) => a.action === PlayerActionType.FOLD),
                        betLimits: null,
                        raiseLimits: null,
                        callAmount: "0",
                        smallBlindAmount: tableData.smallBlind || "0",
                        bigBlindAmount: tableData.bigBlind || "0"
                    });
                }
            }
        }
    }, [tableData]);

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
    }, [publicKey, userSeat]);

    useEffect(() => {
        const localKey = localStorage.getItem("user_eth_public_key");
        if (!localKey) return setPublicKey(undefined);

        setPublicKey(localKey);
    }, [publicKey]);

    // Log the player's legal actions
    useEffect(() => {
        console.log("Footer - Player's legal actions:", {
            actions: playerLegalActions,
            isPlayerTurn,
            nextToAct: tableData?.nextToAct,
            userSeat
        });
    }, [playerLegalActions, isPlayerTurn, tableData, userSeat]);

    const handleRaiseChange = (newAmount: number) => {
        setRaiseAmount(newAmount);
    };

    // Player action function to handle all game actions
    const setPlayerAction = async (action: PlayerActionType, amount: string) => {
        console.log("Setting player action:", action, amount);
        if (!userAddress || !tableData?.data?.address) {
            console.error("Missing user address or table ID");
            return;
        }

        try {
            console.log(`Executing player action: ${action} with amount: ${amount}`);

            // Get the private key from localStorage
            const privateKey = localStorage.getItem("user_eth_private_key");
            if (!privateKey) {
                console.error("Private key not found");
                return;
            }

            // Create a wallet instance to sign the message
            const wallet = new ethers.Wallet(privateKey);

            // Create the message to sign (format: action + amount + tableId + timestamp)
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const tableId = tableData.data.address;
            const message = `${action}${amount}${tableId}${timestamp}`;

            // Sign the message
            const signature = await wallet.signMessage(message);

            console.log("Message signed:", message);
            console.log("Signature:", signature);

            // Send the action to the backend
            const proxyUrl = import.meta.env.VITE_PROXY_URL || "http://localhost:8080";
            const response = await axios.post(`${proxyUrl}/table/${tableId}/playeraction`, {
                userAddress,
                action,
                amount,
                signature,
                timestamp
            });

            console.log("Player action response:", response.data);

            // Reset UI states after action
            setIsBetAction(false);
            setIsCallAction(false);
            setIsCheckAction(false);
            setIsRaiseAction(false);
        } catch (error) {
            console.error("Error executing player action:", error);
        }
    };

    // Handler functions for different actions
    const handlePostSmallBlind = () => {
        console.log("Posting small blind");
        if (userStatus?.smallBlindAmount) {
            setPlayerAction(PlayerActionType.SMALL_BLIND, userStatus.smallBlindAmount);
        }
    };

    const handlePostBigBlind = () => {
        console.log("Posting big blind");
        if (userStatus?.bigBlindAmount) {
            setPlayerAction(PlayerActionType.BIG_BLIND, userStatus.bigBlindAmount);
        }
    };

    const handleCheck = () => {
        console.log("Checking");
        setPlayerAction(PlayerActionType.CHECK, "0");
    };

    const handleCall = () => {
        console.log("Calling");
        if (callAmount) {
            setPlayerAction(PlayerActionType.CALL, callAmount);
        }
    };

    const handleFold = () => {
        console.log("Folding");
        setPlayerAction(PlayerActionType.FOLD, "0");
    };

    const handleBet = () => {
        console.log("Betting");
        setIsBetAction(true);
    };

    const handleRaise = () => {
        console.log("Raising");
        setIsRaiseAction(true);
    };

    const submitBet = () => {
        if (raiseAmount > 0) {
            setPlayerAction(PlayerActionType.BET, raiseAmount.toString());
            setIsBetAction(false);
        }
    };

    const submitRaise = () => {
        if (raiseAmount > 0) {
            setPlayerAction(PlayerActionType.RAISE, raiseAmount.toString());
            setIsRaiseAction(false);
        }
    };

    // Make sure we're passing the actual table data object, not the wrapper
    const actualTableData = tableData?.data;
    
    // Use our helper functions to determine if blind buttons should be shown
    const shouldShowSmallBlindButton = isPlayerTurnToPostBlind(actualTableData, userAddress || "", 'small');
    const shouldShowBigBlindButton = isPlayerTurnToPostBlind(actualTableData, userAddress || "", 'big');
    
    // Add debug logging to see what's happening
    console.log("Blind button visibility:", {
        userAddress,
        shouldShowSmallBlindButton,
        shouldShowBigBlindButton,
        tableData: actualTableData
    });

    if (!data) {
        return <></>;
    }

    return (
        <div className="flex justify-center rounded-lg h-full text-white z-[0]">
            {/* Action Buttons */}

            {/* <div className="left-0 absolute">
                <CheckboxList />
            </div> */}
            {/* <ChipPurchase /> */}
            <div className="flex flex-col w-[600px] space-y-6 mb-2 justify-center rounded-lg">
                {/* Player Action Buttons Container - Centered in the middle */}
                <div className="flex justify-center items-center mb-2">
                    {shouldShowSmallBlindButton && (
                        <button
                            onClick={handlePostSmallBlind}
                            className="bg-[#2c7873] hover:bg-[#1e5954] text-white font-medium py-2 px-4 rounded-lg shadow-md transition-colors duration-200 border border-[#3a9188] flex items-center"
                        >
                            <span className="mr-1">Post Small Blind</span>
                            <span className="bg-[#1a4542] px-2 py-1 rounded text-green-300 text-sm">
                                ${Number(ethers.formatUnits(userStatus?.smallBlindAmount || "0", 18)).toFixed(2)}
                            </span>
                        </button>
                    )}

                    {shouldShowBigBlindButton && (
                        <button
                            onClick={handlePostBigBlind}
                            className="bg-[#2c7873] hover:bg-[#1e5954] text-white font-medium py-2 px-4 rounded-lg shadow-md transition-colors duration-200 border border-[#3a9188] ml-3 flex items-center"
                        >
                            <span className="mr-1">Post Big Blind</span>
                            <span className="bg-[#1a4542] px-2 py-1 rounded text-green-300 text-sm">
                                ${Number(ethers.formatUnits(userStatus?.bigBlindAmount || "0", 18)).toFixed(2)}
                            </span>
                        </button>
                    )}
                </div>

                <div className="flex justify-between gap-2">
                    {canFold && (
                        <button
                            disabled={userSeat != nextToAct}
                            className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                            onClick={handleFold}
                        >
                            FOLD
                        </button>
                    )}
                    {canCheck && (
                        <button
                            disabled={userSeat != nextToAct}
                            className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                            onClick={handleCheck}
                        >
                            CHECK
                        </button>
                    )}
                    {canCall && (
                        <button
                            disabled={userSeat != nextToAct}
                            className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                            onClick={handleCall}
                        >
                            CALL {callAmount}
                        </button>
                    )}
                    {canRaise && (
                        <button
                            disabled={userSeat != nextToAct}
                            className="cursor-pointer bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-4 py-2 rounded-lg w-full border-[1px] border-gray-400"
                            onClick={handleRaise}
                        >
                            RAISE {raiseAmount}
                        </button>
                    )}
                    {canBet && (
                        <button
                            disabled={userSeat != nextToAct}
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
                        disabled={userSeat != nextToAct}
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
                        disabled={userSeat != nextToAct}
                    />
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] py-1 px-4 rounded-lg  border-[1px] border-gray-400"
                        onClick={() => handleRaiseChange(raiseAmount + 1)}
                        disabled={userSeat != nextToAct}
                    >
                        +
                    </button>
                </div>

                {/* Additional Options */}
                <div className="flex justify-between gap-2">
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-2 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={() => setRaiseAmount(tableData.totalPot / 4)}
                        disabled={userSeat != nextToAct}
                    >
                        1 / 4 Pot
                    </button>
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-2 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={() => setRaiseAmount(tableData.totalPot / 2)}
                        disabled={userSeat != nextToAct}
                    >
                        1 / 2 Pot
                    </button>
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-2 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={() => setRaiseAmount((tableData.totalPot / 4) * 3)}
                        disabled={userSeat != nextToAct}
                    >
                        3 / 4 Pot
                    </button>
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-2 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={() => setRaiseAmount(tableData.totalPot)}
                        disabled={userSeat != nextToAct}
                    >
                        Pot
                    </button>
                    <button
                        className="bg-[#0c0c0c80] hover:bg-[#0c0c0c] px-2 py-2 rounded-lg w-full border-[1px] border-gray-400"
                        onClick={() => setRaiseAmount(+balance)}
                        disabled={userSeat != nextToAct}
                    >
                        ALL-IN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PokerActionPanel;
