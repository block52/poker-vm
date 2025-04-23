import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { getPublicKey, isUserPlaying, getSignature } from "../utils/accountUtils";


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

    const [userPublicKey, setUserPublicKey] = useState<string | null>(null);

    const [openOneMore, setOpenOneMore] = useState<boolean>(false);
    const [openTwoMore, setOpenTwoMore] = useState<boolean>(false);
    const [showThreeCards, setShowThreeCards] = useState<boolean>(false);




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




    return (
        <TableContext.Provider
            value={{
                tableData: tableData ? { ...tableData, publicKey: userPublicKey } : null,
                setTableData,
                isLoading,
                error,
              
    
                userPublicKey,
  


          
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
