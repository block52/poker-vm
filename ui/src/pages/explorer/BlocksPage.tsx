import { useState, useEffect, useMemo, useCallback } from "react";
import { getCosmosClient, clearCosmosClient } from "../../utils/cosmos/client";
import { colors, hexToRgba } from "../../utils/colorConfig";
import { useNetwork } from "../../context/NetworkContext";
import { NetworkSelector } from "../../components/NetworkSelector";

// Types from CosmosClient
interface CosmosBlock {
    block_id: {
        hash: string;
    };
    block: {
        header: {
            height: string;
            time: string;
            chain_id: string;
            proposer_address: string;
        };
        data: {
            txs: string[]; // Base64 encoded transactions
        };
    };
}

export default function BlocksPage() {
    const [blocks, setBlocks] = useState<CosmosBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { currentNetwork } = useNetwork();

    const fetchBlocks = useCallback(async () => {
        try {
            setLoading(true);
            const cosmosClient = getCosmosClient({
                rpc: currentNetwork.rpc,
                rest: currentNetwork.rest
            });

            if (!cosmosClient) {
                throw new Error("Cosmos client not initialized.");
            }

            const recentBlocks = await cosmosClient.getLatestBlocks(50);
            setBlocks(recentBlocks);
            setError(null);
        } catch (err: any) {
            // Provide detailed, network-specific error messages
            let errorMessage = "Failed to fetch blocks";
            let suggestion = "";

            // Determine error type and provide helpful guidance
            if (err.message?.includes("timeout")) {
                errorMessage = "Request timeout after 10 seconds";
                if (currentNetwork.name === "Localhost") {
                    suggestion = " - Check if 'ignite chain serve' is running";
                } else {
                    suggestion = " - Production network may be slow. Try localhost for development or retry in a moment";
                }
            } else if (err.code === "ERR_NETWORK" || err.message?.includes("ECONNREFUSED")) {
                errorMessage = `Cannot connect to ${currentNetwork.name}`;
                if (currentNetwork.name === "Localhost") {
                    suggestion = " - Run 'ignite chain serve' in the pokerchain directory";
                } else {
                    suggestion = " - Network may be down. Try selecting a different network";
                }
            } else if (err.response) {
                errorMessage = `Server error: ${err.response.status} - ${err.response.statusText}`;
                suggestion = " - The node may be restarting or under maintenance";
            } else if (err.message) {
                errorMessage = err.message;
            }

            const fullMessage = errorMessage + suggestion;

            // Graceful degradation: Keep old blocks if we have cached data
            if (blocks.length > 0) {
                setError(`⚠️ Network unavailable - showing cached data. ${fullMessage}`);
                console.warn("Using cached block data due to fetch error:", err);
            } else {
                setError(fullMessage);
                console.error("Error fetching blocks:", err);
            }
        } finally {
            setLoading(false);
        }
    }, [currentNetwork, blocks.length]);

    useEffect(() => {
        // Set page title
        document.title = "Block Explorer - Block52 Chain";

        // Clear client when network changes to force re-initialization
        clearCosmosClient();

        // Initial fetch
        fetchBlocks();

        // Auto-refresh every 10 seconds (reduced frequency to minimize re-renders)
        const interval = setInterval(fetchBlocks, 10000);

        return () => {
            clearInterval(interval);
            // Reset title when component unmounts
            document.title = "Block52 Chain";
        };
    }, [currentNetwork, fetchBlocks]);

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

    // Memoized styles
    const containerStyle = useMemo(
        () => ({
            backgroundColor: hexToRgba(colors.ui.bgDark, 0.8),
            border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
        }),
        []
    );

    const headerStyle = useMemo(
        () => ({
            background: `linear-gradient(135deg, ${hexToRgba(colors.brand.primary, 0.2)} 0%, ${hexToRgba(colors.brand.secondary, 0.2)} 100%)`,
            borderBottom: `2px solid ${hexToRgba(colors.brand.primary, 0.3)}`
        }),
        []
    );

    if (loading && blocks.length === 0) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-[#2c3245]">
                <div className="backdrop-blur-md p-8 rounded-xl shadow-2xl text-center" style={containerStyle}>
                    <div className="flex justify-center mb-4">
                        <svg
                            className="animate-spin h-10 w-10"
                            style={{ color: colors.brand.primary }}
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
                    </div>
                    <h2 className="text-2xl font-bold text-white">Loading blocks...</h2>
                </div>
            </div>
        );
    }

    if (error && blocks.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center relative overflow-hidden bg-[#2c3245] p-6">
                <div className="w-full max-w-7xl">
                    {/* Header with Network Selector */}
                    <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl mb-6 relative z-40" style={containerStyle}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-4xl font-extrabold text-white mb-2">Block Explorer</h1>
                                <p className="text-gray-300">Latest blocks on Pokerchain</p>
                            </div>
                            <NetworkSelector />
                        </div>
                    </div>

                    {/* Error Card */}
                    <div className="flex justify-center">
                        <div className="backdrop-blur-md p-8 rounded-xl shadow-2xl text-center max-w-lg" style={containerStyle}>
                            <div className="flex justify-center mb-4">
                                <svg className="h-16 w-16" style={{ color: colors.accent.danger }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">Error: {error}</h2>
                            <p className="text-gray-300 mb-4">Make sure your Cosmos blockchain is running</p>
                            <p className="text-sm text-gray-400 mb-6">Try selecting a different network from the dropdown above</p>

                            {/* Retry Button */}
                            <button
                                onClick={() => fetchBlocks()}
                                disabled={loading}
                                className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: hexToRgba(colors.brand.primary, 0.2),
                                    border: `1px solid ${colors.brand.primary}`,
                                    color: colors.brand.primary
                                }}
                                onMouseEnter={e => {
                                    if (!loading) {
                                        e.currentTarget.style.backgroundColor = hexToRgba(colors.brand.primary, 0.3);
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = hexToRgba(colors.brand.primary, 0.2);
                                }}
                            >
                                {loading ? "Retrying..." : "🔄 Retry Connection"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center relative overflow-hidden bg-[#2c3245] p-6">
            <div className="w-full max-w-7xl">
                {/* Header Card */}
                <div className="backdrop-blur-md p-6 rounded-xl shadow-2xl mb-6 relative z-40" style={containerStyle}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-extrabold text-white mb-2">Block Explorer</h1>
                            <p className="text-gray-300">Latest blocks on Pokerchain</p>
                            <div className="mt-3 flex gap-4">
                                <a href="/explorer/distribution" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                                    📊 Card Distribution Analytics
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ backgroundColor: hexToRgba(colors.ui.bgDark, 0.6) }}>
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.accent.success }}></div>
                                <span className="text-sm text-gray-300">{blocks.length} blocks</span>
                            </div>
                            <NetworkSelector />
                        </div>
                    </div>
                </div>

                {/* Blocks Table Card */}
                <div className="backdrop-blur-md rounded-xl shadow-2xl overflow-hidden" style={containerStyle}>
                    <div className="overflow-x-auto">
                        <table className="w-full" style={{ fontSize: "14px" }}>
                            <thead>
                                <tr style={headerStyle}>
                                    <th className="px-6 py-4 text-left text-white font-bold">Height</th>
                                    <th className="px-6 py-4 text-left text-white font-bold">Block Hash</th>
                                    <th className="px-6 py-4 text-left text-white font-bold">Transactions</th>
                                    <th className="px-6 py-4 text-left text-white font-bold">Proposer</th>
                                    <th className="px-6 py-4 text-left text-white font-bold">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blocks.map((block, index) => (
                                    <tr
                                        key={block.block.header.height}
                                        className="transition-colors duration-200 hover:bg-opacity-50"
                                        style={{
                                            borderBottom: index < blocks.length - 1 ? `1px solid ${hexToRgba(colors.brand.primary, 0.1)}` : "none",
                                            backgroundColor: "transparent"
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = hexToRgba(colors.brand.primary, 0.05))}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                                    >
                                        <td className="px-6 py-4 font-bold" style={{ color: colors.brand.primary }}>
                                            #{block.block.header.height}
                                        </td>
                                        <td className="px-6 py-4">
                                            <a
                                                href={`/explorer/block/${block.block.header.height}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-mono text-xs cursor-pointer transition-colors duration-200 break-all block"
                                                style={{ color: colors.brand.primary }}
                                                onMouseEnter={e => (e.currentTarget.style.color = colors.accent.glow)}
                                                onMouseLeave={e => (e.currentTarget.style.color = colors.brand.primary)}
                                                title="Click to view block details in new tab"
                                            >
                                                {block.block_id.hash}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            {block.block.data.txs.length === 0 ? (
                                                <span className="text-gray-400">0 txs</span>
                                            ) : (
                                                <span className="font-bold" style={{ color: colors.accent.success }}>
                                                    {block.block.data.txs.length} tx{block.block.data.txs.length > 1 ? "s" : ""}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-300" title={block.block.header.proposer_address}>
                                            {truncateHash(block.block.header.proposer_address)}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400">{formatTimestamp(block.block.header.time)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div
                        className="backdrop-blur-md p-4 rounded-xl shadow-2xl mt-6"
                        style={{
                            backgroundColor: hexToRgba(colors.accent.danger, 0.2),
                            border: `1px solid ${hexToRgba(colors.accent.danger, 0.5)}`
                        }}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <svg
                                    className="h-6 w-6 flex-shrink-0"
                                    style={{ color: colors.accent.danger }}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-white font-semibold">Error: {error}</span>
                            </div>

                            {/* Retry Button */}
                            <button
                                onClick={() => fetchBlocks()}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                style={{
                                    backgroundColor: hexToRgba(colors.brand.primary, 0.2),
                                    border: `1px solid ${colors.brand.primary}`,
                                    color: colors.brand.primary
                                }}
                                onMouseEnter={e => {
                                    if (!loading) {
                                        e.currentTarget.style.backgroundColor = hexToRgba(colors.brand.primary, 0.3);
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = hexToRgba(colors.brand.primary, 0.2);
                                }}
                            >
                                {loading ? "⏳" : "🔄 Retry"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
