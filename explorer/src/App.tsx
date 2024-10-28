import { useMempoolTransactions } from "./hooks/useMempoolTransactions";
import Transaction from "./components/Transaction";

function App() {
  const { transactions, loading, error } = useMempoolTransactions();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading mempool transactions...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-600">Error: {error.message}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-light text-gray-600 mb-8">Mempool Transactions</h1>
      {transactions.length === 0 ? (
        <p className="text-gray-500">No transactions in the mempool.</p>
      ) : (
  

        <div className="space-y-6">
          {JSON.stringify(transactions)}

          {/* {transactions?.map((tx) => (
            <div key={tx.hash} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <Transaction {...tx} />
            </div>
          ))} */}
        </div>
      )}
    </div>
  );
}

export default App;
