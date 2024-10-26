import axios from "axios";

export async function getBootNodes(ownNodeUrl?: string): Promise<{ url: string, publicKey: string }[]> {
    const response = await axios.get(
        "https://raw.githubusercontent.com/block52/poker-vm/refs/heads/main/bootnodes.json"
    );
    return (response.data as {url: string, publicKey: string}[]).filter(item => item.url !== ownNodeUrl);
}
