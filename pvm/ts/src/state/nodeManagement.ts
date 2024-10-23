import axios from "axios";

export async function getBootNodes(ownNodeUrl?: string): Promise<string[]> {
    const response = await axios.get(
        "https://raw.githubusercontent.com/block52/poker-vm/refs/heads/main/bootnodes.json"
    );
    return (response.data as string[]).filter(url => url !== ownNodeUrl);
}
