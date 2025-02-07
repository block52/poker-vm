import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { PROXY_URL } from '../config/constants';

export type TableContextType = {
  tableData: any;
  isLoading: boolean;
  error: Error | null;
  setTableData: (data: any) => void;
};

export const TableContext = createContext<TableContextType>({
  tableData: null,
  isLoading: true,
  error: null,
  setTableData: () => {}
});

export const TableProvider = ({ children }: { children: ReactNode }) => {
    const { id: tableId } = useParams<{ id: string }>();
    console.log('Params in TableProvider:', useParams());
    
    const [tableData, setTableData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
  
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
      const interval = setInterval(fetchTableData, 1000);
  
      // Cleanup
      return () => {
        console.log('TableProvider unmounted');
        clearInterval(interval);
      };
    }, [tableId]);
  
    return (
      <TableContext.Provider value={{ tableData, setTableData, isLoading, error }}>
        {children}
      </TableContext.Provider>
    );
  };
  
  export const useTableContext = () => {
    const context = useContext(TableContext);
    if (!context) {
      throw new Error('useTableContext must be used within a TableProvider');
    }
    return context;
  }; 