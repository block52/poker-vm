import { useMempoolTransactions } from './hooks/useMempoolTransactions'
import Transaction from './components/Transaction'
import './App.css'

function App() {
  const { transactions, loading, error } = useMempoolTransactions();

  if (loading) {
    return <div>Loading mempool transactions...</div>
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div className="App">
      <h1>Mempool Transactions</h1>
      {transactions.length === 0 ? (
        <p>No transactions in the mempool.</p>
      ) : (
        <div className="transactions-list">
          {transactions.map((tx) => (
            <div key={tx.hash} className="transaction-box">
              <Transaction {...tx} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
