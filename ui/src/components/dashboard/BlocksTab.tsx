import React, { useState, useEffect } from "react";
import { colors, hexToRgba } from "../../utils/colorConfig";
import { formatAddress } from "../common/utils";

interface Block {
    height: number;
    hash: string;
    timestamp: string;
    proposer: string;
    txCount: number;
    size: number; // in bytes
    gasUsed?: number;
    gasLimit?: number;
}

interface Transaction {
    hash: string;
    type: string;
    from: string;
    to?: string;
    amount?: string;
    fee: string;
    status: "success" | "failed" | "pending";
}

interface BlocksTabProps {
    className?: string;
}

export const BlocksTab: React.FC<BlocksTabProps> = ({ className = "" }) => {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Mock data generation
    const generateMockBlocks = (): Block[] => {
        const baseHeight = 1250843;
        const now = Date.now();

        return Array.from({ length: 10 }, (_, i) => ({
            height: baseHeight - i,
            hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            timestamp: new Date(now - i * 6000).toISOString(), // 6 seconds per block
            proposer: `cosmos1${Math.random().toString(36).substr(2, 38)}`,
            txCount: Math.floor(Math.random() * 50),
            size: Math.floor(Math.random() * 100000) + 10000,
            gasUsed: Math.floor(Math.random() * 1000000) + 100000,
            gasLimit: 2000000
        }));
    };

    const generateMockTransactions = (_blockHeight: number): Transaction[] => {
        return Array.from({ length: Math.floor(Math.random() * 10) + 1 }, () => ({
            hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            type: ["transfer", "delegate", "vote", "swap"][Math.floor(Math.random() * 4)],
            from: `cosmos1${Math.random().toString(36).substr(2, 38)}`,
            to: Math.random() > 0.3 ? `cosmos1${Math.random().toString(36).substr(2, 38)}` : undefined,
            amount: Math.random() > 0.5 ? `${(Math.random() * 1000).toFixed(2)} b52USD` : undefined,
            fee: `${(Math.random() * 0.1).toFixed(4)} b52USD`,
            status: ["success", "failed", "pending"][Math.floor(Math.random() * 3)] as Transaction["status"]
        }));
    };

    useEffect(() => {
        setBlocks(generateMockBlocks());
    }, []);

    const refreshBlocks = async () => {
        setRefreshing(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setBlocks(generateMockBlocks());
        setRefreshing(false);
    };

    const handleBlockClick = async (block: Block) => {
        setSelectedBlock(block);
        setLoading(true);

        // Simulate loading transactions
        await new Promise(resolve => setTimeout(resolve, 500));
        setTransactions(generateMockTransactions(block.height));
        setLoading(false);
    };

    const getStatusColor = (status: Transaction["status"]) => {
        switch (status) {
            case "success":
                return colors.accent.success;
            case "failed":
                return colors.accent.danger;
            case "pending":
                return colors.accent.warning;
            default:
                return colors.ui.textSecondary;
        }
    };

    const formatTimeAgo = (timestamp: string) => {
        const now = Date.now();
        const blockTime = new Date(timestamp).getTime();
        const diffInSeconds = Math.floor((now - blockTime) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <svg className="w-6 h-6" style={{ color: colors.brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                    </svg>
                    Recent Blocks
                </h2>
                <button
                    onClick={refreshBlocks}
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

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Blocks List */}
                <div
                    className="backdrop-blur-sm p-5 rounded-xl shadow-lg"
                    style={{
                        backgroundColor: hexToRgba(colors.ui.bgMedium, 0.9),
                        border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                    }}
                >
                    <h3 className="text-lg font-bold text-white mb-4">Latest Blocks</h3>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {blocks.map(block => (
                            <div
                                key={block.height}
                                onClick={() => handleBlockClick(block)}
                                className={`p-3 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md ${
                                    selectedBlock?.height === block.height ? "ring-2" : ""
                                }`}
                                style={{
                                    backgroundColor:
                                        selectedBlock?.height === block.height ? hexToRgba(colors.brand.primary, 0.1) : hexToRgba(colors.ui.bgDark, 0.6),
                                    border: `1px solid ${selectedBlock?.height === block.height ? colors.brand.primary : hexToRgba(colors.brand.primary, 0.1)}`
                                }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                            style={{
                                                backgroundColor: hexToRgba(colors.brand.primary, 0.2),
                                                color: colors.brand.primary
                                            }}
                                        >
                                            #
                                        </div>
                                        <span className="text-white font-semibold">{block.height.toLocaleString()}</span>
                                    </div>
                                    <span className="text-gray-400 text-xs">{formatTimeAgo(block.timestamp)}</span>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-xs">Hash:</span>
                                        <span className="text-white text-xs font-mono">{formatAddress(block.hash)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-xs">Transactions:</span>
                                        <span className="text-xs font-medium" style={{ color: colors.brand.primary }}>
                                            {block.txCount}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-xs">Size:</span>
                                        <span className="text-white text-xs">{formatBytes(block.size)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Block Details */}
                <div
                    className="backdrop-blur-sm p-5 rounded-xl shadow-lg"
                    style={{
                        backgroundColor: hexToRgba(colors.ui.bgMedium, 0.9),
                        border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                    }}
                >
                    {selectedBlock ? (
                        <>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                Block #{selectedBlock.height.toLocaleString()}
                                <span
                                    className="px-2 py-1 rounded-full text-xs"
                                    style={{
                                        backgroundColor: hexToRgba(colors.accent.success, 0.2),
                                        color: colors.accent.success
                                    }}
                                >
                                    Confirmed
                                </span>
                            </h3>

                            {/* Block Info */}
                            <div className="space-y-3 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-gray-400 text-xs block">Hash</span>
                                        <span className="text-white text-sm font-mono break-all">{selectedBlock.hash}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-xs block">Timestamp</span>
                                        <span className="text-white text-sm">{new Date(selectedBlock.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-xs block">Proposer</span>
                                        <span className="text-white text-sm font-mono">{formatAddress(selectedBlock.proposer)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-xs block">Size</span>
                                        <span className="text-white text-sm">{formatBytes(selectedBlock.size)}</span>
                                    </div>
                                </div>

                                {selectedBlock.gasUsed && selectedBlock.gasLimit && (
                                    <div>
                                        <span className="text-gray-400 text-xs block mb-1">Gas Usage</span>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: hexToRgba(colors.ui.bgDark, 0.5) }}>
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${(selectedBlock.gasUsed / selectedBlock.gasLimit) * 100}%`,
                                                        backgroundColor: colors.brand.primary
                                                    }}
                                                />
                                            </div>
                                            <span className="text-white text-xs">{((selectedBlock.gasUsed / selectedBlock.gasLimit) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="text-gray-400 text-xs mt-1">
                                            {selectedBlock.gasUsed.toLocaleString()} / {selectedBlock.gasLimit.toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Transactions */}
                            <div>
                                <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                                    Transactions ({selectedBlock.txCount})
                                    {loading && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderBottomColor: colors.brand.primary }} />
                                    )}
                                </h4>

                                {loading ? (
                                    <div className="text-center py-4">
                                        <div className="text-gray-400">Loading transactions...</div>
                                    </div>
                                ) : transactions.length > 0 ? (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {transactions.map(tx => (
                                            <div
                                                key={tx.hash}
                                                className="p-3 rounded-lg border"
                                                style={{
                                                    backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                                                    border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                                                }}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span
                                                        className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                                                        style={{
                                                            backgroundColor: hexToRgba(colors.brand.primary, 0.2),
                                                            color: colors.brand.primary
                                                        }}
                                                    >
                                                        {tx.type}
                                                    </span>
                                                    <span className="text-xs font-medium capitalize" style={{ color: getStatusColor(tx.status) }}>
                                                        {tx.status}
                                                    </span>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400 text-xs">Hash:</span>
                                                        <span className="text-white text-xs font-mono">{formatAddress(tx.hash)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400 text-xs">From:</span>
                                                        <span className="text-white text-xs font-mono">{formatAddress(tx.from)}</span>
                                                    </div>
                                                    {tx.to && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-400 text-xs">To:</span>
                                                            <span className="text-white text-xs font-mono">{formatAddress(tx.to)}</span>
                                                        </div>
                                                    )}
                                                    {tx.amount && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-400 text-xs">Amount:</span>
                                                            <span className="text-xs font-medium" style={{ color: colors.accent.success }}>
                                                                {tx.amount}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400 text-xs">Fee:</span>
                                                        <span className="text-white text-xs">{tx.fee}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="text-gray-400">No transactions in this block</div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                                style={{ backgroundColor: hexToRgba(colors.brand.primary, 0.1) }}
                            >
                                <svg className="w-8 h-8" style={{ color: colors.brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                    />
                                </svg>
                            </div>
                            <p className="text-gray-300 text-lg font-medium mb-2">Select a Block</p>
                            <p className="text-gray-400 text-sm">Click on a block from the list to view its details and transactions</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlocksTab;
