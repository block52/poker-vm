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
                const client = new NodeRpcClient(NODE_URL, "");
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
