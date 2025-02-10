// Connect to Ethereum contract via EthersJS

// The contract is a standard ERC20 token contract

import { ethers, EventLog } from "ethers";
import { MintCommand } from "../commands/mintCommand";
import { createProvider } from "./provider";
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

    public async onDeposit(receiver: string, value: bigint, index: bigint, transactionHash: string): Promise<void> {
        console.log(`Deposit detected to ${receiver}: ${value} tokens at index ${index} with transaction hash ${transactionHash}`);
        const privateKey = process.env.VALIDATOR_KEY;

        if (!privateKey) {
            throw new Error("VALIDATOR_KEY is not set");
        }

        try {
            const mintCommand = new MintCommand(index.toString(), transactionHash, privateKey);
            await mintCommand.execute();
        } catch (e) {
            console.error(e);
        }
    }

    // Remove this function
    public async onTransfer(receiver: string, to: string, value: bigint, transactionHash: string): Promise<void> {
        const privateKey = process.env.VALIDATOR_KEY;

        if (!privateKey) {
            throw new Error("VALIDATOR_KEY is not set");
        }

        try {
            //const publicKey = await (await this.provider.getSigner()).getAddress();
            const depositIndex = "0"; // Temp
            const mintCommand = new MintCommand(depositIndex, transactionHash, privateKey);
            await mintCommand.execute();
        } catch (e) {
            console.error(e);
        }
    }

    public async resync(): Promise<void> {
        console.log("\n🔄 Bridge: Starting resync...");
        
        // Get all transactions from the bridge contract
        const events = await this.bridgeContract.queryFilter("Deposited", 0, "latest");
        console.log(`📊 Bridge: Found ${events.length} deposit events to process`);

        // First, log all events found
        console.log("\n📋 Bridge: All found events:");
        events.forEach((event, i) => {
            const depositEvent = event as EventLog;
            if (depositEvent.args) {
                console.log(`\nEvent ${i}:`, {
                    blockNumber: depositEvent.blockNumber,
                    txHash: depositEvent.transactionHash,
                    raw_data: {
                        account: depositEvent.args.account,
                        amount: depositEvent.args.amount.toString(),
                        amountInEth: Number(depositEvent.args.amount) / 1e18,
                        index: depositEvent.args.index.toString()
                    }
                });
            }
        });

        // Then process each event
        for (const event of events) {
            const depositEvent = event as EventLog;
            if (depositEvent.args) {
                // Log the raw event data
                console.log("\n📝 Bridge: Processing deposit event:", {
                    raw_index: depositEvent.args.index.toString(),
                    adjusted_index: (depositEvent.args.index - 1n).toString(),
                    account: depositEvent.args.account,
                    amount: depositEvent.args.amount.toString(),
                    amountInEth: Number(depositEvent.args.amount) / 1e18,
                    txHash: depositEvent.transactionHash,
                    blockNumber: depositEvent.blockNumber,
                    // Add full event data for debugging
                    raw_event: {
                        args: {
                            account: depositEvent.args.account,
                            amount: depositEvent.args.amount.toString(),
                            index: depositEvent.args.index.toString()
                        },
                        event: depositEvent.fragment.name,
                        eventSignature: depositEvent.eventSignature,
                    }
                });

                try {
                    //TODO: FIX BUG IN CONTRACT, OUT BY 1 ERROR
                    const index: bigint = depositEvent.args.index - 1n;
                    await this.onDeposit(
                        depositEvent.args.account, 
                        depositEvent.args.amount, 
                        index, 
                        depositEvent.transactionHash
                    );
                    console.log(`✅ Bridge: Successfully processed deposit at index ${index}`);
                } catch (error) {
                    console.log(`❌ Bridge: Failed to process deposit:`, {
                        index: depositEvent.args.index.toString(),
                        error: (error as Error).message,
                        stack: (error as Error).stack
                    });
                }
            }
        }
        
        console.log("\n🏁 Bridge: Resync complete");
    }
}
