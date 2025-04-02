import { useState, useEffect } from "react";
import { PageLayout } from "../layout/PageLayout";
import { Link } from "react-router-dom";

interface Block {
    index: number;
    hash: string;
    previousHash: string;
    merkleRoot: string;
    signature: string;
    timestamp: number;
    validator: string;
    version: number;
    transactions: any[];
    transactionCount: number;
}

export default function LatestBlocksPage() {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    const truncateHash = (hash: string) => {
        return hash.slice(0, 3) + '...' + hash.slice(-3);
    };

    const handleCopyClick = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccess(id);
            setTimeout(() => setCopySuccess(null), 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    const formatBlockAge = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;

        // Convert to seconds
        const seconds = Math.floor(diff / 1000);

        if (seconds < 60) {
            return `${seconds} secs ago`;
        }

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
        }

        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours} hr${hours === 1 ? '' : 's'} ago`;
        }

        const days = Math.floor(hours / 24);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    };

    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                const apiUrl = import.meta.env.VITE_EXPLORER_API_URL || 'http://localhost:9090';
                const response = await fetch(`${apiUrl}/rpc/blocks`);
                console.log('Response:', response);
                const data = await response.json();
                setBlocks(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch blocks');
                setLoading(false);
            }
        };

        // Fetch blocks immediately on mount
        fetchBlocks();
        
        // Set up interval to fetch blocks every 5 seconds
        const intervalId = setInterval(fetchBlocks, 5000);
        
        // Clean up the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, []);

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
                        Latest Blocks
                    </h1>
                    <div className="ml-4 h-px flex-grow" style={{ background: "linear-gradient(90deg, #4D9CF8, transparent)" }}></div>
                </div>

                {loading && (
                    <div className="text-center p-10">
                        <div className="inline-block p-3 rounded-full animate-pulse" style={{ background: "linear-gradient(90deg, #AA01A3, #B405AD, #4D9CF8)" }}></div>
                        <p className="mt-4 text-[#D9D9D9]">Loading blocks...</p>
                    </div>
                )}

                {error && (
                    <div className="text-red-500 text-center p-10 border border-red-500 rounded-md">
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* Mobile view - card based layout */}
                        <div className="md:hidden space-y-4">
                            {blocks.map((block) => (
                                <div 
                                    key={block.hash}
                                    className="rounded-lg p-4 border transition-colors" 
                                    style={{ 
                                        background: "rgba(12, 18, 70, 0.5)",
                                        borderColor: "#4D9CF8" 
                                    }}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <Link 
                                            to={`/block/${block.index}`} 
                                            className="text-[#4D9CF8] hover:text-[#AA01A3] transition-colors font-medium text-lg"
                                        >
                                            Block #{block.index}
                                        </Link>
                                        <span className="text-[#D9D9D9] text-sm">{formatBlockAge(block.timestamp)}</span>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-[#F8F5F5] font-medium">Transactions:</span>
                                            <span className="text-[#D9D9D9]">{block.transactionCount}</span>
                                        </div>
                                        
                                        <div>
                                            <span className="text-[#F8F5F5] font-medium">Hash:</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-mono text-[#D9D9D9]">{truncateHash(block.hash)}</span>
                                                <button
                                                    onClick={() => handleCopyClick(block.hash, `hash-${block.hash}`)}
                                                    className="p-1 hover:bg-[#AA01A3] hover:bg-opacity-20 rounded transition-colors"
                                                    title="Copy block hash"
                                                >
                                                    {copySuccess === `hash-${block.hash}` ? (
                                                        <span className="text-[#B405AD]">✓</span>
                                                    ) : (
                                                        <span>📋</span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <span className="text-[#F8F5F5] font-medium">Validator:</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-mono text-[#D9D9D9]">{truncateHash(block.validator)}</span>
                                                <button
                                                    onClick={() => handleCopyClick(block.validator, `validator-${block.hash}`)}
                                                    className="p-1 hover:bg-[#AA01A3] hover:bg-opacity-20 rounded transition-colors"
                                                    title="Copy validator address"
                                                >
                                                    {copySuccess === `validator-${block.hash}` ? (
                                                        <span className="text-[#B405AD]">✓</span>
                                                    ) : (
                                                        <span>📋</span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Desktop view - table layout */}
                        <div className="hidden md:block overflow-x-auto rounded-lg shadow">
                            <table className="min-w-full" style={{ background: "rgba(12, 18, 70, 0.5)" }}>
                                <thead>
                                    <tr style={{ borderBottom: "2px solid #4D9CF8" }}>
                                        <th className="p-3 text-[#F8F5F5] font-semibold text-left">Height</th>
                                        <th className="p-3 text-[#F8F5F5] font-semibold text-left">Age</th>
                                        <th className="p-3 text-[#F8F5F5] font-semibold text-left">Tx Count</th>
                                        <th className="p-3 text-[#F8F5F5] font-semibold text-left">Hash</th>
                                        <th className="p-3 text-[#F8F5F5] font-semibold text-left">Previous Hash</th>
                                        <th className="p-3 text-[#F8F5F5] font-semibold text-left">Merkle Root</th>
                                        <th className="p-3 text-[#F8F5F5] font-semibold text-left">Signature</th>
                                        <th className="p-3 text-[#F8F5F5] font-semibold text-left">Validator</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blocks.map((block) => (
                                        <tr key={block.hash} className="hover:bg-[#0C1246] transition-colors" style={{ borderBottom: "1px solid rgba(77, 156, 248, 0.3)" }}>
                                            <td className="p-3 text-[#F8F5F5]">
                                                <Link 
                                                    to={`/block/${block.index}`} 
                                                    className="text-[#4D9CF8] hover:text-[#AA01A3] transition-colors font-medium"
                                                >
                                                    {block.index}
                                                </Link>
                                            </td>
                                            <td className="p-3 text-[#D9D9D9]">
                                                {formatBlockAge(block.timestamp)}
                                            </td>
                                            <td className="p-3 text-[#D9D9D9]">{block.transactionCount}</td>
                                            
                                            <td className="p-3 font-mono text-sm text-[#D9D9D9]">
                                                <div className="flex items-center gap-2">
                                                    <span>{truncateHash(block.hash)}</span>
                                                    <button
                                                        onClick={() => handleCopyClick(block.hash, `hash-${block.hash}`)}
                                                        className="p-1 hover:bg-[#AA01A3] hover:bg-opacity-20 rounded transition-colors"
                                                        title="Copy block hash"
                                                    >
                                                        {copySuccess === `hash-${block.hash}` ? (
                                                            <span className="text-[#B405AD]">✓</span>
                                                        ) : (
                                                            <span>📋</span>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="p-3 font-mono text-sm text-[#D9D9D9]">
                                                <div className="flex items-center gap-2">
                                                    <span>{truncateHash(block.previousHash)}</span>
                                                    <button
                                                        onClick={() => handleCopyClick(block.previousHash, `prev-${block.hash}`)}
                                                        className="p-1 hover:bg-[#AA01A3] hover:bg-opacity-20 rounded transition-colors"
                                                        title="Copy previous hash"
                                                    >
                                                        {copySuccess === `prev-${block.hash}` ? (
                                                            <span className="text-[#B405AD]">✓</span>
                                                        ) : (
                                                            <span>📋</span>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="p-3 font-mono text-sm text-[#D9D9D9]">
                                                <div className="flex items-center gap-2">
                                                    <span>{truncateHash(block.merkleRoot)}</span>
                                                    <button
                                                        onClick={() => handleCopyClick(block.merkleRoot, `merkle-${block.hash}`)}
                                                        className="p-1 hover:bg-[#AA01A3] hover:bg-opacity-20 rounded transition-colors"
                                                        title="Copy merkle root"
                                                    >
                                                        {copySuccess === `merkle-${block.hash}` ? (
                                                            <span className="text-[#B405AD]">✓</span>
                                                        ) : (
                                                            <span>📋</span>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="p-3 font-mono text-sm text-[#D9D9D9]">
                                                <div className="flex items-center gap-2">
                                                    <span>{truncateHash(block.signature)}</span>
                                                    <button
                                                        onClick={() => handleCopyClick(block.signature, `sig-${block.hash}`)}
                                                        className="p-1 hover:bg-[#AA01A3] hover:bg-opacity-20 rounded transition-colors"
                                                        title="Copy signature"
                                                    >
                                                        {copySuccess === `sig-${block.hash}` ? (
                                                            <span className="text-[#B405AD]">✓</span>
                                                        ) : (
                                                            <span>📋</span>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="p-3 font-mono text-sm text-[#D9D9D9]">
                                                <div className="flex items-center gap-2">
                                                    <span>{truncateHash(block.validator)}</span>
                                                    <button
                                                        onClick={() => handleCopyClick(block.validator, `validator-${block.hash}`)}
                                                        className="p-1 hover:bg-[#AA01A3] hover:bg-opacity-20 rounded transition-colors"
                                                        title="Copy validator address"
                                                    >
                                                        {copySuccess === `validator-${block.hash}` ? (
                                                            <span className="text-[#B405AD]">✓</span>
                                                        ) : (
                                                            <span>📋</span>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </PageLayout>
    );
} 