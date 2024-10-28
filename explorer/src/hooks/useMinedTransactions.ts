import { useEffect, useState } from "react";
import { RPCRequest, RPCResponse, SignedResponse, Transaction } from "../types/types";
import { NODE_URL } from "../config";

export function useMinedTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMinedTransactions = async () => {
      try {
        const rpcRequest: RPCRequest = {
          id: Date.now().toString(),
          method: "get_transactions",
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
          throw new Error('Failed to fetch mined transactions');
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

    fetchMinedTransactions();
    const intervalId = setInterval(fetchMinedTransactions, 10000);
    return () => clearInterval(intervalId);
  }, []);

  return { transactions, loading, error };
}
