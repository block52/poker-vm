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
  const [showEventExplanation, setShowEventExplanation] = useState(false);

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

  // Set page title based on transaction hash
  useEffect(() => {
    if (urlHash) {
      // Show first 8 characters of hash in title
      const shortHash = urlHash.substring(0, 8);
      document.title = `Tx ${shortHash}... - Block52 Explorer`;
    } else {
      document.title = "Transaction Search - Block52 Explorer";
    }

    // Cleanup: reset title when component unmounts
    return () => {
      document.title = "Block52 Chain";
    };
  }, [urlHash, transaction]);

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

              {/* Game Events Highlights */}
              {transaction.tx_response.events && (() => {
                // Check for game_created event
                const gameCreatedEvent = transaction.tx_response.events.find((e: any) => e.type === "game_created");
                if (gameCreatedEvent) {
                  const gameIdAttr = gameCreatedEvent.attributes?.find((a: any) => a.key === "game_id");
                  const gameTypeAttr = gameCreatedEvent.attributes?.find((a: any) => a.key === "game_type");
                  const minPlayersAttr = gameCreatedEvent.attributes?.find((a: any) => a.key === "min_players");
                  const maxPlayersAttr = gameCreatedEvent.attributes?.find((a: any) => a.key === "max_players");

                  if (gameIdAttr) {
                    return (
                      <div
                        className="p-5 rounded-lg"
                        style={{
                          backgroundColor: hexToRgba(colors.accent.success, 0.1),
                          border: `2px solid ${colors.accent.success}`
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-6 h-6" style={{ color: colors.accent.success }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <h3 className="text-xl font-bold" style={{ color: colors.accent.success }}>
                            🎮 Game Created Successfully!
                          </h3>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-gray-300 text-xs font-semibold mb-1">Game ID</label>
                            <code
                              className="text-sm font-mono break-all cursor-pointer transition-colors duration-200 block"
                              style={{ color: colors.brand.primary }}
                              onClick={() => {
                                navigator.clipboard.writeText(gameIdAttr.value);
                                alert("Game ID copied!");
                              }}
                              title="Click to copy"
                            >
                              {gameIdAttr.value}
                            </code>
                          </div>
                          {gameTypeAttr && (
                            <div>
                              <label className="block text-gray-300 text-xs font-semibold mb-1">Game Type</label>
                              <span className="text-white font-bold">{gameTypeAttr.value}</span>
                            </div>
                          )}
                          {minPlayersAttr && maxPlayersAttr && (
                            <div>
                              <label className="block text-gray-300 text-xs font-semibold mb-1">Players</label>
                              <span className="text-white font-bold">{minPlayersAttr.value} - {maxPlayersAttr.value}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                }

                // Check for player_joined_game event
                const playerJoinedEvent = transaction.tx_response.events.find((e: any) => e.type === "player_joined_game");
                if (playerJoinedEvent) {
                  const gameIdAttr = playerJoinedEvent.attributes?.find((a: any) => a.key === "game_id");
                  const playerAttr = playerJoinedEvent.attributes?.find((a: any) => a.key === "player");
                  const buyInAttr = playerJoinedEvent.attributes?.find((a: any) => a.key === "buy_in");

                  if (gameIdAttr) {
                    return (
                      <div
                        className="p-5 rounded-lg"
                        style={{
                          backgroundColor: hexToRgba(colors.accent.success, 0.1),
                          border: `2px solid ${colors.accent.success}`
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-6 h-6" style={{ color: colors.accent.success }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <h3 className="text-xl font-bold" style={{ color: colors.accent.success }}>
                            🪑 Joined Game Successfully!
                          </h3>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-gray-300 text-xs font-semibold mb-1">Game ID</label>
                            <code
                              className="text-sm font-mono break-all cursor-pointer transition-colors duration-200 block"
                              style={{ color: colors.brand.primary }}
                              onClick={() => {
                                navigator.clipboard.writeText(gameIdAttr.value);
                                alert("Game ID copied!");
                              }}
                              title="Click to copy"
                            >
                              {gameIdAttr.value}
                            </code>
                          </div>
                          {playerAttr && (
                            <div>
                              <label className="block text-gray-300 text-xs font-semibold mb-1">Player</label>
                              <code className="text-sm font-mono text-white">{playerAttr.value}</code>
                            </div>
                          )}
                          {buyInAttr && (
                            <div>
                              <label className="block text-gray-300 text-xs font-semibold mb-1">Buy-In</label>
                              <span className="text-white font-bold">{buyInAttr.value}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                }

                return null;
              })()}

              {/* Event Explanation */}
              {transaction.tx_response.events && transaction.tx_response.events.length > 0 && (() => {
                // Helper function to explain each event type
                const explainEvent = (event: any, index: number) => {
                  const type = event.type;
                  const attrs = event.attributes || [];

                  switch (type) {
                    case "coin_spent":
                      const spender = attrs.find((a: any) => a.key === "spender")?.value;
                      const spentAmount = attrs.find((a: any) => a.key === "amount")?.value;
                      const isFee = index < 3; // First coin_spent is usually fee
                      return {
                        icon: "💸",
                        title: isFee ? "Transaction Fee Deducted" : "Payment Made",
                        description: isFee
                          ? `${spender?.substring(0, 20)}... paid ${spentAmount} in transaction fees to process this transaction on the blockchain.`
                          : `${spender?.substring(0, 20)}... paid ${spentAmount} for the game creation.`
                      };

                    case "coin_received":
                      const receiver = attrs.find((a: any) => a.key === "receiver")?.value;
                      const receivedAmount = attrs.find((a: any) => a.key === "amount")?.value;
                      const isFeeCollector = index < 3;
                      return {
                        icon: "💰",
                        title: isFeeCollector ? "Fee Collected" : "Payment Received",
                        description: isFeeCollector
                          ? `Fee collector (${receiver?.substring(0, 20)}...) received ${receivedAmount} in transaction fees.`
                          : `Poker module account (${receiver?.substring(0, 20)}...) received ${receivedAmount} as game creation payment.`
                      };

                    case "transfer":
                      const recipient = attrs.find((a: any) => a.key === "recipient")?.value;
                      const sender = attrs.find((a: any) => a.key === "sender")?.value;
                      const amount = attrs.find((a: any) => a.key === "amount")?.value;
                      return {
                        icon: "↔️",
                        title: "Transfer Recorded",
                        description: `Transfer of ${amount} from ${sender?.substring(0, 15)}... to ${recipient?.substring(0, 15)}... was recorded in the blockchain state.`
                      };

                    case "message":
                      const action = attrs.find((a: any) => a.key === "action")?.value;
                      const module = attrs.find((a: any) => a.key === "module")?.value;
                      if (action) {
                        return {
                          icon: "📨",
                          title: "Message Executed",
                          description: `The ${action.split(".").pop()} message was executed by the ${module || "blockchain"} module.`
                        };
                      }
                      return {
                        icon: "📨",
                        title: "Message Metadata",
                        description: "General message information recorded by the blockchain."
                      };

                    case "tx":
                      const fee = attrs.find((a: any) => a.key === "fee")?.value;
                      const signature = attrs.find((a: any) => a.key === "signature")?.value;
                      const accSeq = attrs.find((a: any) => a.key === "acc_seq")?.value;

                      if (fee) {
                        return {
                          icon: "💳",
                          title: "Transaction Fee Details",
                          description: `Total transaction fee: ${fee}. This covers the computational cost of processing and storing this transaction on the blockchain.`
                        };
                      }
                      if (signature) {
                        return {
                          icon: "🔐",
                          title: "Cryptographic Signature",
                          description: "Digital signature proving the transaction was authorized by the account owner's private key. This ensures authenticity and non-repudiation."
                        };
                      }
                      if (accSeq) {
                        return {
                          icon: "🔢",
                          title: "Account Sequence (Nonce)",
                          description: `Account sequence ${accSeq}. This incrementing number prevents replay attacks by ensuring each transaction can only be executed once.`
                        };
                      }
                      break;

                    case "game_created":
                      const gameId = attrs.find((a: any) => a.key === "game_id")?.value;
                      const gameType = attrs.find((a: any) => a.key === "game_type")?.value;
                      return {
                        icon: "🎮",
                        title: "Poker Game Created",
                        description: `A new ${gameType} poker game was created with ID ${gameId?.substring(0, 20)}... This is a custom event emitted by the poker module.`
                      };

                    case "player_joined_game":
                      const joinedGameId = attrs.find((a: any) => a.key === "game_id")?.value;
                      const player = attrs.find((a: any) => a.key === "player")?.value;
                      return {
                        icon: "🪑",
                        title: "Player Joined Game",
                        description: `Player ${player?.substring(0, 20)}... joined game ${joinedGameId?.substring(0, 20)}... This is a custom event emitted by the poker module.`
                      };

                    default:
                      return {
                        icon: "📋",
                        title: type,
                        description: `Custom blockchain event of type "${type}".`
                      };
                  }

                  return {
                    icon: "📋",
                    title: type,
                    description: "Blockchain event"
                  };
                };

                return (
                  <div className="mb-6">
                    <button
                      onClick={() => setShowEventExplanation(!showEventExplanation)}
                      className="flex items-center gap-2 text-lg font-bold transition-colors duration-200 mb-3"
                      style={{ color: colors.brand.primary }}
                      onMouseEnter={(e) => e.currentTarget.style.color = colors.accent.glow}
                      onMouseLeave={(e) => e.currentTarget.style.color = colors.brand.primary}
                    >
                      <span>{showEventExplanation ? "▼" : "▶"}</span>
                      <span>What do these {transaction.tx_response.events.length} events mean?</span>
                    </button>

                    {showEventExplanation && (
                      <div
                        className="p-5 rounded-lg mb-4"
                        style={{
                          backgroundColor: hexToRgba(colors.ui.bgMedium, 0.4),
                          border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                        }}
                      >
                        {/* Cosmos Events Primer */}
                        <div className="mb-6 pb-4" style={{ borderBottom: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}` }}>
                          <h4 className="text-lg font-bold text-white mb-3">📚 About Cosmos Blockchain Events</h4>
                          <div className="text-gray-300 text-sm space-y-2">
                            <p>
                              <strong style={{ color: colors.brand.primary }}>Events</strong> are records emitted during transaction execution that describe what happened.
                              They're stored on the blockchain and indexed for easy querying.
                            </p>
                            <p>
                              <strong style={{ color: colors.brand.primary }}>Standard SDK events</strong> (coin_spent, coin_received, transfer, message, tx)
                              are automatically emitted by the Cosmos SDK for all transactions.
                            </p>
                            <p>
                              <strong style={{ color: colors.brand.primary }}>Custom module events</strong> (game_created, player_joined_game)
                              are emitted by your custom poker module to track game-specific actions.
                            </p>
                            <p>
                              Events are crucial for block explorers, wallets, and applications to understand what happened in a transaction without parsing raw transaction data.
                            </p>
                          </div>
                        </div>

                        {/* Event-by-Event Breakdown */}
                        <h4 className="text-lg font-bold text-white mb-3">🔍 Event Breakdown</h4>
                        <div className="space-y-3">
                          {transaction.tx_response.events.map((event: any, index: number) => {
                            const explanation = explainEvent(event, index);
                            return (
                              <div
                                key={index}
                                className="p-3 rounded-lg"
                                style={{
                                  backgroundColor: hexToRgba(colors.ui.bgDark, 0.5),
                                  border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl">{explanation.icon}</span>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
                                      <h5 className="font-bold" style={{ color: colors.brand.primary }}>
                                        {explanation.title}
                                      </h5>
                                    </div>
                                    <p className="text-sm text-gray-300">{explanation.description}</p>
                                    <code className="text-xs text-gray-500 mt-1 block">Type: {event.type}</code>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Summary */}
                        <div
                          className="mt-5 p-4 rounded-lg"
                          style={{
                            backgroundColor: hexToRgba(colors.accent.success, 0.1),
                            border: `1px solid ${hexToRgba(colors.accent.success, 0.3)}`
                          }}
                        >
                          <h5 className="font-bold mb-2" style={{ color: colors.accent.success }}>Summary</h5>
                          <p className="text-sm text-gray-300">
                            This transaction executed successfully with {transaction.tx_response.events.length} events emitted.
                            The blockchain recorded fee payments, state changes, and custom poker game events.
                            All events are permanently stored and indexed for future queries.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Events */}
              {transaction.tx_response.events && transaction.tx_response.events.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Raw Events Data ({transaction.tx_response.events.length})
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
