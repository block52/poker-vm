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
    const { hash } = useParams();
    const [block, setBlock] = useState<Block | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchBlock = async () => {
            try {
                setLoading(true);
                const apiUrl = import.meta.env.VITE_EXPLORER_API_URL || 'http://localhost:3800';
                const response = await fetch(`${apiUrl}/rpc/block/${hash}`);
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
    }, [hash]);

    const formatValue = (value: string) => {
        const usdc = Number(value) / 1e18;
        return `${usdc.toFixed(2)} USDC`;
    };

    return (
        <PageLayout>
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Block Details</h1>

                {loading && <div className="text-center">Loading block...</div>}
                {error && <div className="text-red-500 text-center">{error}</div>}

                {block && !loading && !error && (
                    <div className="space-y-6">
                        {/* Block Details - Updated styling */}
                        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800 shadow-lg">
                            <h2 className="text-xl font-semibold mb-4 text-slate-200 border-b border-slate-700 pb-2">
                                Block #{block.index} Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <p><span className="font-semibold">Height:</span> {block.index}</p>
                                    
                                    <p className="flex items-center gap-2">
                                        <span className="font-semibold">Hash:</span>
                                        <span className="font-mono text-sm">{truncateHash(block.hash)}</span>
                                        <button
                                            onClick={() => handleCopyClick(block.hash, 'block-hash', setCopySuccess)}
                                            className="p-1 hover:bg-gray-700 rounded"
                                            title="Copy hash"
                                        >
                                            {copySuccess === 'block-hash' ? <span className="text-green-500">✓</span> : <span>📋</span>}
                                        </button>
                                    </p>

                                    <p className="flex items-center gap-2">
                                        <span className="font-semibold">Previous Hash:</span>
                                        <span className="font-mono text-sm">{truncateHash(block.previousHash)}</span>
                                        <button
                                            onClick={() => handleCopyClick(block.previousHash, 'prev-hash', setCopySuccess)}
                                            className="p-1 hover:bg-gray-700 rounded"
                                            title="Copy previous hash"
                                        >
                                            {copySuccess === 'prev-hash' ? <span className="text-green-500">✓</span> : <span>📋</span>}
                                        </button>
                                    </p>

                                    <p className="flex items-center gap-2">
                                        <span className="font-semibold">Merkle Root:</span>
                                        <span className="font-mono text-sm">{truncateHash(block.merkleRoot)}</span>
                                        <button
                                            onClick={() => handleCopyClick(block.merkleRoot, 'merkle-root', setCopySuccess)}
                                            className="p-1 hover:bg-gray-700 rounded"
                                            title="Copy merkle root"
                                        >
                                            {copySuccess === 'merkle-root' ? <span className="text-green-500">✓</span> : <span>📋</span>}
                                        </button>
                                    </p>

                                    <p className="flex items-center gap-2">
                                        <span className="font-semibold">Signature:</span>
                                        <span className="font-mono text-sm">{truncateHash(block.signature)}</span>
                                        <button
                                            onClick={() => handleCopyClick(block.signature, 'signature', setCopySuccess)}
                                            className="p-1 hover:bg-gray-700 rounded"
                                            title="Copy signature"
                                        >
                                            {copySuccess === 'signature' ? <span className="text-green-500">✓</span> : <span>📋</span>}
                                        </button>
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <p>
                                        <span className="font-semibold">Timestamp:</span> {new Date(block.timestamp).toLocaleString()}
                                        <span className="ml-2 text-gray-400">({formatBlockAge(block.timestamp)})</span>
                                    </p>
                                    
                                    <p className="flex items-center gap-2">
                                        <span className="font-semibold">Validator:</span>
                                        <span className="font-mono text-sm">{truncateHash(block.validator)}</span>
                                        <button
                                            onClick={() => handleCopyClick(block.validator, 'validator', setCopySuccess)}
                                            className="p-1 hover:bg-gray-700 rounded"
                                            title="Copy validator address"
                                        >
                                            {copySuccess === 'validator' ? <span className="text-green-500">✓</span> : <span>📋</span>}
                                        </button>
                                    </p>
                                    
                                    <p><span className="font-semibold">Version:</span> {block.version}</p>
                                    <p><span className="font-semibold">Transaction Count:</span> {block.transactionCount}</p>
                                </div>
                            </div>
                        </div>

                        {/* Transactions - Updated styling */}
                        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                            <h2 className="text-xl font-semibold mb-4 text-slate-200 border-b border-slate-700 pb-2">
                                Transactions ({block.transactionCount})
                            </h2>
                            <div className="space-y-4">
                                {block.transactions.map((tx) => (
                                    <div key={tx.hash} 
                                         className="bg-slate-900/50 p-5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors duration-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <p className="flex items-center gap-2">
                                                    <span className="font-semibold">Hash:</span>
                                                    <span className="font-mono text-sm">{truncateHash(tx.hash)}</span>
                                                    <button
                                                        onClick={() => handleCopyClick(tx.hash, `tx-${tx.hash}`, setCopySuccess)}
                                                        className="p-1 hover:bg-gray-700 rounded"
                                                        title="Copy transaction hash"
                                                    >
                                                        {copySuccess === `tx-${tx.hash}` ? <span className="text-green-500">✓</span> : <span>📋</span>}
                                                    </button>
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <span className="font-semibold">From:</span>
                                                    <span className="font-mono text-sm">{truncateHash(tx.from)}</span>
                                                    <button
                                                        onClick={() => handleCopyClick(tx.from, `from-${tx.hash}`, setCopySuccess)}
                                                        className="p-1 hover:bg-gray-700 rounded"
                                                        title="Copy from address"
                                                    >
                                                        {copySuccess === `from-${tx.hash}` ? <span className="text-green-500">✓</span> : <span>📋</span>}
                                                    </button>
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <span className="font-semibold">To:</span>
                                                    <span className="font-mono text-sm">{truncateHash(tx.to)}</span>
                                                    <button
                                                        onClick={() => handleCopyClick(tx.to, `to-${tx.hash}`, setCopySuccess)}
                                                        className="p-1 hover:bg-gray-700 rounded"
                                                        title="Copy to address"
                                                    >
                                                        {copySuccess === `to-${tx.hash}` ? <span className="text-green-500">✓</span> : <span>📋</span>}
                                                    </button>
                                                </p>
                                                <p><span className="font-semibold">Value:</span> ${formatValue(tx.value)}</p>
                                            </div>
                                            <div className="space-y-3">
                                                <p><span className="font-semibold">Nonce:</span> {tx.nonce}</p>
                                                <p><span className="font-semibold">Data:</span> {tx.data}</p>
                                                <p>
                                                    <span className="font-semibold">Timestamp:</span> {new Date(Number(tx.timestamp)).toLocaleString()}
                                                    <span className="ml-2 text-gray-400">({formatBlockAge(Number(tx.timestamp))})</span>
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <span className="font-semibold">Signature:</span>
                                                    <span className="font-mono text-sm">{truncateHash(tx.signature)}</span>
                                                    <button
                                                        onClick={() => handleCopyClick(tx.signature, `sig-${tx.hash}`, setCopySuccess)}
                                                        className="p-1 hover:bg-gray-700 rounded"
                                                        title="Copy signature"
                                                    >
                                                        {copySuccess === `sig-${tx.hash}` ? <span className="text-green-500">✓</span> : <span>📋</span>}
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