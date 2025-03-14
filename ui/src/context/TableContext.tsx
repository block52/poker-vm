import React, { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { PROXY_URL } from '../config/constants';
import { getPublicKey, isUserPlaying } from '../utils/accountUtils';
import { whoIsNextToAct, getCurrentRound, getTotalPot, getPositionName } from '../utils/tableUtils';

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
  
    useEffect(() => {
      console.log('TableProvider mounted with ID:', tableId);
      console.log('Using PROXY_URL:', PROXY_URL);
      
      const fetchTableData = async () => {
        console.log('Fetch attempt with ID:', tableId);
        if (!tableId) return;
        
        console.log('Fetching data for table ID:', tableId);
        
        setIsLoading(true);
        try {
          const baseUrl = window.location.hostname === 'app.block52.xyz' 
            ? 'https://proxy.block52.xyz'
            : PROXY_URL;

            console.log('Using baseUrl:', baseUrl);
            console.log('Using tableId:', tableId);
            
          const response = await axios.get(`${baseUrl}/table/${tableId}`);
          console.log('Table response:', response.data);
          
          // Make sure we're setting the data in the correct format
          // The API returns data directly, not nested in a 'data' property
          setTableData({
            data: response.data,
            // publicKey: userPublicKey
          });
        } catch (err) {
          console.error('Error fetching table data:', err);
          setError(err instanceof Error ? err : new Error('Failed to fetch table data'));
        } finally {
          setIsLoading(false);
        }
      };
  
      // Initial fetch
      fetchTableData();
  
      // Set up polling - changed to 5 seconds for more frequent updates
      const interval = setInterval(fetchTableData, 2000000);
  
      // Cleanup
      return () => {
        console.log('TableProvider unmounted');
        clearInterval(interval);
      };
    }, [tableId, userPublicKey]); // Added userPublicKey as a dependency

    // Update public key calculation using the utility
    useEffect(() => {
        const calculatePublicKey = () => {
            const privateKey = localStorage.getItem('user_eth_private_key');
            if (privateKey) {
                try {
                    const publicKey = getPublicKey(privateKey);
                    setUserPublicKey(publicKey);
                    
                    // Don't update tableData here - this creates a circular dependency
                    // Instead, just set the public key
                    console.log('Calculated Public Key:', publicKey);
                } catch (error) {
                    console.error('Error calculating public key:', error);
                }
            }
        };

        calculatePublicKey();
    }, []); // Only run once on mount, not when tableData changes
  
    const refreshNonce = async (address: string) => {
        try {
            const response = await axios.get(`${PROXY_URL}/nonce/${address}`);
            console.log('Destructured Nonce Data:', {
                nonce: response.data.result.data.nonce,
                balance: response.data.result.data.balance,
                signature: response.data.result.signature,
                timestamp: response.data.timestamp
            });
            setNonce(response.data.result.data.nonce);
            return response.data.result.data.nonce;
        } catch (error) {
            console.error('Error fetching nonce:', error);
            return null;
        }
    };

    // Refresh nonce periodically
    useEffect(() => {
        const address = localStorage.getItem('user_eth_public_key');
        if (address) {
            refreshNonce(address);
            const interval = setInterval(() => refreshNonce(address), 30000); // Every 30 seconds
            return () => clearInterval(interval);
        }
    }, []);
  
    // Add a new useEffect to update isCurrentUserPlaying when tableData changes
    useEffect(() => {
        if (tableData && tableData.data) {
            setIsCurrentUserPlaying(isUserPlaying(tableData.data));
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
          totalPot
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