import { useEffect, useState } from "react";
import { NODE_URL } from "../config";
import { NodeRpcClient, TransactionDTO } from "@bitcoinbrisbane/block52";

export function useMinedTransactions() {
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMinedTransactions = async () => {
      try {
        const client = new NodeRpcClient(NODE_URL);
        const transactions = await client.getTransactions();
        setTransactions(transactions);
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
