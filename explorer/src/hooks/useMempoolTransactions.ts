import { useEffect, useState } from "react";
import { RPCRequest, RPCResponse, SignedResponse, Transaction } from "../types/types";

export function useMempoolTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMempoolTransactions = async () => {
      try {
        const rpcRequest: RPCRequest = {
          id: Date.now().toString(),
          method: "get_mempool",
          params: [],
        };

        const response = await fetch('http://localhost:3000/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rpcRequest),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch mempool transactions');
        }

        const rpcResponse: RPCResponse<SignedResponse<Transaction[]>> = (await response.json());

        if (rpcResponse.error) {
          throw new Error(rpcResponse.error);
        }

        debugger;
        setTransactions(rpcResponse.result.data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        setLoading(false);
      }
    };

    fetchMempoolTransactions();

    // Optional: Set up polling to fetch transactions periodically
    const intervalId = setInterval(fetchMempoolTransactions, 10000); // Fetch every 10 seconds

    return () => clearInterval(intervalId); // Clean up on unmount
  }, []);

  return { transactions, loading, error };
}
