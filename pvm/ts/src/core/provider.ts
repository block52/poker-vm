import { ethers } from "ethers";

export function createProvider(nodeUrl: string): ethers.JsonRpcProvider {
    const _nodeUrl = nodeUrl || process.env.RPC_URL;
    return new ethers.JsonRpcProvider(nodeUrl);
}