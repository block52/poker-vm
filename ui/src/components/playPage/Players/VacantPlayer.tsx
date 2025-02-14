import * as React from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { usePlayerContext } from "../../../context/usePlayerContext";
import { PROXY_URL } from "../../../config/constants";
import axios from "axios";
import { useAccount } from "wagmi";
import { useState } from "react";
import { ethers } from "ethers";
import { useTableContext } from "../../../context/TableContext";

type VacantPlayerProps = {
    left?: string; // Front side image source
    top?: string; // Back side image source
    index: number;
};

const VacantPlayer: React.FC<VacantPlayerProps> = ({ left, top, index }) => {
    console.log("VacantPlayer", left, top, index);
    const { id: tableId } = useParams();
    const { tableData, setTableData, nonce, refreshNonce, userPublicKey } = useTableContext();
    const userAddress = localStorage.getItem("user_eth_public_key");
    const privateKey = localStorage.getItem("user_eth_private_key");
    const wallet = new ethers.Wallet(privateKey!);

    // First, check if user is already playing
    const isUserAlreadyPlaying = tableData?.data?.players?.some((player: any) => player.address === userAddress) || false;

    // Then use getNextAvailableSeat
    const getNextAvailableSeat = () => {
        if (isUserAlreadyPlaying) return -1;
        // If players array is empty, any seat is available
        if (!tableData?.data?.players || tableData.data.players.length === 0) {
            return index; // Allow clicking any seat
        }
        return tableData.data.players.findIndex((player: any) => player.address === "0x0000000000000000000000000000000000000000");
    };

    const nextAvailableSeat = getNextAvailableSeat();
    const isNextAvailableSeat = index === nextAvailableSeat;

    // Check if this is the first player
    const isFirstPlayer =
        !tableData?.data?.players?.length || tableData.data.players.every((player: any) => player.address === "0x0000000000000000000000000000000000000000");

    // Get blind values from table data
    const smallBlindWei = tableData?.data?.smallBlind || "0";
    const bigBlindWei = tableData?.data?.bigBlind || "0";
    const smallBlindDisplay = ethers.formatUnits(smallBlindWei, 18);
    const bigBlindDisplay = ethers.formatUnits(bigBlindWei, 18);

    // Get dealer position from table data
    const dealerPosition = tableData?.data?.dealer || 0;

    // Calculate small blind and big blind positions
    const smallBlindPosition = (dealerPosition + 1) % 9; // Assuming 9 max seats
    const bigBlindPosition = (dealerPosition + 2) % 9;

    // Helper function to get position name
    const getPositionName = (index: number) => {
        if (index === dealerPosition) return "Dealer (D)";
        if (index === smallBlindPosition) return "Small Blind (SB)";
        if (index === bigBlindPosition) return "Big Blind (BB)";
        return "";
    };

    const handleJoinClick = () => {
        console.log("checking we can see the publick key from the table context", userPublicKey);
        if (isFirstPlayer) {
            handleJoinTable(smallBlindWei);
        } else {
            handleJoinTable(bigBlindWei);
        }
    };

    const handleJoinTable = async (buyInWei: string) => {
        if (!userAddress || !privateKey) return;

        try {
            // Get fresh nonce before joining
            await refreshNonce(userAddress);

            // Create wallet from private key
            const wallet = new ethers.Wallet(privateKey);

            // Build message components with nonce
            const from = userAddress;
            const to = tableId || "0x0000000000000000000000000000000000000000";
            const amount = buyInWei;
            const action = "join";
            const currentNonce = nonce?.toString() || "0";

            // Create and sign message with nonce
            const message = `${from}${to}${amount}${action}${currentNonce}`;
            const signature = await wallet.signMessage(message);
            const publicKey = await wallet.getAddress();

            const requestData = {
                id: "1",
                version: "2.0",
                method: "transfer",
                params: [from, to, amount, action],
                signature,
                publicKey,
                nonce: currentNonce
            };

            console.log("Current table state:", tableData);
            console.log("Sending join request:", requestData);

            const response = await axios.post(`${PROXY_URL}/table/${tableId}/join`, requestData);
            console.log("Join response:", response.data);

            if (response.data && response.data.tableDataPlayers?.length > 0) {
                const updatedTableData = {
                    data: {
                        type: response.data.tableDataType || tableData.data.type,
                        address: response.data.tableDataAddress || tableData.data.address,
                        smallBlind: response.data.tableDataSmallBlind || tableData.data.smallBlind,
                        bigBlind: response.data.tableDataBigBlind || tableData.data.bigBlind,
                        dealer: response.data.tableDataDealer,
                        players: response.data.tableDataPlayers,
                        communityCards: response.data.tableDataCommunityCards,
                        pots: response.data.tableDataPots,
                        nextToAct: response.data.tableDataNextToAct,
                        round: response.data.tableDataRound || tableData.data.round,
                        winners: response.data.tableDataWinners,
                        signature: response.data.tableDataSignature
                    }
                };

                console.log("Updating table with:", updatedTableData);
                setTableData(updatedTableData);
            }
        } catch (error) {
            console.error("Error joining table:", error);
        }
    };

    return (
        <div
            onClick={() => isNextAvailableSeat && !isUserAlreadyPlaying && handleJoinClick()}
            className={`absolute flex flex-col justify-center text-gray-600 w-[175px] h-[170px] mt-[40px] transform -translate-x-1/2 -translate-y-1/2 ${
                isNextAvailableSeat && !isUserAlreadyPlaying ? "hover:cursor-pointer" : "cursor-default"
            }`}
            style={{ left, top }}
        >
            <div className={`flex justify-center gap-4 mb-2 ${isNextAvailableSeat && !isUserAlreadyPlaying ? "hover:cursor-pointer" : "cursor-default"}`}>
                <FaRegUserCircle color="#f0f0f0" className="w-10 h-10" />
            </div>
            <div className="text-white text-center">
                {isUserAlreadyPlaying
                    ? "Already playing"
                    : isNextAvailableSeat
                      ? isFirstPlayer
                          ? `Click to Join ($${smallBlindDisplay})`
                          : `Click to Join ($${bigBlindDisplay})`
                      : ""}
            </div>
            {/* Position indicator */}
            {getPositionName(index) && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="px-2 py-1 bg-gray-800/80 rounded-md text-xs text-white">{getPositionName(index)}</div>
                </div>
            )}
        </div>
    );
};

export default VacantPlayer;
