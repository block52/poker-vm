import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { PROXY_URL } from '../config/constants';
import { getPublicKey, isUserPlaying } from '../utils/accountUtils';
import { whoIsNextToAct, getCurrentRound, getTotalPot, getPositionName } from '../utils/tableUtils';
import { getPlayersLegalActions, isPlayersTurn } from '../utils/playerUtils';

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
}

const TableContext = createContext<TableContextType | undefined>(undefined);

// Define WebSocket URL based on the proxy URL
const getWebSocketUrl = () => {
  const proxyUrl = new URL(PROXY_URL);
  return `${proxyUrl.protocol === 'https:' ? 'wss:' : 'ws:'}//${proxyUrl.host}/ws`;
};

export const TableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { id: tableId } = useParams<{ id: string }>();
  const wsRef = useRef<WebSocket | null>(null);
  
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
  const [usePolling, setUsePolling] = useState<boolean>(true);

  // Calculate who is next to act whenever tableData changes
  useEffect(() => {
    if (tableData && tableData.data) {
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
    }
  }, [tableData]);

  // WebSocket connection setup with reconnection logic
  useEffect(() => {
    if (!tableId) return;
    
    console.log('Setting up WebSocket connection for table:', tableId);
    
    // Close any existing connection
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      console.log('Closing existing WebSocket connection');
      wsRef.current.close();
    }
    
    let reconnectTimer: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 2000; // 2 seconds
    
    const connectWebSocket = () => {
      try {
        const wsUrl = getWebSocketUrl();
        console.log(`Connecting to WebSocket URL (attempt ${reconnectAttempts + 1}):`, wsUrl);
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        
        ws.onopen = () => {
          console.log('WebSocket connection established');
          reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          
          // Subscribe to table updates
          const subscribeMessage = JSON.stringify({
            type: 'subscribe',
            tableId: tableId
          });
          console.log('Sending subscription message:', subscribeMessage);
          ws.send(subscribeMessage);
          
          // Send a ping every 30 seconds to keep the connection alive
          const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              console.log('Sending ping to keep WebSocket alive');
              ws.send(JSON.stringify({ type: 'ping' }));
            } else {
              clearInterval(pingInterval);
            }
          }, 30000);
        };
        
        ws.onmessage = (event) => {
          try {
            console.log('WebSocket message received:', event.data);
            const data = JSON.parse(event.data);
            
            if (data.type === 'welcome') {
              console.log('Received welcome message from server');
            } else if (data.type === 'tableUpdate') {
              console.log('Received table update via WebSocket');
              console.log('Table update data structure:', JSON.stringify(data, null, 2));
              
              if (data.data) {
                console.log('Setting table data from WebSocket update');
                
                // Ensure all critical properties are present
                const tableState = data.data;
                
                // Log specific properties we're concerned about
                console.log('Table state properties:', {
                  address: tableState.address,
                  smallBlind: tableState.smallBlind,
                  bigBlind: tableState.bigBlind,
                  smallBlindPosition: tableState.smallBlindPosition,
                  bigBlindPosition: tableState.bigBlindPosition,
                  dealer: tableState.dealer,
                  players: tableState.players?.length,
                  round: tableState.round,
                  nextToAct: tableState.nextToAct
                });
                
                // Make sure we're setting the data in the exact format expected by components
                const formattedData = {
                  data: tableState
                };
                
                console.log('Formatted table data:', JSON.stringify(formattedData, null, 2));
                setTableData(formattedData);
                setIsLoading(false);
              }
            } else if (data.type === 'subscribed') {
              console.log('Successfully subscribed to table updates');
            } else if (data.type === 'pong') {
              console.log('Received pong from server');
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          
          // Attempt to reconnect unless we're unmounting
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${RECONNECT_DELAY}ms`);
            
            reconnectTimer = setTimeout(() => {
              connectWebSocket();
            }, RECONNECT_DELAY);
          } else {
            console.log('Maximum reconnect attempts reached, falling back to polling');
            setUsePolling(false);
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        setUsePolling(false);
      }
    };
    
    connectWebSocket();
    
    return () => {
      console.log('Cleaning up WebSocket connection');
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [tableId]);

  // Polling fallback
  useEffect(() => {
    if (!tableId || !usePolling) return;
    
    console.log('Using polling fallback for table data');
    
    const fetchTableData = async () => {
      console.log('Polling: fetching data for table ID:', tableId);
      
      try {
        const baseUrl = window.location.hostname === 'app.block52.xyz' 
          ? 'https://proxy.block52.xyz'
          : PROXY_URL;

        console.log('Using baseUrl:', baseUrl);
        
        const response = await axios.get(`${baseUrl}/table/${tableId}`);
        
        // Only update if critical data has changed
        setTableData((prevData: any) => {
          if (!prevData || !prevData.data) return { data: response.data };
          
          // Special case: normalize dealer position
          // If dealer position is 9 in the response, treat it as 0 for consistency
          if (response.data.dealer === 9) {
            response.data.dealer = 0;
          }
          
          // Check if any critical game state has changed
          const hasPlayerChanges = JSON.stringify(response.data.players) !== 
                                  JSON.stringify(prevData.data.players);
          const hasNextToActChanged = response.data.nextToAct !== prevData.data.nextToAct;
          const hasRoundChanged = response.data.round !== prevData.data.round;
          const hasBoardChanged = JSON.stringify(response.data.board) !== 
                                 JSON.stringify(prevData.data.board);
          const hasPotChanged = JSON.stringify(response.data.pots) !== 
                                   JSON.stringify(prevData.data.pots);
          
          // Specifically exclude dealer position from triggering updates
          // unless other important state has changed
          const hasImportantChanges = hasPlayerChanges || hasNextToActChanged || 
                                     hasRoundChanged || hasBoardChanged || hasPotChanged;
          
          if (hasImportantChanges) {
            console.log('Polling detected changes, updating table data');
            return { data: response.data };
          }
          
          console.log('Polling detected no changes, keeping current state');
          return prevData;
        });
      } catch (err) {
        console.error('Error fetching table data:', err);
      }
    };

    // Initial fetch
    fetchTableData();

    // Set up polling
    const interval = setInterval(fetchTableData, 3000);

    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, [tableId, usePolling]);

  // Update public key calculation
  useEffect(() => {
    const calculatePublicKey = () => {
      const privateKey = localStorage.getItem('user_eth_private_key');
      if (privateKey) {
        try {
          const publicKey = getPublicKey(privateKey);
          setUserPublicKey(publicKey);
          console.log('Calculated Public Key:', publicKey);
        } catch (error) {
          console.error('Error calculating public key:', error);
        }
      }
    };

    calculatePublicKey();
  }, []);

  // Refresh nonce periodically
  const refreshNonce = async (address: string) => {
    try {
      const response = await axios.get(`${PROXY_URL}/nonce/${address}`);
      console.log('Nonce Data:', response.data.result.data.nonce);
      setNonce(response.data.result.data.nonce);
      return response.data.result.data.nonce;
    } catch (error) {
      console.error('Error fetching nonce:', error);
      return null;
    }
  };

  useEffect(() => {
    const address = localStorage.getItem('user_eth_public_key');
    if (address) {
      refreshNonce(address);
      const interval = setInterval(() => refreshNonce(address), 10000);
      return () => clearInterval(interval);
    }
  }, []);

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
      if (userAddress) {
        setPlayerLegalActions(getPlayersLegalActions(tableData.data, userAddress));
        setIsPlayerTurn(isPlayersTurn(tableData.data, userAddress));
      } else {
        setPlayerLegalActions(null);
        setIsPlayerTurn(false);
      }
    }
  }, [tableData]);

  // Add the deal function
  const dealTable = async () => {
    if (!tableId) {
      console.error("No table ID available");
      return;
    }
    
    try {
      console.log("Dealing cards for table:", tableId);
      
      const response = await axios.post(`${PROXY_URL}/table/${tableId}/deal`);
      console.log("Deal response:", response.data);
      
      if (response.data?.result?.data) {
        setTableData({ data: response.data.result.data });
      }
    } catch (error) {
      console.error("Error dealing cards:", error);
    }
  };

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
      dealTable
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