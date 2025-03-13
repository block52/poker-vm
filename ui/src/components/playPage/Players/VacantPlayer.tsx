import * as React from "react";
import { memo, useEffect, useState } from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { usePlayerContext } from "../../../context/usePlayerContext";
import { PROXY_URL } from "../../../config/constants";
import axios from "axios";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { useTableContext } from "../../../context/TableContext";
import { NodeRpcClient } from "@bitcoinbrisbane/block52";
import { getSignature, getPublicKey } from '../../../utils/accountUtils';

type VacantPlayerProps = {
    left?: string; // Front side image source
    top?: string; // Back side image source
    index: number;
};

const VacantPlayer: React.FC<VacantPlayerProps> = memo(({ left, top, index }) => {
    const { tableData, setTableData, nonce, refreshNonce, userPublicKey } = useTableContext();
    const [localTableData, setLocalTableData] = useState(tableData);
    const { id: tableId } = useParams();
    const userAddress = localStorage.getItem("user_eth_public_key");
    const privateKey = localStorage.getItem("user_eth_private_key");
    const wallet = new ethers.Wallet(privateKey!);

     // Debug logs for initial state
     console.log(`VacantPlayer ${index} initial state:`, {
        userAddress,
        hasTableData: !!tableData,
        hasLocalTableData: !!localTableData,
        tableId
    });

    // Update local table data with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setLocalTableData(tableData);
            console.log(`VacantPlayer ${index} updated localTableData:`, {
                hasData: !!tableData,
                players: tableData?.data?.players?.map((p: any) => ({
                    address: p.address,
                    seat: p.seat
                }))
            });
        }, 1000); // 1 second debounce

        return () => clearTimeout(timer);
    }, [tableData, index]);

    // First, check if user is already playing
    // First, check if user is already playing
    const isUserAlreadyPlaying = React.useMemo(() => {
        if (!userAddress) {
            console.log(`VacantPlayer ${index} - No user address found`);
            return false;
        }
        
        if (!localTableData?.data?.players) {
            console.log(`VacantPlayer ${index} - No players data found`);
            return false;
        }
        
        // Log each player for comparison
        localTableData.data.players.forEach((player: any, idx: number) => {
            console.log(`Player ${idx} comparison:`, {
                playerAddress: player.address,
                userAddress: userAddress,
                isMatch: player.address?.toLowerCase() === userAddress?.toLowerCase(),
                playerSeat: player.seat
            });
        });
        
        const result = localTableData.data.players.some((player: any) => 
            player.address?.toLowerCase() === userAddress?.toLowerCase()
        );
        
        console.log(`VacantPlayer ${index} - isUserAlreadyPlaying:`, result);
        return result;
    }, [localTableData?.data?.players, userAddress, index]);

    // Calculate next available seat
    const nextAvailableSeat = React.useMemo(() => {
        if (isUserAlreadyPlaying) {
            console.log(`VacantPlayer ${index} - User already playing, no available seat`);
            return -1;
        }
        
        // Get occupied seats
        const occupiedSeats = new Set();
        if (localTableData?.data?.players) {
            localTableData.data.players.forEach((player: any) => {
                if (player.address && player.address !== "0x0000000000000000000000000000000000000000") {
                    occupiedSeats.add(player.seat);
                }
            });
        }
        
        console.log(`VacantPlayer ${index} - Occupied seats:`, Array.from(occupiedSeats));
        
        // Find the first available seat (0-8)
        for (let i = 0; i < 9; i++) {
            if (!occupiedSeats.has(i)) {
                console.log(`VacantPlayer ${index} - First available seat:`, i);
                return i;
            }
        }
        
        console.log(`VacantPlayer ${index} - No available seats found`);
        return -1;
    }, [isUserAlreadyPlaying, localTableData?.data?.players, index]);

    // Check if this seat is vacant (not occupied by any player)
    const isSeatVacant = React.useMemo(() => {
        if (!localTableData?.data?.players) {
            return true; // If no player data, assume seat is vacant
        }
        
        // Check if any player occupies this seat
        const isOccupied = localTableData.data.players.some((player: any) => 
            player.seat === index && 
            player.address && 
            player.address !== "0x0000000000000000000000000000000000000000"
        );
        
        console.log(`VacantPlayer ${index} - isSeatVacant:`, !isOccupied);
        return !isOccupied;
    }, [localTableData?.data?.players, index]);

    // Check if this seat is available to join
    // Allow joining at any vacant seat
    const canJoinThisSeat = React.useMemo(() => {
        // User can join if:
        // 1. The seat is vacant
        // 2. The user is not already playing
        const result = isSeatVacant && !isUserAlreadyPlaying;
        
        console.log(`VacantPlayer ${index} - canJoinThisSeat:`, {
            isSeatVacant,
            isUserAlreadyPlaying,
            result
        });
        
        return result;
    }, [isSeatVacant, isUserAlreadyPlaying]);

    const isNextAvailableSeat = index === nextAvailableSeat;
    console.log(`VacantPlayer ${index} - isNextAvailableSeat:`, isNextAvailableSeat, {
        index,
        nextAvailableSeat
    });

    // Check if this is the first player
    const isFirstPlayer =
        !localTableData?.data?.players?.length || localTableData.data.players.every((player: any) => player.address === "0x0000000000000000000000000000000000000000");

    // Get blind values from table data
    const smallBlindWei = localTableData?.data?.smallBlind || "0";
    const bigBlindWei = localTableData?.data?.bigBlind || "0";
    const smallBlindDisplay = ethers.formatUnits(smallBlindWei, 18);
    const bigBlindDisplay = ethers.formatUnits(bigBlindWei, 18);

    // Get dealer position from table data
    const dealerPosition = localTableData?.data?.dealer || 0;
    console.log(`VacantPlayer ${index} - Dealer position:`, dealerPosition);

    // Calculate small blind and big blind positions
    const smallBlindPosition = (dealerPosition + 1) % 9; // Assuming 9 max seats
    const bigBlindPosition = (dealerPosition + 2) % 9;
    console.log(`VacantPlayer ${index} - Blind positions:`, {
        dealer: dealerPosition,
        smallBlind: smallBlindPosition,
        bigBlind: bigBlindPosition
    });

    // Helper function to get position name
    const getPositionName = (index: number) => {
        // Use the actual positions from table data instead of calculating
        const smallBlindPosition = localTableData?.data?.smallBlindPosition;
        const bigBlindPosition = localTableData?.data?.bigBlindPosition;
        const dealerPosition = localTableData?.data?.dealer;
        
        if (index === dealerPosition) return "Dealer (D)";
        if (index === smallBlindPosition) return "Small Blind (SB)";
        if (index === bigBlindPosition) return "Big Blind (BB)";
        return "";
    };

    const handleJoinClick = React.useCallback(async () => {
        console.log("\n=== JOIN CLICK DETECTED ===");
        console.log("Can join?", canJoinThisSeat);
        console.log("isSeatVacant:", isSeatVacant);
        console.log("isUserAlreadyPlaying:", isUserAlreadyPlaying);
        console.log("Seat Index:", index);
        console.log("Table ID:", tableId);
        
        if (!canJoinThisSeat) {
            console.log("Cannot join: either seat is taken or user is already playing");
            return;
        }
        
        console.log("\n=== JOIN ATTEMPT ===");
        console.log("Seat Index:", index);
        console.log("Table ID:", tableId);
        
        const isFirstPlayer = !localTableData?.data?.players?.length || 
            localTableData.data.players.every((player: any) => 
                player.address === "0x0000000000000000000000000000000000000000"
            );

        const buyInWei = isFirstPlayer ? localTableData?.data?.smallBlind : localTableData?.data?.bigBlind;
        
        if (!buyInWei) {
            console.error("No valid buy-in amount");
            return;
        }

        handleJoinTable(buyInWei);
    }, [canJoinThisSeat, isUserAlreadyPlaying, tableId, localTableData, index]);

    const handleJoinTable = async (buyInWei: string) => {
        if (!userAddress || !privateKey) {
            console.error("Missing user address or private key");
            return;
        }

        try {
            await refreshNonce(userAddress);
            const currentNonce = nonce?.toString() || "0";

            // Get user balance
            const userBalance = localStorage.getItem("user_balance") || "0";
            console.log("User balance:", userBalance);
            
            // Convert buyInWei to proper format
            const minBuyIn = localTableData?.data?.minBuyIn || "4000000000000000000"; // Default to 4 USDC (20x big blind)
            console.log("=== MIN BUY IN ===");
            console.log(minBuyIn);
            
            // Use a buy-in amount that's within the user's balance
            // If minBuyIn is specified, use that, otherwise use 40% of user's balance or 20x big blind
            let buyInAmount;
            const bigBlindValue = localTableData?.data?.bigBlind || "200000000000000000"; // 0.2 USDC
            const twentyBigBlinds = (BigInt(bigBlindValue) * BigInt(20)).toString();
            
            if (BigInt(userBalance) < BigInt(minBuyIn)) {
                // If user doesn't have enough for min buy-in, use 80% of their balance
                buyInAmount = (BigInt(userBalance) * BigInt(80) / BigInt(100)).toString();
                console.log(`User balance too low for min buy-in. Using 80% of balance: ${buyInAmount}`);
            } else {
                // Use min buy-in or 20x big blind, whichever is higher
                buyInAmount = BigInt(minBuyIn) > BigInt(twentyBigBlinds) 
                    ? minBuyIn 
                    : twentyBigBlinds;
                
                // Make sure buy-in doesn't exceed user balance
                if (BigInt(buyInAmount) > BigInt(userBalance)) {
                    buyInAmount = (BigInt(userBalance) * BigInt(80) / BigInt(100)).toString();
                    console.log(`Adjusted buy-in to 80% of balance: ${buyInAmount}`);
                }
            }
            
            console.log("Final buy-in amount:", buyInAmount);

            const signature = await getSignature(
                privateKey,
                currentNonce,
                userAddress,
                tableId,
                buyInAmount,
                "join"
            );

            const requestData = {
                id: "1",
                method: "transfer",
                userAddress,
                tableId,
                buyInAmount,
                signature,
                publicKey: userPublicKey
            };

            console.log("Sending join request:", requestData);
            const response = await axios.post(`${PROXY_URL}/table/${tableId}/join`, requestData);
            console.log("Join response:", response.data);

            if (response.data?.result?.data) {
                setTableData(response.data.result.data);
            }
        } catch (error) {
            console.error("Error joining table:", error);
        }
    };

    // Only log position once during mount
    useEffect(() => {
        console.log("VacantPlayer mounted at position:", { left, top, index });
    }, []);

    return (
        <div
            onClick={() => {
                console.log("VacantPlayer clicked at index:", index);
                console.log("canJoinThisSeat:", canJoinThisSeat);
                console.log("isUserAlreadyPlaying:", isUserAlreadyPlaying);
                handleJoinClick();
            }}
            className={`absolute flex flex-col justify-center text-gray-600 w-[175px] h-[170px] mt-[40px] transform -translate-x-1/2 -translate-y-1/2 ${
                canJoinThisSeat ? "hover:cursor-pointer" : "cursor-default"
            }`}
            style={{ left, top }}
        >
            <div className={`flex justify-center gap-4 mb-2 ${canJoinThisSeat ? "hover:cursor-pointer" : "cursor-default"}`}>
                <FaRegUserCircle color="#f0f0f0" className="w-10 h-10" />
            </div>
            <div className="text-white text-center">
                {/* Add seat number for clarity */}
                <div className="text-xs mb-1">Seat {index}</div>
                
                {isUserAlreadyPlaying
                    ? "Already playing"
                    : canJoinThisSeat
                      ? index === localTableData?.data?.bigBlindPosition
                          ? `Click to Join ($${bigBlindDisplay})`
                          : index === localTableData?.data?.smallBlindPosition
                            ? `Click to Join ($${smallBlindDisplay})`
                            : `Click to Join`
                      : "Seat Taken"}
            </div>
            {/* Position indicator */}
            {getPositionName(index) && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="px-2 py-1 bg-gray-800/80 rounded-md text-xs text-white">{getPositionName(index)}</div>
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for memo
    return prevProps.left === nextProps.left && 
           prevProps.top === nextProps.top && 
           prevProps.index === nextProps.index;
});

VacantPlayer.displayName = "VacantPlayer";

export default VacantPlayer;
