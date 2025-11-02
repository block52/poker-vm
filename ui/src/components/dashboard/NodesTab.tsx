import React, { useState } from "react";
import { colors, hexToRgba } from "../../utils/colorConfig";
import CosmosStatus from "../cosmos/CosmosStatus";

interface Node {
    id: string;
    name: string;
    type: "cosmos" | "ethereum" | "block52";
    status: "online" | "offline" | "syncing";
    url: string;
    latency?: number;
    blockHeight?: number;
    peers?: number;
    version?: string;
}

interface NodesTabProps {
    className?: string;
}

export const NodesTab: React.FC<NodesTabProps> = ({ className = "" }) => {
    const [nodes, setNodes] = useState<Node[]>([
        {
            id: "cosmos-1",
            name: "Cosmos RPC Node",
            type: "cosmos",
            status: "online",
            url: "http://localhost:26657",
            latency: 42,
            blockHeight: 1250843,
            peers: 24,
            version: "v0.47.5"
        },
        {
            id: "block52-1",
            name: "Block52 Gaming Node",
            type: "block52",
            status: "online",
            url: "http://localhost:1317",
            latency: 28,
            blockHeight: 1250843,
            peers: 8,
            version: "v1.0.0"
        },
        {
            id: "ethereum-1",
            name: "Base Mainnet",
            type: "ethereum",
            status: "online",
            url: "https://mainnet.base.org",
            latency: 125,
            blockHeight: 8453000,
            peers: 156,
            version: "go1.21.0"
        }
    ]);
    const [refreshing, setRefreshing] = useState(false);

    const getStatusColor = (status: Node["status"]) => {
        switch (status) {
            case "online":
                return colors.accent.success;
            case "offline":
                return colors.accent.danger;
            case "syncing":
                return colors.accent.warning;
            default:
                return colors.ui.textSecondary;
        }
    };

    const getStatusIcon = (status: Node["status"]) => {
        switch (status) {
            case "online":
                return (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                    </svg>
                );
            case "offline":
                return (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                );
            case "syncing":
                return (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getTypeIcon = (type: Node["type"]) => {
        switch (type) {
            case "cosmos":
                return (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                        <circle cx="12" cy="12" r="3" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                        <circle cx="5" cy="12" r="1" />
                        <circle cx="19" cy="12" r="1" />
                    </svg>
                );
            case "ethereum":
                return (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
                    </svg>
                );
            case "block52":
                return (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                        />
                    </svg>
                );
        }
    };

    const refreshNodes = async () => {
        setRefreshing(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simulate updating node data
        setNodes(prevNodes =>
            prevNodes.map(node => ({
                ...node,
                latency: Math.floor(Math.random() * 200) + 20,
                blockHeight: node.blockHeight ? node.blockHeight + Math.floor(Math.random() * 5) : undefined,
                peers: node.peers ? Math.floor(Math.random() * 50) + 10 : undefined
            }))
        );

        setRefreshing(false);
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header with Cosmos Status */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <svg className="w-6 h-6" style={{ color: colors.brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                        />
                    </svg>
                    Blockchain Nodes
                </h2>
                <div className="flex items-center gap-4">
                    <CosmosStatus />
                    <button
                        onClick={refreshNodes}
                        disabled={refreshing}
                        className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-300 flex items-center gap-2"
                    >
                        <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>
            </div>

            {/* Nodes Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {nodes.map(node => (
                    <div
                        key={node.id}
                        className="backdrop-blur-sm p-5 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
                        style={{
                            backgroundColor: hexToRgba(colors.ui.bgMedium, 0.9),
                            border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.2);
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.1);
                        }}
                    >
                        {/* Node Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{
                                        backgroundColor: hexToRgba(colors.brand.primary, 0.2),
                                        color: colors.brand.primary
                                    }}
                                >
                                    {getTypeIcon(node.type)}
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-sm">{node.name}</h3>
                                    <p className="text-gray-400 text-xs capitalize">{node.type} Node</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span style={{ color: getStatusColor(node.status) }}>{getStatusIcon(node.status)}</span>
                                <span className="text-xs font-medium capitalize" style={{ color: getStatusColor(node.status) }}>
                                    {node.status}
                                </span>
                            </div>
                        </div>

                        {/* Node Stats */}
                        <div className="space-y-3">
                            {/* URL */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs">Endpoint:</span>
                                <span className="text-white text-xs font-mono truncate max-w-32" title={node.url}>
                                    {node.url}
                                </span>
                            </div>

                            {/* Latency */}
                            {node.latency && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-xs">Latency:</span>
                                    <span
                                        className="text-xs font-medium"
                                        style={{
                                            color: node.latency < 50 ? colors.accent.success : node.latency < 100 ? colors.accent.warning : colors.accent.danger
                                        }}
                                    >
                                        {node.latency}ms
                                    </span>
                                </div>
                            )}

                            {/* Block Height */}
                            {node.blockHeight && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-xs">Block Height:</span>
                                    <span className="text-white text-xs font-mono">{node.blockHeight.toLocaleString()}</span>
                                </div>
                            )}

                            {/* Peers */}
                            {node.peers && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-xs">Peers:</span>
                                    <span className="text-white text-xs">{node.peers}</span>
                                </div>
                            )}

                            {/* Version */}
                            {node.version && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-xs">Version:</span>
                                    <span className="text-white text-xs font-mono">{node.version}</span>
                                </div>
                            )}
                        </div>

                        {/* Connection Status Bar */}
                        <div className="mt-4 pt-3 border-t" style={{ borderColor: hexToRgba(colors.brand.primary, 0.1) }}>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: hexToRgba(colors.ui.bgDark, 0.5) }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: node.status === "online" ? "100%" : node.status === "syncing" ? "60%" : "0%",
                                            backgroundColor: getStatusColor(node.status)
                                        }}
                                    />
                                </div>
                                <span className="text-xs font-medium" style={{ color: getStatusColor(node.status) }}>
                                    {node.status === "online" ? "Connected" : node.status === "syncing" ? "Syncing" : "Disconnected"}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Network Summary */}
            <div
                className="backdrop-blur-sm p-5 rounded-xl shadow-lg"
                style={{
                    backgroundColor: hexToRgba(colors.ui.bgMedium, 0.9),
                    border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                }}
            >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" style={{ color: colors.brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                    </svg>
                    Network Overview
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold mb-1" style={{ color: colors.accent.success }}>
                            {nodes.filter(n => n.status === "online").length}
                        </div>
                        <div className="text-gray-400 text-sm">Online Nodes</div>
                    </div>

                    <div className="text-center">
                        <div className="text-2xl font-bold mb-1" style={{ color: colors.brand.primary }}>
                            {Math.round(nodes.reduce((acc, n) => acc + (n.latency || 0), 0) / nodes.length)}ms
                        </div>
                        <div className="text-gray-400 text-sm">Avg Latency</div>
                    </div>

                    <div className="text-center">
                        <div className="text-2xl font-bold mb-1" style={{ color: colors.accent.glow }}>
                            {nodes.reduce((acc, n) => acc + (n.peers || 0), 0)}
                        </div>
                        <div className="text-gray-400 text-sm">Total Peers</div>
                    </div>

                    <div className="text-center">
                        <div className="text-2xl font-bold mb-1" style={{ color: colors.brand.primary }}>
                            {new Set(nodes.map(n => n.type)).size}
                        </div>
                        <div className="text-gray-400 text-sm">Network Types</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NodesTab;
