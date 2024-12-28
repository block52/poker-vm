import { ethers } from "ethers";

export function createProvider(): ethers.JsonRpcProvider {
    const nodeUrl = process.env.RPC_URL || "https://mainnet.infura.io/v3/663bcd65903948a6b53cd96866fc1a4a";
    return new ethers.JsonRpcProvider(nodeUrl);
}