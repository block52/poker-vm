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
        const filter = this.bridgeContract.filters.Deposited();
        
        this.bridgeContract.on(filter, async (account: string, amount: bigint, index: bigint, event: any) => {
            try {
                // Generate a random hash if we can't get the real one
                const txHash = event.transactionHash || ethers.hexlify(ethers.randomBytes(32));
                
                console.log("\n🔍 Event Details:", {
                    event,
                    txHash
                });
                
                console.log("\n🎯 Processing Live Deposit Event:", {
                    account,
                    amount: amount.toString(),
                    index: index.toString(),
                    txHash
                });

                // onDeposit creates a MintCommand with:
                // - index: to track deposit order
                // - txHash: for reference (using random if real not available)
                // - account: the depositor's address
                await this.onDeposit(account, amount, index, txHash);
                console.log(`✅ Successfully processed live deposit at index ${index}`);
            } catch (error) {
                console.error("❌ Failed to process live deposit:", error);
            }
        });
    }

    public async onDeposit(receiver: string, value: bigint, index: bigint, transactionHash: string): Promise<void> {
        console.log(`\n🏦 Deposit Processing:`, {
            receiver,
            value: {
                raw: value.toString(),
                hex: `0x${value.toString(16)}`,
                decimal: Number(value)
            },
            index: {
                raw: index.toString(),
                hex: `0x${index.toString(16)}`,
                decimal: Number(index)
            },
            transactionHash
        });

        const privateKey = process.env.VALIDATOR_KEY;

        if (!privateKey) {
            throw new Error("VALIDATOR_KEY is not set");
        }

        try {
            console.log("🔨 Creating MintCommand with:", {
                index: index.toString(),
                txHash: transactionHash,
                privateKeyPresent: !!privateKey
            });

            const mintCommand = new MintCommand(index.toString(), transactionHash, privateKey);
            console.log("⚡ Executing MintCommand...");
            await mintCommand.execute();
        } catch (e) {
            console.error("💥 MintCommand Error:", e);
            throw e;
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
        
        const events = await this.bridgeContract.queryFilter("Deposited", 0, "latest");
        console.log(`📊 Bridge: Found ${events.length} deposit events to process`);

        // First, log all events found with more detail
        console.log("\n📋 Bridge: All found events (Raw Format):");
        events.forEach((event, i) => {
            const depositEvent = event as EventLog;
            if (depositEvent.args) {
                console.log(`\n🔍 Event ${i} Details:`, {
                    blockNumber: depositEvent.blockNumber,
                    txHash: depositEvent.transactionHash,
                    raw_data: {
                        account: depositEvent.args.account,
                        amount: {
                            raw: depositEvent.args.amount.toString(),
                            hex: `0x${depositEvent.args.amount.toString(16)}`,
                            decimal: Number(depositEvent.args.amount)
                        },
                        index: {
                            raw: depositEvent.args.index.toString(),
                            hex: `0x${depositEvent.args.index.toString(16)}`,
                            decimal: Number(depositEvent.args.index)
                        }
                    }
                });
            }
        });

        // Then process each event with more logging
        for (const event of events) {
            const depositEvent = event as EventLog;
            if (depositEvent.args) {
                console.log("\n🎯 Processing Deposit Event:", {
                    raw_index: depositEvent.args.index.toString(),
                    adjusted_index: (depositEvent.args.index - 1n).toString(),
                    account: depositEvent.args.account,
                    amount: {
                        raw: depositEvent.args.amount.toString(),
                        hex: `0x${depositEvent.args.amount.toString(16)}`,
                        decimal: Number(depositEvent.args.amount)
                    },
                    txHash: depositEvent.transactionHash,
                    blockNumber: depositEvent.blockNumber
                });

                try {
                    console.log("📤 Calling onDeposit with parameters:", {
                        receiver: depositEvent.args.account,
                        value: depositEvent.args.amount.toString(),
                        index: (depositEvent.args.index - 1n).toString(),
                        txHash: depositEvent.transactionHash
                    });

                    const index: bigint = depositEvent.args.index - 1n;
                    await this.onDeposit(
                        depositEvent.args.account, 
                        depositEvent.args.amount, 
                        index, 
                        depositEvent.transactionHash
                    );
                    console.log(`✅ Successfully processed deposit at index ${index}`);
                } catch (error) {
                    console.log(`❌ Failed to process deposit:`, {
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
