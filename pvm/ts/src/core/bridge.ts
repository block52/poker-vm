// Connect to Ethereum contract via EthersJS

// The contract is a standard ERC20 token contract

import { ethers, EventLog } from "ethers";
import { MintCommand } from "../commands/mintCommand";
import { createProvider } from "./provider";
import { getTransactionInstance } from "../state/transactionManagement";
import { CONTRACT_ADDRESSES } from "./constants";

const abi = ["event Transfer(address indexed from, address indexed to, uint256 value)"];
const bridge_abi = ["event Deposited(address indexed account, uint256 amount, uint256 index)"];

export class Bridge {
    private bridgeContract: ethers.Contract;
    private readonly provider: ethers.JsonRpcProvider;
    private decimals: string = "6";

    constructor(private readonly nodeUrl: string) {
        this.provider = createProvider(this.nodeUrl);
        this.bridgeContract = new ethers.Contract(CONTRACT_ADDRESSES.bridgeAddress, bridge_abi, this.provider);
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

        const mintCommand = new MintCommand(index.toString(), transactionHash, privateKey);
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
        const mintCommand = new MintCommand(depositIndex, transactionHash, privateKey);
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
}
