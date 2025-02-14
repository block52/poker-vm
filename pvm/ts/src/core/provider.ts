import { ethers } from "ethers";

export const createProvider = (nodeUrl: string): ethers.JsonRpcProvider => {
    const _nodeUrl = nodeUrl || process.env.RPC_URL;
    return new ethers.JsonRpcProvider(_nodeUrl);
}