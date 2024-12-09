import { useEffect, useState } from "react";
import { NODE_URL } from "../config";
import { BlockDTO, NodeRpcClient } from "@bitcoinbrisbane/block52";

export function useBlocks() {
    const [blocks, setBlocks] = useState<BlockDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                const client = new NodeRpcClient(NODE_URL, "0x357ecd78b54a4dcaf8b0f8b01585b22293c557adc72ffd8beede1a973a8f98f1");
                const blocks = await client.getBlocks(20);
                setBlocks(blocks);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err : new Error("An unknown error occurred"));
                setLoading(false);
            }
        };

        fetchBlocks();
        const intervalId = setInterval(fetchBlocks, 10000);
        return () => clearInterval(intervalId);
    }, []);

    return { blocks, loading, error };
}
