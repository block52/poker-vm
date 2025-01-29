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

    // Get big blind from table data
    const bigBlindWei = tableData?.data?.bigBlind || "30";
    const bigBlindDisplay = Number(ethers.formatUnits(bigBlindWei, 18));

    const userAddress = localStorage.getItem('user_eth_public_key');
    
    // Check if user is already at the table
    const isUserAlreadyPlaying = tableData?.data?.players?.some(
        (player: any) => player.address === userAddress
    );

    // Find the next available seat
    const getNextAvailableSeat = () => {
        if (isUserAlreadyPlaying) return -1;
        const players = tableData?.data?.players || [];
        return players.findIndex((player: any) => 
            player.address === "0x0000000000000000000000000000000000000000"
        );
    };

    const nextAvailableSeat = getNextAvailableSeat();
    const isNextAvailableSeat = index === nextAvailableSeat;

    const handleJoinTable = async () => {
        if (!isNextAvailableSeat || !userAddress) return;

        try {
            const requestData = {
                address: userAddress,
                tableId,
                buyInAmount: bigBlindWei,
                seat: index
            };
            
            console.log('Current table state:', tableData);
            console.log('Sending join request:', requestData);

            const response = await axios.post(`${PROXY_URL}/table/${tableId}/join`, requestData);
            console.log('Join response:', response.data);

            // Only update if we get valid data back
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
            } else {
                console.warn('Received empty or invalid data from server');
            }

        } catch (error) {
            console.error('Error joining table:', error);
        }
    };

    return (
        <div
            onClick={() => isNextAvailableSeat && !isUserAlreadyPlaying && handleJoinTable()}
            className={`absolute flex flex-col justify-center text-gray-600 w-[175px] h-[170px] mt-[40px] transform -translate-x-1/2 -translate-y-1/2 ${isNextAvailableSeat && !isUserAlreadyPlaying ? 'cursor-pointer' : 'cursor-default'}`}
            style={{ left, top }}
        >
            <div className="flex justify-center gap-4 mb-2">
                <FaRegUserCircle color="#f0f0f0" className="w-10 h-10" />
            </div>
            <div className="text-white text-center">
                {isUserAlreadyPlaying 
                    ? ""
                    : isNextAvailableSeat 
                        ? `Click to Join ($${bigBlindDisplay})`
                        : ""}
            </div>
        </div>
    );
};

export default VacantPlayer;
