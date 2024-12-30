// Connect to Ethereum contract via EthersJS

// The contract is a standard ERC20 token contract

import { ethers, EventLog } from "ethers";
import { MintCommand } from "../commands/mintCommand";
import { createProvider } from "./provider";
import { getTransactionInstance, TransactionManagement } from "../state/transactionManagement";

// const tokenAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"; // ERC20 token contract address
const bridgeAddress = "0x859329813d8e500F4f6Be0fc934E53AC16670fa0"; // Address to monitor for deposits

// type TransferEvent = {
//     from: string;
//     to: string;
//     value: bigint;
// };

// type DepositEvent = {
//     account: string;
//     amount: bigint;
//     index: bigint;
// };

const abi = ["event Transfer(address indexed from, address indexed to, uint256 value)"];
const bridge_abi = ["event Deposited(address indexed account, uint256 amount, uint256 index)"];

export class Bridge {
    // private tokenContract: ethers.Contract;
    private bridgeContract: ethers.Contract;
    private readonly provider: ethers.JsonRpcProvider;
    private decimals: string = "6";
    private readonly transactionManagement: TransactionManagement;

    constructor(private readonly nodeUrl: string) {
        this.provider = createProvider(this.nodeUrl);
        this.bridgeContract = new ethers.Contract(bridgeAddress, bridge_abi, this.provider);
        this.transactionManagement = getTransactionInstance();
    }

    public async listenToBridge(): Promise<void> {
        this.bridgeContract.on("Deposited", (account, amount, index, event) => {
            this.onDeposit(account, amount, index, event.transactionHash);
        });
    }

    public async onDeposit(from: string, value: bigint, index: bigint, transactionHash: string): Promise<void> {
        console.log(`Deposit detected:`);
        console.log(`  From: ${from}`);
        // console.log(`  Amount: ${ethers.formatUnits(value, this.decimals)} tokens`);
        // console.log(`  Amount: ${ethers.formatEther(value)} tokens`);
        console.log(`  Amount: ${value} tokens`);
        console.log(`  Index: ${index}`);
        console.log(`  Transaction Hash: ${transactionHash}`);

        const privateKey = process.env.VALIDATOR_KEY;

        if (!privateKey) {
            throw new Error("VALIDATOR_KEY is not set");
        }

        const mintCommand = new MintCommand(index.toString(), privateKey);
        await mintCommand.execute();
    }

    public async onTransfer(from: string, to: string, value: bigint, transactionHash: string): Promise<void> {
        console.log(`Deposit detected:`);
        console.log(`  From: ${from}`);
        console.log(`  To: ${to}`);
        console.log(`  Amount: ${ethers.formatEther(value)} tokens`);
        console.log(`  Transaction Hash: ${transactionHash}`);

        const privateKey = process.env.VALIDATOR_KEY;

        if (!privateKey) {
            throw new Error("VALIDATOR_KEY is not set");
        }

        //const publicKey = await (await this.provider.getSigner()).getAddress();
        const depositIndex = "0"; // Temp
        const mintCommand = new MintCommand(depositIndex, privateKey);
        await mintCommand.execute();
    }

    public async resync(): Promise<void> {
        // Get all transactions from the bridge contract
        // For each transaction, call onDeposit
        const events = await this.bridgeContract.queryFilter("Deposited", 0, "latest");

        for (const event of events) {
            console.log(event);
            const depositEvent = event as EventLog;
            if (depositEvent.args) {
                //TODO: FIX BUG IN CONTRACT, OUT BY 1 ERROR
                const index: bigint = depositEvent.args.index - 1n;
                await this.onDeposit(depositEvent.args.account, depositEvent.args.amount, index, depositEvent.transactionHash);
            }
        }
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
