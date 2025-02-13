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

    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                const apiUrl = import.meta.env.VITE_EXPLORER_API_URL || 'http://localhost:3800';
                const response = await fetch(`${apiUrl}/rpc/blocks`);
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
            <div className="container mx-auto px-4">
                <h1 className="text-2xl font-bold mb-4">Latest Blocks</h1>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}
                {loading ? (
                    <div className="text-center">Loading...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-background border border-gray-700">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 border-b border-gray-700 text-left">Height</th>
                                    <th className="px-6 py-3 border-b border-gray-700 text-left">Hash</th>
                                    <th className="px-6 py-3 border-b border-gray-700 text-left">Timestamp</th>
                                    <th className="px-6 py-3 border-b border-gray-700 text-left">Validator</th>
                                    <th className="px-6 py-3 border-b border-gray-700 text-left">Txs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blocks.map((block) => (
                                    <tr key={block.hash} className="hover:bg-gray-800">
                                        <td className="px-6 py-4 border-b border-gray-700">
                                            <Link
                                                to={`/block/${block.hash}`}
                                                className="text-blue-500 hover:text-blue-400"
                                            >
                                                {block.index}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 border-b border-gray-700">
                                            <Link
                                                to={`/block/${block.hash}`}
                                                className="text-blue-500 hover:text-blue-400"
                                            >
                                                {block.hash.substring(0, 10)}...
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 border-b border-gray-700">
                                            {new Date(block.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 border-b border-gray-700">
                                            {block.validator.substring(0, 10)}...
                                        </td>
                                        <td className="px-6 py-4 border-b border-gray-700">
                                            {block.transactionCount}
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