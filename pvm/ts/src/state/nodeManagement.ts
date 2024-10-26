import axios from "axios";

import { Node } from "../core/types";

export async function getBootNodes(ownNodeUrl?: string): Promise<Node[]> {
    const response = await axios.get(
        "https://raw.githubusercontent.com/block52/poker-vm/refs/heads/main/bootnodes.json"
    );

    return (response.data as Node[]).filter(node => node.url !== ownNodeUrl);
}
