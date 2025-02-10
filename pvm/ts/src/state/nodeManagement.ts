import axios from "axios";

import { Node } from "../core/types";

export async function getBootNodes(ownNodeUrl?: string, dev: boolean = false): Promise<Node[]> {
    // Return empty array in dev mode
    if (process.env.DEV_MODE === "true") {
        console.log("Dev mode: No boot nodes");
        return [];
    }

    let url = "https://raw.githubusercontent.com/block52/poker-vm/refs/heads/main/bootnodes.json";

    if (dev) {
        url = "https://raw.githubusercontent.com/block52/poker-vm/refs/heads/main/bootnodes-dev.json";
    }

    const response = await axios.get(url);

    return (response.data as Node[]).filter(node => node.url !== ownNodeUrl);
}
