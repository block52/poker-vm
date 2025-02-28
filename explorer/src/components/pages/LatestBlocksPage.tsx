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
                const apiUrl = import.meta.env.VITE_EXPLORER_API_URL || 'http://localhost:3800';
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

        fetchBlocks();
    }, []);

    return (
        <PageLayout>
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Latest Blocks</h1>

                {loading && (
                    <div className="text-center">Loading blocks...</div>
                )}

                {error && (
                    <div className="text-red-500 text-center">{error}</div>
                )}

                {!loading && !error && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-background border border-gray-700">
                            <thead>
                                <tr>
                                    <th className="p-2 border-b border-gray-700">Height</th>
                                    <th className="p-2 border-b border-gray-700">Age</th>
                                    <th className="p-2 border-b border-gray-700">Tx Count</th>
                                    <th className="p-2 border-b border-gray-700">Hash</th>
                                    <th className="p-2 border-b border-gray-700">Previous Hash</th>
                                    <th className="p-2 border-b border-gray-700">Merkle Root</th>
                                    <th className="p-2 border-b border-gray-700">Signature</th>
                                    <th className="p-2 border-b border-gray-700">Validator</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blocks.map((block) => (
                                    <tr key={block.hash} className="hover:bg-gray-800">
                                        <td className="p-2 border-b border-gray-700 text-center">
                                            <Link 
                                                to={`/block/${block.index}`} 
                                                className="text-blue-400 hover:text-blue-300 underline"
                                            >
                                                {block.index}
                                            </Link>
                                        </td>
                                        <td className="p-2 border-b border-gray-700 text-center">
                                            {formatBlockAge(block.timestamp)}
                                        </td>
                                        <td className="p-2 border-b border-gray-700 text-center">{block.transactionCount}</td>
                                        
                                        <td className="p-2 border-b border-gray-700 font-mono text-sm">
                                            <div className="flex items-center gap-2">
                                                <span>{truncateHash(block.hash)}</span>
                                                <button
                                                    onClick={() => handleCopyClick(block.hash, `hash-${block.hash}`)}
                                                    className="p-1 hover:bg-gray-700 rounded"
                                                    title="Copy block hash"
                                                >
                                                    {copySuccess === `hash-${block.hash}` ? (
                                                        <span className="text-green-500">✓</span>
                                                    ) : (
                                                        <span>📋</span>
                                                    )}
                                                </button>
                                            </div>
                                        </td>

                                        <td className="p-2 border-b border-gray-700 font-mono text-sm">
                                            <div className="flex items-center gap-2">
                                                <span>{truncateHash(block.previousHash)}</span>
                                                <button
                                                    onClick={() => handleCopyClick(block.previousHash, `prev-${block.hash}`)}
                                                    className="p-1 hover:bg-gray-700 rounded"
                                                    title="Copy previous hash"
                                                >
                                                    {copySuccess === `prev-${block.hash}` ? (
                                                        <span className="text-green-500">✓</span>
                                                    ) : (
                                                        <span>📋</span>
                                                    )}
                                                </button>
                                            </div>
                                        </td>

                                        <td className="p-2 border-b border-gray-700 font-mono text-sm">
                                            <div className="flex items-center gap-2">
                                                <span>{truncateHash(block.merkleRoot)}</span>
                                                <button
                                                    onClick={() => handleCopyClick(block.merkleRoot, `merkle-${block.hash}`)}
                                                    className="p-1 hover:bg-gray-700 rounded"
                                                    title="Copy merkle root"
                                                >
                                                    {copySuccess === `merkle-${block.hash}` ? (
                                                        <span className="text-green-500">✓</span>
                                                    ) : (
                                                        <span>📋</span>
                                                    )}
                                                </button>
                                            </div>
                                        </td>

                                        <td className="p-2 border-b border-gray-700 font-mono text-sm">
                                            <div className="flex items-center gap-2">
                                                <span>{truncateHash(block.signature)}</span>
                                                <button
                                                    onClick={() => handleCopyClick(block.signature, `sig-${block.hash}`)}
                                                    className="p-1 hover:bg-gray-700 rounded"
                                                    title="Copy signature"
                                                >
                                                    {copySuccess === `sig-${block.hash}` ? (
                                                        <span className="text-green-500">✓</span>
                                                    ) : (
                                                        <span>📋</span>
                                                    )}
                                                </button>
                                            </div>
                                        </td>

                                        <td className="p-2 border-b border-gray-700 font-mono text-sm">
                                            <div className="flex items-center gap-2">
                                                <span>{truncateHash(block.validator)}</span>
                                                <button
                                                    onClick={() => handleCopyClick(block.validator, `validator-${block.hash}`)}
                                                    className="p-1 hover:bg-gray-700 rounded"
                                                    title="Copy validator address"
                                                >
                                                    {copySuccess === `validator-${block.hash}` ? (
                                                        <span className="text-green-500">✓</span>
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
                )}
            </div>
        </PageLayout>
    );
} 