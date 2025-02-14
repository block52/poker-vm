import React, { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { PROXY_URL } from '../config/constants';
import { ethers } from "ethers";

interface TableContextType {
  tableData: any;
  isLoading: boolean;
  error: Error | null;
  setTableData: (data: any) => void;
  nonce: number | null;
  refreshNonce: (address: string) => Promise<void>;
  userPublicKey: string | null;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const TableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { id: tableId } = useParams<{ id: string }>();
    console.log('Params in TableProvider:', useParams());
    
    const [tableData, setTableData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [nonce, setNonce] = useState<number | null>(null);
    const [userPublicKey, setUserPublicKey] = useState<string | null>(null);

  
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
            
          const response = await axios.get(`${baseUrl}/table/${tableId}`);
          console.log('Table response:', response.data);
          setTableData(response.data);
        } catch (err) {
          console.error('Error fetching table data:', err);
          setError(err instanceof Error ? err : new Error('Failed to fetch table data'));
        } finally {
          setIsLoading(false);
        }
      };
  
      // Initial fetch
      fetchTableData();
  
      // Set up 5-second polling
      const interval = setInterval(fetchTableData, 20000);
  
      // Cleanup
      return () => {
        console.log('TableProvider unmounted');
        clearInterval(interval);
      };
    }, [tableId]);


    useEffect(() => {
      const calculatePublicKey = async () => {
          const privateKey = localStorage.getItem('user_eth_private_key');
          if (privateKey) {
              try {
                  const wallet = new ethers.Wallet(privateKey);
                  const publicKey = wallet.signingKey.publicKey;
                  setUserPublicKey(publicKey);
                  console.log('Calculated Public Key:', publicKey);
              } catch (error) {
                  console.error('Error calculating public key:', error);
              }
          }
      };

      calculatePublicKey();
  }, []);
  
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
  
    return (
      <TableContext.Provider value={{ tableData, setTableData, isLoading, error, nonce, refreshNonce, userPublicKey }}>
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