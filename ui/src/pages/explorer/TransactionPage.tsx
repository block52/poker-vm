import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getCosmosClient } from "../../utils/cosmos/client";
import { colors, hexToRgba } from "../../utils/colorConfig";

// Types for Cosmos transaction
interface CosmosTransaction {
  tx: {
    body: {
      messages: any[];
    };
  };
  tx_response: {
    height: string;
    txhash: string;
    code: number;
    gas_used: string;
    gas_wanted: string;
    timestamp: string;
    events: any[];
  };
}

export default function TransactionPage() {
  // Check if hash is provided via URL params (for /explorer/tx/:hash route)
  const { hash: urlHash } = useParams<{ hash: string }>();

  const [txHash, setTxHash] = useState(urlHash || "");
  const [transaction, setTransaction] = useState<CosmosTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (hashToSearch?: string) => {
    const searchHash = hashToSearch || txHash;

    if (!searchHash.trim()) {
      setError("Please enter a transaction hash");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const cosmosClient = getCosmosClient();

      if (!cosmosClient) {
        throw new Error("Cosmos client not initialized. Please check your wallet connection.");
      }

      const tx = await cosmosClient.getTx(searchHash.trim());

      console.log("Raw transaction response:", tx);

      // Validate transaction structure
      if (!tx) {
        throw new Error("Transaction not found");
      }

      // CosmosClient returns the transaction directly, not wrapped in tx_response
      // Transform to expected format if needed
      const formattedTx = tx.tx_response ? tx : {
        tx_response: tx,
        tx: tx.tx || { body: { messages: [] } }
      };

      setTransaction(formattedTx as any);
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

  // Auto-search if hash is in URL
  useEffect(() => {
    if (urlHash) {
      handleSearch(urlHash);
    }
  }, [urlHash]);

  // Memoized styles
  const containerStyle = useMemo(() => ({
    backgroundColor: hexToRgba(colors.ui.bgDark, 0.8),
    border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
  }), []);

  const inputStyle = useMemo(() => ({
    backgroundColor: hexToRgba(colors.ui.bgMedium, 0.8),
    border: `1px solid ${hexToRgba(colors.brand.primary, 0.3)}`
  }), []);

  const buttonStyle = useMemo(() => ({
    background: loading
      ? `linear-gradient(135deg, ${hexToRgba(colors.ui.bgDark, 0.5)} 0%, ${hexToRgba(colors.ui.bgDark, 0.3)} 100%)`
      : `linear-gradient(135deg, ${colors.brand.primary} 0%, ${hexToRgba(colors.brand.primary, 0.8)} 100%)`
  }), [loading]);

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden bg-[#2c3245] p-6">
      <div className="w-full max-w-4xl">
        {/* Header Card */}
        <div
          className="backdrop-blur-md p-6 rounded-xl shadow-2xl mb-6"
          style={containerStyle}
        >
          <h1 className="text-4xl font-extrabold text-white mb-2">Transaction Search</h1>
          <p className="text-gray-300">
            Enter a transaction hash to view its details
          </p>
        </div>

        {/* Search Card */}
        <div
          className="backdrop-blur-md p-6 rounded-xl shadow-2xl mb-6"
          style={containerStyle}
        >
          <div className="space-y-4">
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter transaction hash (e.g., 6DC1920A33244C65505CEA60DD86961A89DB31689772B78420F493F99FC17682)"
              className="w-full p-3 rounded-lg backdrop-blur-sm text-white focus:outline-none transition-all duration-200 font-mono text-sm"
              style={inputStyle}
              onFocus={(e) => e.target.style.border = `1px solid ${colors.brand.primary}`}
              onBlur={(e) => e.target.style.border = `1px solid ${hexToRgba(colors.brand.primary, 0.3)}`}
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className={`w-full py-3 px-6 text-white font-bold rounded-lg transition duration-300 shadow-md ${
                loading ? "cursor-not-allowed opacity-50" : "transform hover:scale-105 hover:opacity-90"
              }`}
              style={buttonStyle}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Searching...
                </div>
              ) : (
                "Search Transaction"
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div
            className="backdrop-blur-md p-4 rounded-xl shadow-2xl mb-6"
            style={{
              backgroundColor: hexToRgba(colors.accent.danger, 0.2),
              border: `1px solid ${hexToRgba(colors.accent.danger, 0.5)}`
            }}
          >
            <div className="flex items-center gap-3">
              <svg
                className="h-6 w-6 flex-shrink-0"
                style={{ color: colors.accent.danger }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-white font-semibold">Error: {error}</span>
            </div>
          </div>
        )}

        {/* Transaction Details */}
        {transaction && transaction.tx_response && (
          <div
            className="backdrop-blur-md p-6 rounded-xl shadow-2xl"
            style={containerStyle}
          >
            <h2 className="text-2xl font-bold text-white mb-6">Transaction Details</h2>

            <div className="space-y-6">
              {/* Transaction Hash */}
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">Transaction Hash</label>
                <div
                  className="p-3 rounded-lg font-mono text-sm text-white break-all"
                  style={{
                    backgroundColor: hexToRgba(colors.ui.bgMedium, 0.6),
                    border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                  }}
                >
                  {transaction.tx_response.txhash}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <label className="text-gray-400 text-sm font-semibold">Status:</label>
                <span
                  className="font-bold flex items-center gap-2"
                  style={{
                    color: transaction.tx_response.code === 0 ? colors.accent.success : colors.accent.danger
                  }}
                >
                  {transaction.tx_response.code === 0 ? (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      SUCCESS
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      FAILED (code {transaction.tx_response.code})
                    </>
                  )}
                </span>
              </div>

              {/* Block Height and Gas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">Block Height</label>
                  <div className="text-white font-mono" style={{ color: colors.brand.primary }}>
                    #{transaction.tx_response.height}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">Gas Used / Wanted</label>
                  <div className="text-white font-mono">
                    {transaction.tx_response.gas_used} / {transaction.tx_response.gas_wanted}
                  </div>
                </div>
              </div>

              {/* Messages */}
              {transaction.tx.body.messages.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Messages ({transaction.tx.body.messages.length})
                  </h3>
                  <div className="space-y-3">
                    {transaction.tx.body.messages.map((msg: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg"
                        style={{
                          backgroundColor: hexToRgba(colors.ui.bgMedium, 0.6),
                          border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                        }}
                      >
                        <div className="mb-3">
                          <label className="block text-gray-400 text-xs font-semibold mb-1">Type</label>
                          <code className="text-sm font-mono" style={{ color: colors.brand.primary }}>
                            {msg["@type"] || msg.typeUrl}
                          </code>
                        </div>
                        <div>
                          <label className="block text-gray-400 text-xs font-semibold mb-1">Data</label>
                          <pre
                            className="p-3 rounded text-xs overflow-auto font-mono text-gray-300"
                            style={{
                              backgroundColor: hexToRgba(colors.ui.bgDark, 0.8),
                              border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`,
                              maxHeight: "300px"
                            }}
                          >
                            {JSON.stringify(msg, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events */}
              {transaction.tx_response.events && transaction.tx_response.events.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Events ({transaction.tx_response.events.length})
                  </h3>
                  <pre
                    className="p-4 rounded-lg text-xs overflow-auto font-mono text-gray-300"
                    style={{
                      backgroundColor: hexToRgba(colors.ui.bgMedium, 0.6),
                      border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`,
                      maxHeight: "400px"
                    }}
                  >
                    {JSON.stringify(transaction.tx_response.events, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
