import { useState, useEffect } from "react";
import { PageLayout } from "../layout/PageLayout";

interface Block {
    _id: string;
    index: number;
    hash: string;
    timestamp: string;
    transactionCount: number;
}

export default function BlocksPage() {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalBlocks: 0,
        blocksPerPage: 100
    });

    const fetchBlocks = async (page = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:3800/blocks?page=${page}&limit=100`);
            const data = await response.json();
            console.log(data);
            setBlocks(data.blocks);
            setPagination(data.pagination);
            setError(null);
        } catch (err) {
            setError('Failed to fetch blocks');
            console.error('Error fetching blocks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlocks();
    }, []);

    const handleNextPage = () => {
        if (pagination.currentPage < pagination.totalPages) {
            fetchBlocks(pagination.currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (pagination.currentPage > 1) {
            fetchBlocks(pagination.currentPage - 1);
        }
    };

    return (
        <PageLayout>
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Blocks</h1>
                
                {loading && (
                    <div className="text-center">Loading blocks...</div>
                )}

                {error && (
                    <div className="text-red-500 text-center">{error}</div>
                )}

                {!loading && !error && (
                    <div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-background border border-gray-700">
                                <thead>
                                    <tr>
                                        <th className="p-2 border-b border-gray-700">Height</th>
                                        <th className="p-2 border-b border-gray-700">Hash</th>
                                        <th className="p-2 border-b border-gray-700">Timestamp</th>
                                        <th className="p-2 border-b border-gray-700">Transactions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blocks.map((block) => (
                                        <tr key={block._id} className="hover:bg-gray-800">
                                            <td className="p-2 border-b border-gray-700 text-center">{block.index}</td>
                                            <td className="p-2 border-b border-gray-700 font-mono text-sm">
                                                {block.hash.substring(0, 20)}...
                                            </td>
                                            <td className="p-2 border-b border-gray-700 text-center">
                                                {new Date(block.timestamp).toLocaleString()}
                                            </td>
                                            <td className="p-2 border-b border-gray-700 text-center">
                                                {block.transactionCount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                            <button
                                onClick={handlePrevPage}
                                disabled={pagination.currentPage === 1}
                                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span>
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    );
}
