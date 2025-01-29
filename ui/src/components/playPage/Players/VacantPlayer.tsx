import * as React from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayerContext } from '../../../context/usePlayerContext';
import { PROXY_URL } from '../../../config/constants';
import axios from 'axios';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { ethers } from 'ethers';
import { useTableContext } from '../../../context/TableContext';

type VacantPlayerProps = {
    left?: string; // Front side image source
    top?: string; // Back side image source
    index: number;
};

const VacantPlayer: React.FC<VacantPlayerProps> = ({ left, top, index }) => {
    const { id: tableId } = useParams();
    const { tableData, setTableData } = useTableContext();
    const [showBuyInForm, setShowBuyInForm] = useState(false);
    const [buyInAmount, setBuyInAmount] = useState('');
    const userAddress = localStorage.getItem('user_eth_public_key');

    // First, check if user is already playing
    const isUserAlreadyPlaying = tableData?.data?.players?.some(
        (player: any) => player.address === userAddress
    );

    // Then use getNextAvailableSeat
    const getNextAvailableSeat = () => {
        if (isUserAlreadyPlaying) return -1;
        const players = tableData?.data?.players || [];
        return players.findIndex((player: any) => 
            player.address === "0x0000000000000000000000000000000000000000"
        );
    };

    const nextAvailableSeat = getNextAvailableSeat();
    const isNextAvailableSeat = index === nextAvailableSeat;
    
    // Check if this is the first player
    const isFirstPlayer = tableData?.data?.players?.every(
        (player: any) => player.address === "0x0000000000000000000000000000000000000000"
    );

    // Get big blind value from table data
    const bigBlindWei = tableData?.data?.bigBlind || '0';
    const bigBlindDisplay = ethers.formatUnits(bigBlindWei, 18);

    console.log('Debug info:', {
        isUserAlreadyPlaying,
        nextAvailableSeat,
        isNextAvailableSeat,
        isFirstPlayer,
        index,
        players: tableData?.data?.players
    });

    const handleJoinClick = () => {
        if (isFirstPlayer) {
            setShowBuyInForm(true);
        } else {
            handleJoinTable(bigBlindWei);
        }
    };

    const handleBuyInSubmit = () => {
        if (!buyInAmount) return;
        // Convert USDC amount to Wei
        const buyInWei = ethers.parseUnits(buyInAmount, 18).toString();
        handleJoinTable(buyInWei);
        setShowBuyInForm(false);
    };

    const handleJoinTable = async (buyInWei: string) => {
        if (!userAddress) return;

        try {
            const requestData = {
                address: userAddress,
                tableId,
                buyInAmount: buyInWei,
                seat: index
            };
            
            console.log('Current table state:', tableData);
            console.log('Sending join request:', requestData);

            const response = await axios.post(`${PROXY_URL}/table/${tableId}/join`, requestData);
            console.log('Join response:', response.data);

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
                
                console.log('Updating table with:', updatedTableData);
                setTableData(updatedTableData);
            }
        } catch (error) {
            console.error('Error joining table:', error);
        }
    };

    return (
        <div
            onClick={() => isNextAvailableSeat && !isUserAlreadyPlaying && handleJoinClick()}
            className={`absolute flex flex-col justify-center text-gray-600 w-[175px] h-[170px] mt-[40px] transform -translate-x-1/2 -translate-y-1/2 ${
                isNextAvailableSeat && !isUserAlreadyPlaying ? 'hover:cursor-pointer' : 'cursor-default'
            }`}
            style={{ left, top }}
        >
            <div className={`flex justify-center gap-4 mb-2 ${
                isNextAvailableSeat && !isUserAlreadyPlaying ? 'hover:cursor-pointer' : 'cursor-default'
            }`}>
                <FaRegUserCircle color="#f0f0f0" className="w-10 h-10" />
            </div>
            {showBuyInForm ? (
                <div 
                    className="text-white text-center bg-gray-800/90 p-3 rounded-lg"
                    onClick={(e) => e.stopPropagation()} // Prevent parent click
                >
                    <input
                        type="number"
                        value={buyInAmount}
                        onChange={(e) => setBuyInAmount(e.target.value)}
                        placeholder="Enter USDC amount"
                        className="w-full mb-2 px-2 py-1 bg-gray-700 rounded text-white text-sm"
                        min="0"
                        step="0.01"
                    />
                    <button
                        onClick={handleBuyInSubmit}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                    >
                        Join Table
                    </button>
                </div>
            ) : (
                <div className="text-white text-center">
                    {isUserAlreadyPlaying 
                        ? "Already playing"
                        : isNextAvailableSeat 
                            ? isFirstPlayer 
                                ? <div>
                                    <div>Click to Join</div>
                                    <div className="text-sm text-gray-300">(Set Buy-in)</div>
                                  </div>
                                : `Click to Join ($${bigBlindDisplay})`
                            : "Click to Join"}
                </div>
            )}
        </div>
    );
};

export default VacantPlayer;
