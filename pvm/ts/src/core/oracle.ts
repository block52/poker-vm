// Connect to Ethereum contract via EthersJS

// The contract is a standard ERC20 token contract

import { ethers } from "ethers";

export function createProvider(nodeUrl: string): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(nodeUrl);
}

// Listen to Oracle
const INFURA_PROJECT_ID = "663bcd65903948a6b53cd96866fc1a4a";
const infuraUrl = `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`;
const provider = createProvider(infuraUrl);

const contractAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"; // ERC20 token contract address
const targetAddress = "0xe0554a476a092703abdb3ef35c80e0d76d32939f"; // Address to monitor for deposits


export function listenToOracle() {
  const abi = [
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  ];

  const oracle = new ethers.Contract(contractAddress, abi, provider);

  oracle.on("Transfer", (from, to, value, event) => {
    if (to.toLowerCase() === targetAddress.toLowerCase()) {
      console.log(`Deposit detected:`);
      console.log(`  From: ${from}`);
      console.log(`  To: ${targetAddress}`);
      console.log(`  Amount: ${ethers.formatEther(value)} tokens`);
      console.log(`  Transaction Hash: ${event.transactionHash}`);
    }
  });

  console.log(`Listening for deposits to ${targetAddress}...`);
}

