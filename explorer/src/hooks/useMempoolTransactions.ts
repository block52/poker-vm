import { useEffect, useState } from "react";
import { RPCRequest, RPCResponse, SignedResponse, Transaction } from "../types/types";
import { NODE_URL } from "../config";

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

        const response = await fetch(NODE_URL, {
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

        setTransactions(rpcResponse.result.data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        setLoading(false);
      }
    };

    fetchMempoolTransactions();
    const intervalId = setInterval(fetchMempoolTransactions, 10000);
    return () => clearInterval(intervalId);
  }, []);

  return { transactions, loading, error };
}
