import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { PageLayout } from "../layout/PageLayout";

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
    _id: string;
    hash: string;
    index: number;
    previousHash: string;
    merkleRoot: string;
    signature: string;
    timestamp: number;
    validator: string;
    version: string;
    transactions: Transaction[];
    transactionCount: number;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export default function BlockPage() {
    const { hash } = useParams();
    const [block, setBlock] = useState<Block | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBlock = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:3800/block/${hash}`);
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

    return (
        <PageLayout>
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Block Details</h1>

                {loading && <div className="text-center">Loading block...</div>}
                {error && <div className="text-red-500 text-center">{error}</div>}

                {block && !loading && !error && (
                    <div className="space-y-6">
                        {/* Block Details */}
                        <div className="bg-card rounded-lg p-4 border border-border">
                            <h2 className="text-xl font-semibold mb-4">Block Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p><span className="font-semibold">Height:</span> {block.index}</p>
                                    <p><span className="font-semibold">Hash:</span> <span className="font-mono text-sm">{block.hash}</span></p>
                                    <p><span className="font-semibold">Previous Hash:</span> <span className="font-mono text-sm">{block.previousHash}</span></p>
                                    <p><span className="font-semibold">Merkle Root:</span> <span className="font-mono text-sm">{block.merkleRoot}</span></p>
                                    <p><span className="font-semibold">Signature:</span> <span className="font-mono text-sm">{block.signature}</span></p>
                                </div>
                                <div className="space-y-2">
                                    <p><span className="font-semibold">Timestamp:</span> {new Date(block.timestamp).toLocaleString()}</p>
                                    <p><span className="font-semibold">Validator:</span> <span className="font-mono text-sm">{block.validator}</span></p>
                                    <p><span className="font-semibold">Version:</span> {block.version}</p>
                                    <p><span className="font-semibold">Transaction Count:</span> {block.transactionCount}</p>
                                    <p><span className="font-semibold">Created At:</span> {new Date(block.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Transactions */}
                        <div className="bg-card rounded-lg p-4 border border-border">
                            <h2 className="text-xl font-semibold mb-4">Transactions ({block.transactionCount})</h2>
                            <div className="space-y-4">
                                {block.transactions.map((tx, index) => (
                                    <div key={tx.hash} className="p-4 border border-border rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p><span className="font-semibold">Hash:</span> <span className="font-mono text-sm">{tx.hash}</span></p>
                                                <p><span className="font-semibold">From:</span> <span className="font-mono text-sm">{tx.from}</span></p>
                                                <p><span className="font-semibold">To:</span> <span className="font-mono text-sm">{tx.to}</span></p>
                                                <p><span className="font-semibold">Value:</span> {tx.value}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <p><span className="font-semibold">Nonce:</span> {tx.nonce}</p>
                                                <p><span className="font-semibold">Data:</span> {tx.data}</p>
                                                <p><span className="font-semibold">Timestamp:</span> {new Date(Number(tx.timestamp)).toLocaleString()}</p>
                                                <p><span className="font-semibold">Signature:</span> <span className="font-mono text-sm">{tx.signature}</span></p>
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