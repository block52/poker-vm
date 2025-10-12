import { useState, useEffect } from "react";
import { cosmosApi, CosmosBlock } from "../services/cosmosApi";
import { Link } from "react-router-dom";

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<CosmosBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        setLoading(true);
        const recentBlocks = await cosmosApi.getRecentBlocks(20);
        setBlocks(recentBlocks);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to fetch blocks");
        console.error("Error fetching blocks:", err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchBlocks();

    // Auto-refresh every 2 seconds
    const interval = setInterval(fetchBlocks, 2000);

    return () => clearInterval(interval);
  }, []);

  const truncateHash = (hash: string) => {
    if (!hash) return "N/A";
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hours ago`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading && blocks.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Loading blocks...</h2>
      </div>
    );
  }

  if (error && blocks.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
        <h2>Error: {error}</h2>
        <p>Make sure your Cosmos blockchain is running at http://localhost:1317</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Latest Blocks on Pokerchain</h1>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Auto-refreshing every 2 seconds... {blocks.length} blocks loaded
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>Height</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Block Hash</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Transactions</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Proposer</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => (
              <tr
                key={block.block.header.height}
                style={{ borderBottom: "1px solid #eee" }}
              >
                <td style={{ padding: "12px", fontWeight: "bold" }}>
                  #{block.block.header.height}
                </td>
                <td
                  style={{
                    padding: "12px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    cursor: "pointer",
                    color: "#0066cc",
                  }}
                  onClick={() => copyToClipboard(block.block_id.hash)}
                  title="Click to copy full hash"
                >
                  {truncateHash(block.block_id.hash)}
                </td>
                <td style={{ padding: "12px" }}>
                  {block.block.data.txs.length === 0 ? (
                    <span style={{ color: "#999" }}>0 txs</span>
                  ) : (
                    <span style={{ color: "#00aa00", fontWeight: "bold" }}>
                      {block.block.data.txs.length} tx
                      {block.block.data.txs.length > 1 ? "s" : ""}
                    </span>
                  )}
                </td>
                <td
                  style={{
                    padding: "12px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                  }}
                  title={block.block.header.proposer_address}
                >
                  {truncateHash(block.block.header.proposer_address)}
                </td>
                <td style={{ padding: "12px", fontSize: "12px", color: "#666" }}>
                  {formatTimestamp(block.block.header.time)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            backgroundColor: "#fee",
            border: "1px solid #fcc",
            borderRadius: "4px",
            color: "#c00",
          }}
        >
          Error: {error}
        </div>
      )}
    </div>
  );
}
