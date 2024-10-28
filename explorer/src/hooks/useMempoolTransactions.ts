import { useEffect, useState } from "react";
import { NODE_URL } from "../config";
import { NodeRpcClient, TransactionDTO } from "@block52/sdk";

export function useMempoolTransactions() {
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  

  useEffect(() => {
    const fetchMempoolTransactions = async () => {
      try {
        const client = new NodeRpcClient(NODE_URL);
        const mempool = await client.getMempool();
        setTransactions(mempool);
        setLoading(false);
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
