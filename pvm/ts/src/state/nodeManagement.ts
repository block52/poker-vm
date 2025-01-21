import axios from "axios";

import { Node } from "../core/types";

export async function getBootNodes(ownNodeUrl?: string, dev: boolean = false): Promise<Node[]> {
    let url = "https://raw.githubusercontent.com/block52/poker-vm/refs/heads/main/bootnodes.json";

    if (dev) {
        url = "https://raw.githubusercontent.com/block52/poker-vm/refs/heads/main/bootnodes-dev.json";
    }

    const response = await axios.get(url);

    return (response.data as Node[]).filter(node => node.url !== ownNodeUrl);
}
