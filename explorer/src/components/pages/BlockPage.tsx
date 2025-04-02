import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { PageLayout } from "../layout/PageLayout";
import { truncateHash, handleCopyClick, formatBlockAge } from "../../lib/utils";

interface Transaction {
    nonce: string;
    to: string;
    from: string;
    value: string;
    hash: string;
    signature: string;
    timestamp: string;
    data: string;
}

interface Block {
    index: number;
    hash: string;
    previousHash: string;
    merkleRoot: string;
    signature: string;
    timestamp: number;
    validator: string;
    version: string;
    transactions: Transaction[];
    transactionCount: number;
}

export default function BlockPage() {
    const { index } = useParams();
    const [block, setBlock] = useState<Block | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchBlock = async () => {
            if (!index) return;
            
            try {
                setLoading(true);
                const apiUrl = import.meta.env.VITE_EXPLORER_API_URL || 'http://localhost:9090';
                const response = await fetch(`${apiUrl}/rpc/block/${index}`);
                
                if (!response.ok) {
                    throw new Error('Block not found');
                }

                const data = await response.json();
                setBlock(data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch block');
                console.error('Error fetching block:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBlock();
    }, [index]);

    const formatValue = (value: string) => {
        const usdc = Number(value) / 1e18;
        return `${usdc.toFixed(2)} USDC`;
    };

    const navigateToBlock = (newIndex: number) => {
        window.location.href = `/block/${newIndex}`;
    };

    return (
        <PageLayout>
            <div className="max-w-6xl mx-auto p-8 w-full">
                <div className="flex items-center mb-8">
                    <h1 className="text-3xl font-bold" style={{ 
                        background: "linear-gradient(90deg, #AA01A3, #B405AD, #4D9CF8)", 
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundSize: "200% auto",
                    }}>
                        Block Details
                    </h1>
                    <div className="ml-4 h-px flex-grow" style={{ background: "linear-gradient(90deg, #4D9CF8, transparent)" }}></div>
                </div>

                {loading && (
                    <div className="text-center p-10">
                        <div className="inline-block p-3 rounded-full animate-pulse" style={{ background: "linear-gradient(90deg, #AA01A3, #B405AD, #4D9CF8)" }}></div>
                        <p className="mt-4 text-[#D9D9D9]">Loading block...</p>
                    </div>
                )}
                
                {error && (
                    <div className="text-red-500 text-center p-10 border border-red-500 rounded-md">
                        {error}
                    </div>
                )}

                {block && !loading && !error && (
                    <div className="space-y-6">
                        {/* Navigation Buttons - Mobile & Desktop */}
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                            <button
                                onClick={() => navigateToBlock(block.index - 1)}
                                disabled={block.index === 0}
                                className="w-full sm:w-auto px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed b52-gradient"
                            >
                                ← Previous Block
                            </button>
                            <span className="text-xl font-semibold my-2 sm:my-0 text-center" style={{ 
                                background: "linear-gradient(90deg, #4D9CF8, #B405AD)", 
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent"
                            }}>
                                Block #{block.index}
                            </span>
                            <button
                                onClick={() => navigateToBlock(block.index + 1)}
                                className="w-full sm:w-auto px-4 py-2 rounded b52-gradient"
                            >
                                Next Block →
                            </button>
                        </div>

                        {/* Block Details - Already responsive with grid layout */}
                        <div className="rounded-lg p-6 border shadow-lg" style={{ 
                            background: "rgba(12, 18, 70, 0.5)",
                            borderColor: "#4D9CF8"
                        }}>
                            <h2 className="text-xl font-semibold mb-4 text-[#F8F5F5] border-b pb-2" style={{ borderColor: "rgba(77, 156, 248, 0.3)" }}>
                                Block #{block.index} Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3 text-[#D9D9D9]">
                                    <p><span className="font-semibold text-[#F8F5F5]">Height:</span> {block.index}</p>
                                    
                                    <p className="flex items-center gap-2">
                                        <span className="font-semibold text-[#F8F5F5]">Hash:</span>
                                        <span className="font-mono text-sm">{truncateHash(block.hash)}</span>
                                        <button
                                            onClick={() => handleCopyClick(block.hash, 'block-hash', setCopySuccess)}
                                            className="p-1 hover:bg-[#AA01A3] hover:bg-opacity-20 rounded transition-colors"
                                            title="Copy hash"
                                        >
                                            {copySuccess === 'block-hash' ? <span className="text-[#B405AD]">✓</span> : <span>📋</span>}
                                        </button>
                                    </p>

                                    <p className="flex items-center gap-2">
                                        <span className="font-semibold text-[#F8F5F5]">Previous Hash:</span>
                                        <span className="font-mono text-sm">{truncateHash(block.previousHash)}</span>
                                        <button
                                            onClick={() => handleCopyClick(block.previousHash, 'prev-hash', setCopySuccess)}
                                            className="p-1 hover:bg-[#AA01A3] hover:bg-opacity-20 rounded transition-colors"
                                            title="Copy previous hash"
                                        >
                                            {copySuccess === 'prev-hash' ? <span className="text-[#B405AD]">✓</span> : <span>📋</span>}
                                        </button>
                                    </p>

                                    <p className="flex items-center gap-2">
                                        <span className="font-semibold text-[#F8F5F5]">Merkle Root:</span>
                                        <span className="font-mono text-sm">{truncateHash(block.merkleRoot)}</span>
                                        <button
                                            onClick={() => handleCopyClick(block.merkleRoot, 'merkle-root', setCopySuccess)}
                                            className="p-1 hover:bg-[#AA01A3] hover:bg-opacity-20 rounded transition-colors"
                                            title="Copy merkle root"
                                        >
                                            {copySuccess === 'merkle-root' ? <span className="text-[#B405AD]">✓</span> : <span>📋</span>}
                                        </button>
                                    </p>

                                    <p className="flex items-center gap-2">
                                        <span className="font-semibold text-[#F8F5F5]">Signature:</span>
                                        <span className="font-mono text-sm">{truncateHash(block.signature)}</span>
                                        <button
                                            onClick={() => handleCopyClick(block.signature, 'signature', setCopySuccess)}
                                            className="p-1 hover:bg-[#AA01A3] hover:bg-opacity-20 rounded transition-colors"
                                            title="Copy signature"
                                        >
                                            {copySuccess === 'signature' ? <span className="text-[#B405AD]">✓</span> : <span>📋</span>}
                                        </button>
                                    </p>
                                </div>
                                <div className="space-y-3 text-[#D9D9D9]">
                                    <p>
                                        <span className="font-semibold text-[#F8F5F5]">Timestamp:</span> {new Date(block.timestamp).toLocaleString()}
                                        <span className="ml-2 text-[#4D9CF8]">({formatBlockAge(block.timestamp)})</span>
                                    </p>
                                    
                                    <p className="flex items-center gap-2">
                                        <span className="font-semibold text-[#F8F5F5]">Validator:</span>
                                        <span className="font-mono text-sm">{truncateHash(block.validator)}</span>
                                        <button
                                            onClick={() => handleCopyClick(block.validator, 'validator', setCopySuccess)}
                                            className="p-1 hover:bg-[#AA01A3] hover:bg-opacity-20 rounded transition-colors"
                                            title="Copy validator address"
                                        >
                                            {copySuccess === 'validator' ? <span className="text-[#B405AD]">✓</span> : <span>📋</span>}
                                        </button>
                                    </p>
                                    
                                    <p><span className="font-semibold text-[#F8F5F5]">Version:</span> {block.version}</p>
                                    <p><span className="font-semibold text-[#F8F5F5]">Transaction Count:</span> {block.transactionCount}</p>
                                </div>
                            </div>
                        </div>

                        {/* Transactions Section */}
                        <div className="rounded-lg p-6 border" style={{ 
                            background: "rgba(12, 18, 70, 0.3)",
                            borderColor: "#4D9CF8"
                        }}>
                            <h2 className="text-xl font-semibold mb-4 text-[#F8F5F5] border-b pb-2" style={{ borderColor: "rgba(77, 156, 248, 0.3)" }}>
                                Transactions ({block.transactionCount})
                            </h2>
                            <div className="space-y-4">
                                {block.transactions.map((tx) => (
                                    <div key={tx.hash} 
                                         className="p-5 rounded-lg border transition-colors duration-200 hover:border-[#B405AD]" 
                                         style={{ 
                                            background: "rgba(0, 0, 0, 0.3)",
                                            borderColor: "rgba(77, 156, 248, 0.3)"
                                        }}>
                                        {/* Transaction header - always visible */}
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-2 border-b border-gray-800">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-[#F8F5F5]">TX:</span>
                                                <span className="font-mono text-sm text-[#D9D9D9]">{truncateHash(tx.hash)}</span>
                                                <button
                                                    onClick={() => handleCopyClick(tx.hash, `tx-${tx.hash}`, setCopySuccess)}
                                                    className="p-1 hover:bg-[#AA01A3] hover:bg-opacity-20 rounded transition-colors"
                                                    title="Copy transaction hash"
                                                >
                                                    {copySuccess === `tx-${tx.hash}` ? <span className="text-[#B405AD]">✓</span> : <span>📋</span>}
                                                </button>
                                            </div>
                                            <div className="text-sm text-[#4D9CF8]">
                                                {formatBlockAge(Number(tx.timestamp))}
                                            </div>
                                        </div>
                                        
                                        {/* Transaction details - responsive grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3 text-[#D9D9D9]">
                                                <p className="flex items-center gap-2">
                                                    <span className="font-semibold text-[#F8F5F5]">From:</span>
                                                    <span className="font-mono text-sm">{truncateHash(tx.from)}</span>
                                                    <button
                                                        onClick={() => handleCopyClick(tx.from, `from-${tx.hash}`, setCopySuccess)}
                                                        className="p-1 hover:bg-[#AA01A3] hover:bg-opacity-20 rounded transition-colors"
                                                        title="Copy from address"
                                                    >
                                                        {copySuccess === `from-${tx.hash}` ? <span className="text-[#B405AD]">✓</span> : <span>📋</span>}
                                                    </button>
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <span className="font-semibold text-[#F8F5F5]">To:</span>
                                                    <span className="font-mono text-sm">{truncateHash(tx.to)}</span>
                                                    <button
                                                        onClick={() => handleCopyClick(tx.to, `to-${tx.hash}`, setCopySuccess)}
                                                        className="p-1 hover:bg-[#AA01A3] hover:bg-opacity-20 rounded transition-colors"
                                                        title="Copy to address"
                                                    >
                                                        {copySuccess === `to-${tx.hash}` ? <span className="text-[#B405AD]">✓</span> : <span>📋</span>}
                                                    </button>
                                                </p>
                                                <p><span className="font-semibold text-[#F8F5F5]">Value:</span> {formatValue(tx.value)}</p>
                                            </div>
                                            <div className="space-y-3 text-[#D9D9D9]">
                                                <p><span className="font-semibold text-[#F8F5F5]">Nonce:</span> {tx.nonce}</p>
                                                <p className="break-words"><span className="font-semibold text-[#F8F5F5]">Data:</span> {tx.data}</p>
                                                <p className="flex items-center gap-2">
                                                    <span className="font-semibold text-[#F8F5F5]">Signature:</span>
                                                    <span className="font-mono text-sm">{truncateHash(tx.signature)}</span>
                                                    <button
                                                        onClick={() => handleCopyClick(tx.signature, `sig-${tx.hash}`, setCopySuccess)}
                                                        className="p-1 hover:bg-[#AA01A3] hover:bg-opacity-20 rounded transition-colors"
                                                        title="Copy signature"
                                                    >
                                                        {copySuccess === `sig-${tx.hash}` ? <span className="text-[#B405AD]">✓</span> : <span>📋</span>}
                                                    </button>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    );
} 