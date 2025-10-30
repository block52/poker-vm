import { useState } from "react";
import { cosmosApi, CosmosTransaction } from "../services/cosmosApi";

export default function TransactionPage() {
  const [txHash, setTxHash] = useState("");
  const [transaction, setTransaction] = useState<CosmosTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!txHash.trim()) {
      setError("Please enter a transaction hash");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const tx = await cosmosApi.getTransaction(txHash.trim());
      setTransaction(tx);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Transaction not found");
      setTransaction(null);
      console.error("Error fetching transaction:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1>Search Transaction</h1>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Enter a transaction hash to view its details
      </p>

      <div style={{ marginBottom: "30px" }}>
        <input
          type="text"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter transaction hash (e.g., 6DC1920A33244C65505CEA60DD86961A89DB31689772B78420F493F99FC17682)"
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "14px",
            fontFamily: "monospace",
            border: "1px solid #ddd",
            borderRadius: "4px",
            marginBottom: "10px",
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: loading ? "#ccc" : "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "15px",
            backgroundColor: "#fee",
            border: "1px solid #fcc",
            borderRadius: "4px",
            color: "#c00",
            marginBottom: "20px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {transaction && (
        <div>
          <h2 style={{ marginTop: "30px", marginBottom: "15px" }}>Transaction Details</h2>

          <div
            style={{
              backgroundColor: "#f9f9f9",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          >
            <div style={{ marginBottom: "15px" }}>
              <strong>Transaction Hash:</strong>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                  marginTop: "5px",
                  wordBreak: "break-all",
                  backgroundColor: "#fff",
                  padding: "10px",
                  borderRadius: "4px",
                }}
              >
                {transaction.tx_response.txhash}
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  color: transaction.tx_response.code === 0 ? "#00aa00" : "#cc0000",
                  fontWeight: "bold",
                }}
              >
                {transaction.tx_response.code === 0 ? "✓ SUCCESS" : `✗ FAILED (code ${transaction.tx_response.code})`}
              </span>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <strong>Block Height:</strong> #{transaction.tx_response.height}
            </div>

            <div style={{ marginBottom: "15px" }}>
              <strong>Gas:</strong> {transaction.tx_response.gas_used} / {transaction.tx_response.gas_wanted}
            </div>

            {transaction.tx.body.messages.length > 0 && (
              <>
                <h3 style={{ marginTop: "20px", marginBottom: "10px" }}>
                  Messages ({transaction.tx.body.messages.length})
                </h3>
                {transaction.tx.body.messages.map((msg: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: "#fff",
                      padding: "15px",
                      borderRadius: "4px",
                      marginBottom: "10px",
                      border: "1px solid #ddd",
                    }}
                  >
                    <div style={{ marginBottom: "10px" }}>
                      <strong>Type:</strong>{" "}
                      <code style={{ fontSize: "12px", color: "#0066cc" }}>{msg["@type"] || msg.typeUrl}</code>
                    </div>
                    <div>
                      <strong>Data:</strong>
                      <pre
                        style={{
                          backgroundColor: "#f5f5f5",
                          padding: "10px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          overflow: "auto",
                          marginTop: "5px",
                        }}
                      >
                        {JSON.stringify(msg, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </>
            )}

            {transaction.tx_response.events && transaction.tx_response.events.length > 0 && (
              <>
                <h3 style={{ marginTop: "20px", marginBottom: "10px" }}>
                  Events ({transaction.tx_response.events.length})
                </h3>
                <pre
                  style={{
                    backgroundColor: "#fff",
                    padding: "15px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    overflow: "auto",
                    border: "1px solid #ddd",
                  }}
                >
                  {JSON.stringify(transaction.tx_response.events, null, 2)}
                </pre>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
