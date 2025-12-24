import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { NETWORK_PRESETS, NetworkEndpoints } from "../context/NetworkContext";
import { AnimatedBackground } from "../components/common/AnimatedBackground";
import { ExplorerHeader } from "../components/explorer/ExplorerHeader";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import {
    DiscoveredNode,
    discoverNodes,
    getCachedNodes,
    cacheNodes,
    clearNodeCache
} from "../services/nodeDiscovery";

// Filter out localhost for production view
const productionNodes = NETWORK_PRESETS.filter(n => n.name !== "Localhost");

interface NodeInfo {
    status: "checking" | "online" | "offline";
    blockHeight: string | null;
}

export default function NodesPage() {
    const [discoveredNodes, setDiscoveredNodes] = useState<DiscoveredNode[]>([]);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [nodeInfo, setNodeInfo] = useState<Record<string, NodeInfo>>({});

    // Check node status and get block height
    const checkNode = useCallback(async (network: NetworkEndpoints): Promise<NodeInfo> => {
        try {
            const response = await fetch(
                `${network.rest}/cosmos/base/tendermint/v1beta1/blocks/latest`,
                { signal: AbortSignal.timeout(5000) }
            );
            if (!response.ok) {
                return { status: "offline", blockHeight: null };
            }
            const data = await response.json();
            const header = data.block?.header || data.sdk_block?.header;
            return {
                status: "online",
                blockHeight: header?.height || null
            };
        } catch {
            return { status: "offline", blockHeight: null };
        }
    }, []);

    // Check all nodes on page load
    const checkAllNodes = useCallback(async () => {
        // Set all to checking
        const initialInfo: Record<string, NodeInfo> = {};
        productionNodes.forEach(n => {
            initialInfo[n.name] = { status: "checking", blockHeight: null };
        });
        setNodeInfo(initialInfo);

        // Check each node in parallel
        const results = await Promise.all(
            productionNodes.map(async (network) => {
                const info = await checkNode(network);
                return { name: network.name, info };
            })
        );

        // Update info
        const newInfo: Record<string, NodeInfo> = {};
        results.forEach(r => {
            newInfo[r.name] = r.info;
        });
        setNodeInfo(newInfo);
    }, [checkNode]);

    // Discover new nodes from the network
    const handleDiscoverNodes = useCallback(async () => {
        setIsDiscovering(true);
        clearNodeCache();

        try {
            const discovered = await discoverNodes(productionNodes, productionNodes);

            // Filter out nodes that match presets
            const newDiscovered = discovered.filter(d => !d.isPreset);

            setDiscoveredNodes(newDiscovered);
            cacheNodes(newDiscovered);
        } catch (error) {
            console.error("Failed to discover nodes:", error);
        } finally {
            setIsDiscovering(false);
        }
    }, []);

    // Load cached discovered nodes on mount
    useEffect(() => {
        const cached = getCachedNodes();
        if (cached) {
            setDiscoveredNodes(cached.filter(n => !n.isPreset));
        }
    }, []);

    useEffect(() => {
        document.title = "Nodes - Block52";
        checkAllNodes();
    }, [checkAllNodes]);

    // Combine preset and discovered nodes for display
    const allNodes = [
        ...productionNodes.map(n => ({ ...n, isDiscovered: false })),
        ...discoveredNodes.filter(d => d.endpoints).map(d => ({
            ...d.endpoints!,
            isDiscovered: true
        }))
    ];

    return (
        <div className="min-h-screen p-8 relative">
            <AnimatedBackground />
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <ExplorerHeader title="Network Nodes" />

                {/* Action Bar */}
                <div className="mb-6 flex justify-end">
                    <button
                        onClick={handleDiscoverNodes}
                        disabled={isDiscovering}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
                    >
                        {isDiscovering ? (
                            <>
                                <LoadingSpinner size="sm" />
                                Discovering...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Discover Nodes
                            </>
                        )}
                    </button>
                </div>

                {/* Nodes Table */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 tracking-wider">Block Height</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 tracking-wider">Endpoint</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {allNodes.map((network) => {
                                    const isDiscovered = network.isDiscovered;
                                    const info = nodeInfo[network.name];
                                    const status = info?.status || "checking";
                                    const blockHeight = info?.blockHeight;

                                    return (
                                        <tr
                                            key={`${network.name}-${isDiscovered ? 'discovered' : 'preset'}`}
                                            className="hover:bg-gray-700/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-white font-semibold">{network.name}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    status === "checking"
                                                        ? "bg-yellow-900/50 text-yellow-400"
                                                        : status === "online"
                                                            ? "bg-green-900/50 text-green-400"
                                                            : "bg-red-900/50 text-red-400"
                                                }`}>
                                                    {status === "checking" ? "Checking..." : status === "online" ? "Online" : "Offline"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {status === "checking" ? (
                                                    <span className="text-gray-500">-</span>
                                                ) : blockHeight ? (
                                                    <span className="text-blue-400 font-mono">#{parseInt(blockHeight).toLocaleString()}</span>
                                                ) : (
                                                    <span className="text-gray-500">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs text-gray-400">
                                                    {network.rest}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {!isDiscovered && (
                                                    <Link
                                                        to={`/node/${encodeURIComponent(network.name)}`}
                                                        className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors inline-flex items-center gap-1"
                                                    >
                                                        View Details
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Empty state for discovered nodes */}
                {discoveredNodes.length === 0 && (
                    <div className="mt-8 text-center py-8 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-gray-400 mb-2">No additional nodes discovered yet</p>
                        <p className="text-gray-500 text-sm">Click "Discover Nodes" to search for peers on the network</p>
                    </div>
                )}

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
