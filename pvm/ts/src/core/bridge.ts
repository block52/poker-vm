// Connect to Ethereum contract via EthersJS

// The contract is a standard ERC20 token contract

import { ethers } from "ethers";
import { MintCommand } from "../commands/mintCommand";

export function createProvider(nodeUrl: string): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider(nodeUrl);
}

// Listen to Oracle
const infuraUrl = process.env.RPC_URL ?? "";
const provider = createProvider(infuraUrl);

const tokenAddress = process.env.TOKEN_CONTRACT_ADDRESS ?? "";
const bridgeAddress = process.env.BRIDGE_CONTRACT_ADDRESS ?? "";

type TransferEvent = {
    from: string;
    to: string;
    value: bigint;
};

const abi = ["event Transfer(address indexed from, address indexed to, uint256 value)"];

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
        const depositIndex = "0"; // Temp
        const mintCommand = new MintCommand(depositIndex, privateKey);
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
