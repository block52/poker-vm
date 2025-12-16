import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { NETWORK_PRESETS } from "../context/NetworkContext";
import { AnimatedBackground } from "../components/common/AnimatedBackground";
import { ExplorerHeader } from "../components/explorer/ExplorerHeader";

interface NodeStatus {
    name: string;
    online: boolean;
    blockHeight: string | null;
    chainId: string | null;
    lastBlockTime: string | null;
    genesisTime: string | null;
    loading: boolean;
    error: string | null;
}

function formatBlockTime(time: string): string {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ago`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s ago`;
    }
    return `${seconds}s ago`;
}

function formatUptime(genesisTime: string): string {
    const genesis = new Date(genesisTime);
    const now = new Date();
    const diff = now.getTime() - genesis.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const years = Math.floor(days / 365);

    if (years > 0) {
        const remainingDays = days % 365;
        return `${years}y ${remainingDays}d`;
    } else if (weeks > 0) {
        const remainingDays = days % 7;
        return `${weeks}w ${remainingDays}d`;
    } else if (days > 0) {
        return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m`;
    }
    return `${seconds}s`;
}

// Filter out localhost for production view - defined outside component to avoid recreation
const productionNodes = NETWORK_PRESETS.filter(n => n.name !== "Localhost");

export default function NodesPage() {
    const [nodeStatuses, setNodeStatuses] = useState<NodeStatus[]>([]);

    const fetchAllNodeStatuses = useCallback(async () => {
        // Set all to loading
        setNodeStatuses(productionNodes.map(n => ({
            name: n.name,
            online: false,
            blockHeight: null,
            chainId: null,
            lastBlockTime: null,
            genesisTime: null,
            loading: true,
            error: null
        })));

        // Fetch all in parallel
        const results = await Promise.all(
            productionNodes.map(async (network): Promise<NodeStatus> => {
                try {
                    // Fetch latest block and genesis block (block 1) in parallel
                    const [latestRes, genesisRes] = await Promise.all([
                        fetch(
                            `${network.rest}/cosmos/base/tendermint/v1beta1/blocks/latest`,
                            { signal: AbortSignal.timeout(10000) }
                        ),
                        fetch(
                            `${network.rest}/cosmos/base/tendermint/v1beta1/blocks/1`,
                            { signal: AbortSignal.timeout(10000) }
                        )
                    ]);

                    if (!latestRes.ok) {
                        return {
                            name: network.name,
                            online: false,
                            blockHeight: null,
                            chainId: null,
                            lastBlockTime: null,
                            genesisTime: null,
                            loading: false,
                            error: `HTTP ${latestRes.status}`
                        };
                    }

                    const latestData = await latestRes.json();
                    const latestHeader = latestData.block?.header || latestData.sdk_block?.header;

                    // Get genesis time from block 1
                    let genesisTime: string | null = null;
                    if (genesisRes.ok) {
                        const genesisData = await genesisRes.json();
                        const genesisHeader = genesisData.block?.header || genesisData.sdk_block?.header;
                        genesisTime = genesisHeader?.time || null;
                    }

                    return {
                        name: network.name,
                        online: true,
                        blockHeight: latestHeader?.height || null,
                        chainId: latestHeader?.chain_id || null,
                        lastBlockTime: latestHeader?.time || null,
                        genesisTime,
                        loading: false,
                        error: null
                    };
                } catch (err: any) {
                    return {
                        name: network.name,
                        online: false,
                        blockHeight: null,
                        chainId: null,
                        lastBlockTime: null,
                        genesisTime: null,
                        loading: false,
                        error: err.message || "Connection failed"
                    };
                }
            })
        );

        setNodeStatuses(results);
    }, []);

    useEffect(() => {
        document.title = "Nodes - Block52";
        fetchAllNodeStatuses();

        // Auto-refresh every 15 seconds
        const interval = setInterval(fetchAllNodeStatuses, 15000);
        return () => clearInterval(interval);
    }, [fetchAllNodeStatuses]);

    return (
        <div className="min-h-screen p-8 relative">
            <AnimatedBackground />
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <ExplorerHeader
                    title="Network Nodes"
                />

                {/* Nodes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {productionNodes.map((network) => {
                        const status = nodeStatuses.find(s => s.name === network.name);
                        const isLoading = status?.loading ?? true;
                        const isOnline = status?.online ?? false;

                        return (
                            <Link
                                key={network.name}
                                to={`/node/${encodeURIComponent(network.name)}`}
                                className="block"
                            >
                                <div className={`bg-gray-800 border rounded-lg overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] ${
                                    isOnline ? "border-green-700 hover:border-green-500" : "border-gray-700 hover:border-gray-600"
                                }`}>
                                    {/* Node Header */}
                                    <div className={`p-4 ${isOnline ? "bg-green-900/20" : "bg-gray-900/50"} border-b border-gray-700`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${
                                                    isLoading
                                                        ? "bg-yellow-500 animate-pulse"
                                                        : isOnline
                                                            ? "bg-green-500 animate-pulse"
                                                            : "bg-red-500"
                                                }`} />
                                                <h3 className="text-lg font-semibold text-white">{network.name}</h3>
                                            </div>
                                            <span className={`text-sm font-medium px-2 py-1 rounded ${
                                                isLoading
                                                    ? "bg-yellow-900/50 text-yellow-400"
                                                    : isOnline
                                                        ? "bg-green-900/50 text-green-400"
                                                        : "bg-red-900/50 text-red-400"
                                            }`}>
                                                {isLoading ? "Checking..." : isOnline ? "Online" : "Offline"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Node Details */}
                                    <div className="p-4 space-y-3">
                                        {/* Block Height */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm">Block Height</span>
                                            <span className="text-white font-mono">
                                                {isLoading ? (
                                                    <span className="text-gray-500">Loading...</span>
                                                ) : status?.blockHeight ? (
                                                    `#${parseInt(status.blockHeight).toLocaleString()}`
                                                ) : (
                                                    <span className="text-gray-500">N/A</span>
                                                )}
                                            </span>
                                        </div>

                                        {/* Last Block */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm">Last Block</span>
                                            <span className="text-white text-sm">
                                                {isLoading ? (
                                                    <span className="text-gray-500">Loading...</span>
                                                ) : status?.lastBlockTime ? (
                                                    formatBlockTime(status.lastBlockTime)
                                                ) : (
                                                    <span className="text-gray-500">N/A</span>
                                                )}
                                            </span>
                                        </div>

                                        {/* Chain Uptime */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm">Running</span>
                                            <span className="text-green-400 text-sm font-medium">
                                                {isLoading ? (
                                                    <span className="text-gray-500">Loading...</span>
                                                ) : status?.genesisTime ? (
                                                    formatUptime(status.genesisTime)
                                                ) : (
                                                    <span className="text-gray-500">N/A</span>
                                                )}
                                            </span>
                                        </div>

                                        {/* Chain ID */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm">Chain ID</span>
                                            <span className="text-white font-mono text-sm">
                                                {isLoading ? (
                                                    <span className="text-gray-500">Loading...</span>
                                                ) : status?.chainId ? (
                                                    status.chainId
                                                ) : (
                                                    <span className="text-gray-500">N/A</span>
                                                )}
                                            </span>
                                        </div>

                                        {/* Error */}
                                        {status?.error && !isOnline && (
                                            <div className="pt-2 border-t border-gray-700">
                                                <span className="text-red-400 text-xs">{status.error}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* View Details Footer */}
                                    <div className="px-4 py-3 bg-gray-900/50 border-t border-gray-700">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 font-mono text-xs truncate max-w-[200px]">
                                                {network.rest}
                                            </span>
                                            <span className="text-blue-400 flex items-center gap-1">
                                                View Details
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Refresh Button */}
                <div className="mt-8 text-center">
                    <button
                        onClick={fetchAllNodeStatuses}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh All
                    </button>
                </div>

                {/* Powered by Block52 */}
                <div className="fixed bottom-4 left-4 flex items-center z-10 opacity-30">
                    <div className="flex flex-col items-start bg-transparent px-3 py-2 rounded-lg backdrop-blur-sm border-0">
                        <div className="text-left mb-1">
                            <span className="text-xs text-white font-medium tracking-wide">POWERED BY</span>
                        </div>
                        <img src="/block52.png" alt="Block52 Logo" className="h-6 w-auto object-contain interaction-none" />
                    </div>
                </div>
            </div>
        </div>
    );
}
