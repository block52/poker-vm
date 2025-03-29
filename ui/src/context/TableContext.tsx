import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { PROXY_URL } from '../config/constants';
import { getPublicKey, isUserPlaying } from '../utils/accountUtils';
import { whoIsNextToAct, getCurrentRound, getTotalPot, getPositionName, getWinnerInfo } from '../utils/tableUtils';
import { getPlayersLegalActions, isPlayersTurn } from '../utils/playerUtils';
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import useUserWallet from "../hooks/useUserWallet";  // this is the browser wallet todo rename to useBrowserWallet
import { ethers } from "ethers";

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
  nonce: number | null;
  refreshNonce: (address: string) => Promise<void>;
  userPublicKey: string | null;
  isCurrentUserPlaying: boolean;
  nextToActInfo: {
    seat: number;
    player: any;
    isCurrentUserTurn: boolean;
    availableActions: any[];
    timeRemaining: number;
  } | null;
  currentRound: string;
  totalPot: string;
  playerLegalActions: any[] | null;
  isPlayerTurn: boolean;
  dealTable: () => Promise<void>;
  canDeal: boolean;
  tableSize: number;
  tableType: string;
  roundType: string;
  openOneMore: boolean;
  openTwoMore: boolean;
  showThreeCards: boolean;
  performAction: (gameAddress: string, action: PlayerActionType, amount?: string, nonce?: number) => void;
  fold: () => void;
  check: () => void;
  call: () => void;
  raise: (amount: number) => void;
  bet: (amount: number) => void;
  leave: () => void;
  setPlayerAction: (action: PlayerActionType, amount?: number) => void;
  // New user data by seat
  getUserBySeat: (seat: number) => any;
  currentUserSeat: number;
  userDataBySeat: Record<number, any>;
  winnerInfo: {
    seat: number;
    address: string;
    amount: string | number;
    formattedAmount: string;
  }[] | null;
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
  const [nextToActInfo, setNextToActInfo] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState<string>('');
  const [totalPot, setTotalPot] = useState<string>('0');
  const [playerLegalActions, setPlayerLegalActions] = useState<any[] | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(false);

  const [tableSize, setTableSize] = useState<number>(9);
  const [tableType, setTableType] = useState<string>("");
  const [roundType, setRoundType] = useState<string>("");
  const [openOneMore, setOpenOneMore] = useState<boolean>(false);
  const [openTwoMore, setOpenTwoMore] = useState<boolean>(false);
  const [showThreeCards, setShowThreeCards] = useState<boolean>(false);
  // Add state for user data by seat
  const [userDataBySeat, setUserDataBySeat] = useState<Record<number, any>>({});
  const [currentUserSeat, setCurrentUserSeat] = useState<number>(-1);

  const [canDeal, setCanDeal] = useState<boolean>(false);
  
  const { b52 } = useUserWallet();

  // Helper to get user address from storage once
  const userWalletAddress = React.useMemo(() => {
    const address = localStorage.getItem("user_eth_public_key");
    return address ? address.toLowerCase() : null;
  }, []);

  // Add state for winner information
  const [winnerInfo, setWinnerInfo] = useState<any[] | null>(null);

  // Calculate winner info whenever tableData changes
  useEffect(() => {
    if (tableData && tableData.data) {
      // Get winner info if available
      const winners = getWinnerInfo(tableData.data);
      setWinnerInfo(winners);
      
      if (winners && winners.length > 0) {
        console.log('🏆 Winners detected:', winners);
      }
      
      // Special case: if dealer position is 9, treat it as 0 for UI purposes
      if (tableData.data.dealer === 9) {
        tableData.data.dealer = 0;
      }
      
      // Use the utility function to determine who is next to act
      const nextToActData = whoIsNextToAct(tableData.data);
      setNextToActInfo(nextToActData);
      
      // Update other table information
      setCurrentRound(getCurrentRound(tableData.data));
      setTotalPot(getTotalPot(tableData.data));

      // Update current user's seat when table data changes
      if (userWalletAddress && tableData.data.players) {
        const playerIndex = tableData.data.players.findIndex(
          (player: any) => player.address?.toLowerCase() === userWalletAddress
        );
        setCurrentUserSeat(playerIndex >= 0 ? playerIndex : -1);
      }
    }
  }, [tableData, userWalletAddress]);

  // Fetch user data by seat when needed
  const fetchUserBySeat = useCallback(async (seat: number) => {
    if (!tableId || seat < 0 || !tableData?.data?.players?.[seat]) return null;
    
    try {
      // Check if we already have cached data and it's not stale
      const cachedData = userDataBySeat[seat];
      const isStale = !cachedData || 
                     (cachedData.lastFetched && 
                      Date.now() - cachedData.lastFetched > 30000); // Refresh every 30 seconds
      
      // If we have non-stale data, use it
      if (cachedData && !isStale) {
        return cachedData.data;
      }
      
      const response = await axios.get(`${PROXY_URL}/table/${tableId}/player/${seat}`);
      
      // Update the cache with new data and timestamp
      setUserDataBySeat(prev => ({
        ...prev,
        [seat]: { 
          data: response.data,
          lastFetched: Date.now()
        }
      }));
      
      return response.data;
    } catch (error) {
      if (DEBUG_MODE) console.error(`Error fetching user data for seat ${seat}:`, error);
      return null;
    }
  }, [tableId, tableData?.data?.players, userDataBySeat]);

  // Helper function to get user data by seat (from cache or fetch if needed)
  const getUserBySeat = useCallback((seat: number) => {
    const cachedData = userDataBySeat[seat];
    
    // If we don't have data or it's stale, trigger a fetch
    if (!cachedData || 
        (cachedData.lastFetched && Date.now() - cachedData.lastFetched > 30000)) {
      fetchUserBySeat(seat);
    }
    
    return cachedData?.data || null;
  }, [userDataBySeat, fetchUserBySeat]);

  

  // Update polling logic to run regardless of WebSocket status
  useEffect(() => {
    if (!tableId) return;
    
    debugLog('Using polling for table data');
    
    let isFirstLoad = true;
    let lastUpdateTimestamp = 0;
    
    const fetchTableData = async () => {
      // Add debounce - only fetch if it's been at least 2 seconds since last update
      const now = Date.now();
      if (!isFirstLoad && now - lastUpdateTimestamp < 20000) {
        return;
      }
      
      debugLog('Polling: fetching data for table ID:', tableId);
      
      try {
        const baseUrl = window.location.hostname === 'app.block52.xyz' 
          ? 'https://proxy.block52.xyz'
          : PROXY_URL;

        debugLog('Using baseUrl:', baseUrl);
        
        const response = await axios.get(`${baseUrl}/get_game_state/${tableId}`);
        
        if (!response.data) {
          console.error('Polling received empty data');
          return;
        }
        
        // Fix the data structure to match what the components expect
        debugLog('Response data structure:', JSON.stringify(response.data).substring(0, 100) + '...');
        
        // More explicit data validation and structure handling
        if (!response.data.data && !response.data.type) {
          console.error('Unexpected API response structure', response.data);
          return;
        }

        // Determine if the data is directly in response.data or in response.data.data
        const tableState = response.data.data || response.data;
        debugLog('Extracted table state structure:', {
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
            debugLog('Setting initial table data with structure:', Object.keys(formattedData));
            setIsLoading(false); // Make sure to set loading to false here
            return formattedData;
          }
          
          // Special case: normalize dealer position
          // If dealer position is 9 in the response, treat it as 0 for consistency
          if (tableState.dealer === 9) {
            tableState.dealer = 0;
          }
          
          // Check if any critical game state has changed
          const hasPlayerChanges = JSON.stringify(tableState.players) !== 
                                  JSON.stringify(prevData.data.players);
          const hasNextToActChanged = tableState.nextToAct !== prevData.data.nextToAct;
          const hasRoundChanged = tableState.round !== prevData.data.round;
          const hasBoardChanged = JSON.stringify(tableState.board || tableState.communityCards) !== 
                                 JSON.stringify(prevData.data.board || prevData.data.communityCards);
          const hasPotChanged = JSON.stringify(tableState.pots) !== 
                                   JSON.stringify(prevData.data.pots);
          
          const hasImportantChanges = hasPlayerChanges || hasNextToActChanged || 
                                     hasRoundChanged || hasBoardChanged || hasPotChanged;
          
          if (hasImportantChanges) {
            debugLog('Polling detected changes, updating table data');
            lastUpdateTimestamp = now;
            
            // Ensure we always have a consistent structure with data property
            const formattedData = response.data.data ? response.data : { data: response.data };
            setIsLoading(false); // Make sure to set loading to false here
            return formattedData;
          }
          
          debugLog('Polling detected no changes, keeping current state');
          return prevData;
        });
      } catch (err) {
        console.error('Error fetching table data:', err);
        // Set error state so UI can show appropriate message
        setError(err instanceof Error ? err : new Error('Unknown error fetching table data'));
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
      const privateKey = localStorage.getItem('user_eth_private_key');
      if (privateKey) {
        try {
          const publicKey = getPublicKey(privateKey);
          setUserPublicKey(publicKey);
          debugLog('Calculated Public Key:', publicKey);
        } catch (error) {
          console.error('Error calculating public key:', error);
        }
      }
    };

    calculatePublicKey();
  }, []);

  // Refresh nonce with debounce
  const refreshNonce = useCallback(async (address: string) => {
    try {
      const response = await axios.get(`${PROXY_URL}/nonce/${address}`);
      debugLog('Nonce Data:', response.data.result.data.nonce);
      
      if (response.data?.result?.data?.nonce !== undefined) {
        console.log('🔄 Nonce updated:', {
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
      console.error('Error fetching nonce:', error);
      return null;
    }
  }, [nonce]);

  // Optimize nonce refresh - less frequent polling
  useEffect(() => {
    const address = localStorage.getItem('user_eth_public_key');
    if (address) {
      console.log('✅ Initial nonce refresh for address:', address);
      refreshNonce(address);
      // Reduce frequency from 10s to 15s - still fast enough for gameplay
      const interval = setInterval(() => {
        console.log('🔄 Scheduled nonce refresh for address:', address);
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
      const userAddress = localStorage.getItem('user_eth_public_key');
      console.log("=== TABLE CONTEXT DEBUG ===");
      console.log("User address from localStorage:", userAddress);
      console.log("Next to act seat:", tableData.data.nextToAct);
      
      const currentPlayer = tableData.data.players?.find((p: any) => 
        p.address?.toLowerCase() === userAddress?.toLowerCase()
      );
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

  // When the user has joined a table, fetch their seat data
  useEffect(() => {
    if (currentUserSeat >= 0 && tableId) {
      fetchUserBySeat(currentUserSeat);
    }
  }, [currentUserSeat, tableId, fetchUserBySeat]);

  // Add the deal function
  const dealTable = async () => {
    if (!tableId) {
      console.error("No table ID available");
      return;
    }
    
    try {
      debugLog("Dealing cards for table:", tableId);
      
      const response = await axios.post(`${PROXY_URL}/table/${tableId}/deal`);
      debugLog("Deal response:", response.data);
      
      if (response.data?.result?.data) {
        setTableData({ data: response.data.result.data });
      }
    } catch (error) {
      console.error("Error dealing cards:", error);
    }
  };

  // Add these functions from PlayerContext
  const performAction = useCallback(
    async (gameAddress: string, action: PlayerActionType, amount?: string, nonce?: number) => {
      console.log('🎮 Performing action with nonce:', {
        action,
        amount,
        nonce,
        gameAddress
      });
      // b52?.playerAction(gameAddress, action, amount ?? "", nonce);
      
      // Wait a moment for the action to be processed
      setTimeout(async () => {
        const address = localStorage.getItem('user_eth_public_key');
        if (address) {
          await refreshNonce(address);
        }
      }, 1000);
    },
    [b52, refreshNonce]
  );

  const fold = useCallback(() => {
    if (tableId && nonce !== null) {
      performAction(tableId, PlayerActionType.FOLD, undefined, nonce);
    }
  }, [tableId, nonce, performAction]);

  const check = useCallback(() => {
    if (tableId && nonce !== null) {
      performAction(tableId, PlayerActionType.CHECK, undefined, nonce);
    }
  }, [tableId, nonce, performAction]);

  const call = useCallback(() => {
    if (tableId && nonce !== null) {
      performAction(tableId, PlayerActionType.CALL, undefined, nonce);
    }
  }, [tableId, nonce, performAction]);

  const raise = useCallback((amount: number) => {
    if (tableId && nonce !== null) {
      performAction(tableId, PlayerActionType.RAISE, amount.toString(), nonce);
    }
  }, [tableId, nonce, performAction]);

  const bet = useCallback((amount: number) => {
    if (tableId && nonce !== null) {
      performAction(tableId, PlayerActionType.BET, amount.toString(), nonce);
    }
  }, [tableId, nonce, performAction]);

  const leave = useCallback(async () => {
    if (tableId && nonce !== null) {
      // Get the current player's stack amount
      if (currentUserSeat >= 0 && tableData?.data?.players) {
        try {
          const playerStack = tableData.data.players[currentUserSeat]?.stack || "0";
          console.log('🚪 Executing leave action with stack:', playerStack);
          
          // Add specific URL construction for leave action
          const leaveUrl = `${PROXY_URL}/table/${tableId}/playeraction`;
          console.log('🔄 Using endpoint:', leaveUrl);
          
          // Get wallet info
          const publicKey = localStorage.getItem('user_eth_public_key');
          const privateKey = localStorage.getItem('user_eth_private_key');
          
          if (!publicKey || !privateKey) {
            throw new Error('Wallet keys not available');
          }
          
          // Create wallet for signing
          const wallet = new ethers.Wallet(privateKey);
          const timestamp = Math.floor(Date.now() / 1000);
          const messageToSign = `leave${playerStack}${tableId}${timestamp}`;
          const signature = await wallet.signMessage(messageToSign);
          
          // Make direct API call
          console.log('📤 Making direct API call to playeraction for leave');
          const response = await axios.post(leaveUrl, {
            userAddress: publicKey,
            action: 'leave',
            amount: playerStack,
            signature,
            publicKey,
            timestamp,
            nonce
          });
          
          console.log('✅ Leave action successful:', response.data);
          
          // Refresh nonce after successful leave
          setTimeout(async () => {
            const address = localStorage.getItem('user_eth_public_key');
            if (address) {
              await refreshNonce(address);
            }
          }, 1000);
          
          return {
            success: true,
            result: response.data,
            actionName: "LEAVE",
            timestamp: new Date().toISOString(),
            method: 'directApiCall'
          };
        } catch (error) {
          console.error('❌ Error in leave action:', error);
          throw error;
        }
      } else {
        console.warn('⚠️ Cannot leave: Player not found at current seat or no table data');
        return null;
      }
    } else {
      console.warn('⚠️ Cannot leave: Missing tableId or nonce');
      return null;
    }
  }, [tableId, nonce, refreshNonce, currentUserSeat, tableData]);

  const setPlayerAction = useCallback((action: PlayerActionType, amount?: number) => {
    switch (action) {
      case PlayerActionType.FOLD:
        fold();
        break;
      case PlayerActionType.CHECK:
        check();
        break;
      case PlayerActionType.CALL:
        call();
        break;
      case PlayerActionType.RAISE:
        if (amount !== undefined) {
          raise(amount);
        }
        break;
      case PlayerActionType.BET:
        if (amount !== undefined) {
          bet(amount);
        }
        break;
      case PlayerActionType.LEAVE:
        leave();
        break;
    }
  }, [fold, check, call, raise, bet, leave]);

  // Update table type and round info when table data changes
  useEffect(() => {
    if (tableData && tableData.data) {
      // Set table type if available in data
      setTableType(tableData.data.type || "No Limit Hold'em");
      
      // Set round type from the current round
      setRoundType(getCurrentRound(tableData.data));
    }
  }, [tableData]);

  // Add effect to determine if dealing is allowed
  useEffect(() => {
    if (tableData?.data) {
      // Check if any active player has the "deal" action in their legal actions
      const anyPlayerCanDeal = tableData.data.players?.some((player: any) => {
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
    <TableContext.Provider value={{ 
      tableData: tableData ? { ...tableData, publicKey: userPublicKey } : null,
      setTableData, 
      isLoading, 
      error, 
      nonce, 
      refreshNonce, 
      userPublicKey,
      isCurrentUserPlaying,
      nextToActInfo,
      currentRound,
      totalPot,
      playerLegalActions,
      isPlayerTurn,
      dealTable,
      canDeal,
      tableSize,
      tableType,
      roundType,
      openOneMore,
      openTwoMore,
      showThreeCards,
      performAction,
      fold,
      check,
      call,
      raise,
      bet,
      leave,
      setPlayerAction,
      // New user data functionality
      getUserBySeat,
      currentUserSeat,
      userDataBySeat,
      // Winner information
      winnerInfo
    }}>
      {children}
    </TableContext.Provider>
  );
};

export const useTableContext = () => {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTableContext must be used within a TableProvider');
  }
  return context;
}; 