import { useState, useEffect } from "react";
import { PageLayout } from "../layout/PageLayout";
import { useSearchParams, useNavigate } from "react-router-dom";

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
    transactions: any[];
    transactionCount: number;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export default function BlocksPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalBlocks: 0,
        blocksPerPage: 100
    });

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 100;
    const sort = searchParams.get('sort') || '-index';

    // Check if we need to set default parameters
    useEffect(() => {
        if (!searchParams.get('page') || !searchParams.get('limit') || !searchParams.get('sort')) {
            navigate('/blocks?page=1&limit=100&sort=-index', { replace: true });
            return;
        }
    }, []);

    const fetchBlocks = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:3800/blocks?page=${page}&limit=${limit}&sort=${sort}`);
            const data = await response.json();
            
            if (data.blocks && Array.isArray(data.blocks)) {
                setBlocks(data.blocks);
                setPagination(data.pagination);
            }
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
    }, [page, limit, sort]);

    const handleNextPage = () => {
        navigate(`/blocks?page=${page + 1}&limit=${limit}&sort=${sort}`);
    };

    const handlePrevPage = () => {
        if (page > 1) {
            navigate(`/blocks?page=${page - 1}&limit=${limit}&sort=${sort}`);
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
                                        <th className="p-2 border-b border-gray-700">Previous Hash</th>
                                        <th className="p-2 border-b border-gray-700">Merkle Root</th>
                                        <th className="p-2 border-b border-gray-700">Signature</th>
                                        <th className="p-2 border-b border-gray-700">Timestamp</th>
                                        <th className="p-2 border-b border-gray-700">Validator</th>
                                        <th className="p-2 border-b border-gray-700">Version</th>
                                        <th className="p-2 border-b border-gray-700">Tx Count</th>
                                        <th className="p-2 border-b border-gray-700">Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blocks.map((block) => (
                                        <tr key={block._id} className="hover:bg-gray-800">
                                            <td className="p-2 border-b border-gray-700 text-center">{block.index}</td>
                                            <td className="p-2 border-b border-gray-700 font-mono text-sm">{block.hash}</td>
                                            <td className="p-2 border-b border-gray-700 font-mono text-sm">{block.previousHash}</td>
                                            <td className="p-2 border-b border-gray-700 font-mono text-sm">{block.merkleRoot}</td>
                                            <td className="p-2 border-b border-gray-700 font-mono text-sm">{block.signature}</td>
                                            <td className="p-2 border-b border-gray-700 text-center">
                                                {new Date(block.timestamp).toLocaleString()}
                                            </td>
                                            <td className="p-2 border-b border-gray-700 font-mono text-sm">{block.validator}</td>
                                            <td className="p-2 border-b border-gray-700 text-center">{block.version}</td>
                                            <td className="p-2 border-b border-gray-700 text-center">{block.transactionCount}</td>
                                            <td className="p-2 border-b border-gray-700 text-center">
                                                {new Date(block.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                            <button
                                onClick={handlePrevPage}
                                disabled={page === 1}
                                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span>
                                Page {page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={page === pagination.totalPages}
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
