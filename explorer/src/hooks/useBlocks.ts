import { useEffect, useState } from "react";
import axios from "axios";

interface Block {
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
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalBlocks: number;
    blocksPerPage: number;
}

interface BlocksResponse {
    blocks: Block[];
    pagination: PaginationInfo;
}

export function useBlocks(page: number = 1, limit: number = 100) {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                const response = await axios.get<BlocksResponse>(
                    `http://localhost:3800/blocks?page=${page}&limit=${limit}`
                );
                setBlocks(response.data.blocks);
                setPagination(response.data.pagination);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err : new Error("An unknown error occurred"));
                setLoading(false);
            }
        };

        fetchBlocks();
        const intervalId = setInterval(fetchBlocks, 10000);
        return () => clearInterval(intervalId);
    }, [page, limit]);

    return { blocks, pagination, loading, error };
}
