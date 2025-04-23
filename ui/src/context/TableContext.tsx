import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { getPublicKey, isUserPlaying, getSignature } from "../utils/accountUtils";

import { getPlayersLegalActions, isPlayersTurn } from "../utils/playerUtils";
import { AllPlayerActions, NonPlayerActionType, PlayerActionType } from "@bitcoinbrisbane/block52";
import useUserWallet from "../hooks/useUserWallet"; // this is the browser wallet todo rename to useBrowserWallet
import { formatWeiToDollars } from "../utils/numberUtils";


// Enable this to see verbose logging
const DEBUG_MODE = false;

// Helper function that only logs when DEBUG_MODE is true
const debugLog = (...args: any[]) => {
    if (DEBUG_MODE) {
        // console.log(...args);
    }
};

interface TableContextType {
    tableData: any;
    isLoading: boolean;
    error: Error | null;
    setTableData: (data: any) => void;
    userPublicKey: string | null;
    isCurrentUserPlaying: boolean;
    playerLegalActions: any[] | null;
    isPlayerTurn: boolean;
    dealTable: () => Promise<void>;
    canDeal: boolean;
    openOneMore: boolean;
    openTwoMore: boolean;
    showThreeCards: boolean;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const TableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { id: tableId } = useParams<{ id: string }>();

    const [tableData, setTableData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [nonce, setNonce] = useState<number | null>(null);
    const [userPublicKey, setUserPublicKey] = useState<string | null>(null);
    const [isCurrentUserPlaying, setIsCurrentUserPlaying] = useState<boolean>(false);
    const [playerLegalActions, setPlayerLegalActions] = useState<any[] | null>(null);
    const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(false);

    const [openOneMore, setOpenOneMore] = useState<boolean>(false);
    const [openTwoMore, setOpenTwoMore] = useState<boolean>(false);
    const [showThreeCards, setShowThreeCards] = useState<boolean>(false);

    const [canDeal, setCanDeal] = useState<boolean>(false);

    const { b52 } = useUserWallet();

    // Helper to get user address from storage once
    const userWalletAddress = React.useMemo(() => {
        const address = localStorage.getItem("user_eth_public_key");
        return address ? address.toLowerCase() : null;
    }, []);

    // Update tableData effect
    useEffect(() => {
        if (tableData && tableData.data) {
            // Special case: if dealer position is 9, treat it as 0 for UI purposes
            if (tableData.data.dealer === 9) {
                tableData.data.dealer = 0;
            }
        }
    }, [tableData]);

    // Update polling logic to run regardless of WebSocket status
    useEffect(() => {
        if (!tableId) return;

        debugLog("Using polling for table data");

        let isFirstLoad = true;
        let lastUpdateTimestamp = 0;

        const fetchTableData = async () => {
            // Add debounce - only fetch if it's been at least 2 seconds since last update
            const now = Date.now();
            if (!isFirstLoad && now - lastUpdateTimestamp < 1000) {
                return;
            }

            debugLog("Polling: fetching data for table ID:", tableId);

            try {
                const baseUrl = window.location.hostname === "app.block52.xyz" ? "https://proxy.block52.xyz" : PROXY_URL;

                debugLog("Using baseUrl:", baseUrl);

                const response = await axios.get(`${baseUrl}/get_game_state/${tableId}`);
                console.log("🔄 Polling response:", response.data);

                if (!response.data) {
                    console.error("Polling received empty data");
                    return;
                }

                // Fix the data structure to match what the components expect
                debugLog("Response data structure:", JSON.stringify(response.data).substring(0, 100) + "...");

                // More explicit data validation and structure handling
                if (!response.data.data && !response.data.type) {
                    console.error("Unexpected API response structure", response.data);
                    return;
                }

                // Determine if the data is directly in response.data or in response.data.data
                const tableState = response.data.data || response.data;
                debugLog("Extracted table state structure:", {
                    hasType: !!tableState.type,
                    hasPlayers: !!tableState.players,
                    hasAddress: !!tableState.address
                });

                // Only update if critical data has changed
                setTableData((prevData: any) => {
                    if (!prevData || !prevData.data || isFirstLoad) {
                        isFirstLoad = false;
                        lastUpdateTimestamp = now;

                        // Ensure we always have a consistent structure with data property
                        const formattedData = response.data.data ? response.data : { data: response.data };
                        debugLog("Setting initial table data with structure:", Object.keys(formattedData));
                        setIsLoading(false); // Make sure to set loading to false here
                        return formattedData;
                    }

                    // Special case: normalize dealer position
                    // If dealer position is 9 in the response, treat it as 0 for consistency
                    if (tableState.dealer === 9) {
                        tableState.dealer = 0;
                    }

                    // Check if any critical game state has changed
                    const hasPlayerChanges = JSON.stringify(tableState.players) !== JSON.stringify(prevData.data.players);
                    const hasRoundChanged = tableState.round !== prevData.data.round;
                    const hasBoardChanged =
                        JSON.stringify(tableState.board || tableState.communityCards) !== JSON.stringify(prevData.data.board || prevData.data.communityCards);
                    const hasPotChanged = JSON.stringify(tableState.pots) !== JSON.stringify(prevData.data.pots);

                    const hasImportantChanges = hasPlayerChanges || hasRoundChanged || hasBoardChanged || hasPotChanged;

                    if (hasImportantChanges) {
                        debugLog("Polling detected changes, updating table data");
                        lastUpdateTimestamp = now;

                        // Ensure we always have a consistent structure with data property
                        const formattedData = response.data.data ? response.data : { data: response.data };
                        setIsLoading(false); // Make sure to set loading to false here
                        return formattedData;
                    }

                    debugLog("Polling detected no changes, keeping current state");
                    return prevData;
                });
            } catch (err) {
                console.error("Error fetching table data:", err);
                // Set error state so UI can show appropriate message
                setError(err instanceof Error ? err : new Error("Unknown error fetching table data"));
                setIsLoading(false);
            }
        };

        // Initial fetch
        fetchTableData();

        // Set up polling every 5 seconds
        const interval = setInterval(fetchTableData, 5000);

        // Cleanup
        return () => {
            clearInterval(interval);
        };
    }, [tableId]);

    // Update public key calculation
    useEffect(() => {
        const calculatePublicKey = () => {
            const privateKey = localStorage.getItem("user_eth_private_key");
            if (privateKey) {
                try {
                    const publicKey = getPublicKey(privateKey);
                    setUserPublicKey(publicKey);
                    debugLog("Calculated Public Key:", publicKey);
                } catch (error) {
                    console.error("Error calculating public key:", error);
                }
            }
        };

        calculatePublicKey();
    }, []);

    // Refresh nonce with debounce
    const refreshNonce = useCallback(
        async (address: string) => {
            try {
                const response = await axios.get(`${PROXY_URL}/nonce/${address}`);
                debugLog("Nonce Data:", response.data.result.data.nonce);

                if (response.data?.result?.data?.nonce !== undefined) {
                    console.log("🔄 Nonce updated:", {
                        previous: nonce,
                        new: response.data.result.data.nonce,
                        address,
                        timestamp: new Date().toISOString()
                    });
                    setNonce(response.data.result.data.nonce);
                    return response.data.result.data.nonce;
                }
                return null;
            } catch (error) {
                console.error("Error fetching nonce:", error);
                return null;
            }
        },
        [nonce]
    );

    // Optimize nonce refresh - less frequent polling
    useEffect(() => {
        const address = localStorage.getItem("user_eth_public_key");
        if (address) {
            console.log("✅ Initial nonce refresh for address:", address);
            refreshNonce(address);
            // Reduce frequency from 10s to 15s - still fast enough for gameplay
            const interval = setInterval(() => {
                console.log("🔄 Scheduled nonce refresh for address:", address);
                refreshNonce(address);
            }, 15000);
            return () => clearInterval(interval);
        }
    }, [refreshNonce]);

    // Update isCurrentUserPlaying when tableData changes
    useEffect(() => {
        if (tableData && tableData.data) {
            setIsCurrentUserPlaying(isUserPlaying(tableData.data));
        }
    }, [tableData]);

    // Update player legal actions when tableData changes
    useEffect(() => {
        if (tableData && tableData.data) {
            const userAddress = localStorage.getItem("user_eth_public_key");
            console.log("=== TABLE CONTEXT DEBUG ===");
            console.log("User address from localStorage:", userAddress);

            const currentPlayer = tableData.data.players?.find((p: any) => p.address?.toLowerCase() === userAddress?.toLowerCase());
            console.log("Current player data:", currentPlayer);

            if (userAddress) {
                const actions = getPlayersLegalActions(tableData.data, userAddress);
                console.log("Legal actions from utility:", actions);
                setPlayerLegalActions(actions);

                const isTurn = isPlayersTurn(tableData.data, userAddress);
                console.log("Is player's turn:", isTurn);
                setIsPlayerTurn(isTurn);
            } else {
                setPlayerLegalActions(null);
                setIsPlayerTurn(false);
            }
        }
    }, [tableData]);

    const dealTable = async (): Promise<void> => {
        if (!tableId) {
            console.error("No table ID available");
            return;
        }

        try {
            debugLog("Dealing cards for table:", tableId);
            
            // Get wallet info
            const publicKey = localStorage.getItem("user_eth_public_key");
            const privateKey = localStorage.getItem("user_eth_private_key");
            
            if (!publicKey || !privateKey) {
                throw new Error("Wallet keys not available");
            }
            
            // Use timestamp as the nonce
            const timestamp = Math.floor(Date.now() / 1000);
            
            // Get signature using the utility function
            const signature = await getSignature(
                privateKey,
                timestamp,       // Using timestamp as nonce
                publicKey,       // from
                tableId,         // to
                "0",             // amount (0 for deal action)
                "deal"           // action
            );
            
            // Use the new perform endpoint
            const response = await axios.post(`${PROXY_URL}/table/${tableId}/perform`, {
                userAddress: publicKey,
                actionType: NonPlayerActionType.DEAL,
                signature,
                publicKey,
                timestamp,
                data: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
            });
            
            debugLog("Deal response:", response.data);
            
            if (response.data?.result?.data) {
                setTableData({ data: response.data.result.data });
            }
        } catch (error) {
            console.error("Error dealing cards:", error);
        }
    };

    // Add effect to determine if dealing is allowed
    useEffect(() => {
        if (tableData?.data) {
            // Check if any active player has the "deal" action in their legal actions
            const anyPlayerCanDeal =
                tableData.data.players?.some((player: any) => {
                    return player.legalActions?.some((action: any) => action.action === "deal");
                }) || false;

            // Update canDeal state based on the presence of the deal action
            setCanDeal(anyPlayerCanDeal);

            if (DEBUG_MODE) {
                debugLog("Deal button visibility check:", {
                    anyPlayerCanDeal,
                    players: tableData.data.players?.map((p: any) => ({
                        seat: p.seat,
                        address: p.address,
                        legalActions: p.legalActions
                    }))
                });
            }
        } else {
            setCanDeal(false);
        }
    }, [tableData]);

    return (
        <TableContext.Provider
            value={{
                tableData: tableData ? { ...tableData, publicKey: userPublicKey } : null,
                setTableData,
                isLoading,
                error,
              
    
                userPublicKey,
                isCurrentUserPlaying,
                playerLegalActions,
                isPlayerTurn,
                dealTable,
                canDeal,
                openOneMore,
                openTwoMore,
                showThreeCards,
            }}
        >
            {children}
        </TableContext.Provider>
    );
};

export const useTableContext = (): TableContextType => {
    const context = useContext(TableContext);
    if (context === undefined) {
        throw new Error("useTableContext must be used within a TableProvider");
    }
    return context;
};
