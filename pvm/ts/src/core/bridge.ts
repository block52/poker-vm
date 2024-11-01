// Connect to Ethereum contract via EthersJS

// The contract is a standard ERC20 token contract

import { ethers } from "ethers";
import { MintCommand } from "../commands/mintCommand";

export function createProvider(nodeUrl: string): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(nodeUrl);
}

// Listen to Oracle
const INFURA_PROJECT_ID = "663bcd65903948a6b53cd96866fc1a4a";
const infuraUrl = `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`;
const provider = createProvider(infuraUrl);

const tokenAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"; // ERC20 token contract address
const bridgeAddress = "0xe0554a476a092703abdb3ef35c80e0d76d32939f"; // Address to monitor for deposits

type TransferEvent = {
  from: string;
  to: string;
  value: bigint;
}

const abi = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export class Bridge {
  private tokenContract: ethers.Contract;
  constructor(private provider: ethers.JsonRpcProvider) {
    this.provider = provider;
    this.tokenContract = new ethers.Contract(tokenAddress, abi, provider);
  }
  public async listenToOracle() {
    this.tokenContract.on("Transfer", (from, to, value, event) => {
      if (to.toLowerCase() === bridgeAddress.toLowerCase()) {
        this.onDeposit(from, to, value, event.transactionHash);
      }
    });
  }

  public async onDeposit(from: string, to: string, value: bigint, transactionHash: string) {
    console.log(`Deposit detected:`);
    console.log(`  From: ${from}`);
    console.log(`  To: ${to}`);
    console.log(`  Amount: ${ethers.formatEther(value)} tokens`);
    console.log(`  Transaction Hash: ${transactionHash}`);
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY is not set");
    }
    //const publicKey = await (await this.provider.getSigner()).getAddress();
    const mintCommand = new MintCommand(from, value, transactionHash, privateKey);
    await mintCommand.execute();
  }

  // public async replay() {
  //   // Get all transactions from the bridge contract
  //   // For each transaction, call onDeposit
  //   const events = await this.tokenContract.queryFilter("Transfer", 0, "latest");
  //   for (const event of events) {
  //     const transferEvent = event as TransferEvent;
  //     await this.onDeposit(transaction.data., transaction.args.to, transaction.args.value, transaction.transactionHash);
  //   }
  // }
}

