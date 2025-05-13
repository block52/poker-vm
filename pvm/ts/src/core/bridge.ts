// Connect to Ethereum contract via EthersJS

// The contract is a standard ERC20 token contract

import { ethers, EventLog } from "ethers";
import { MintCommand } from "../commands/mintCommand";
import { createProvider } from "./provider";
import { CONTRACT_ADDRESSES } from "./constants";
import { createHash } from "crypto";

const abi = ["event Transfer(address indexed from, address indexed to, uint256 value)"];
const bridge_abi = [
    "event Deposited(address indexed account, uint256 amount, uint256 index)",
    "function deposits(uint256) view returns (address, uint256)",
    "function depositIndex() view returns (uint256)"
];

export class Bridge {
    private readonly bridgeContract: ethers.Contract;
    private readonly provider: ethers.JsonRpcProvider;

    constructor(private readonly nodeUrl: string) {
        this.provider = createProvider(this.nodeUrl);
        this.bridgeContract = new ethers.Contract(CONTRACT_ADDRESSES.bridgeAddress, bridge_abi, this.provider);
    }

    public async listenToBridge(): Promise<void> {
        const filter = this.bridgeContract.filters.Deposited();

        this.bridgeContract.on(filter, async (log: any) => {
            try {
                console.log("\n🔍 Raw Log:", log);

                // The args are already decoded by ethers
                const [account, amount, index] = log.args;
                const txHash = log.log.transactionHash;

                // Subtract 1 from index to match contract's 0-based indexing
                const adjustedIndex = index - 1n;

                console.log("\n🎯 Processing Live Deposit Event:", {
                    account,
                    amount: amount.toString(),
                    index: adjustedIndex.toString(),
                    txHash
                });

                await this.onDeposit(account, amount, adjustedIndex, txHash);
                console.log(`✅ Successfully processed live deposit at index ${adjustedIndex}`);
            } catch (error) {
                console.error("❌ Failed to process live deposit:", error);
            }
        });

        console.log("🎧 Listening for Deposited events...");
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

    public async resync(batchSize: bigint = 10n): Promise<void> {
        console.log("\n🔄 Bridge: Starting resync...");

        try {
            const count: bigint = await this.bridgeContract.depositIndex();

            if (count === 0n) {
                console.log("🚫 Bridge: No deposits found, skipping resync.");
                return;
            }

            // Then process each event with more logging
            let successCount = 0;
            let skippedCount = 0;
            let errorCount = 0;

            // Do in parallel in batches of 10 (default)
            const batches = Math.ceil(Number(count) / Number(batchSize));
            console.log(`📊 Bridge: Found ${batches} batches of deposits to process`);

            for (let batch = 0n; batch < batches; batch++) {
                const start = batch * batchSize;
                const end = Math.min(Number(start) + Number(batchSize), Number(count));
                console.log(`\n🔄 Bridge: Processing batch ${batch + 1n} of ${batches}`);

                const promises = [];
                for (let i = start; i < end; i++) {
                    promises.push(this.bridgeContract.deposits(i));
                }

                const results = await Promise.all(promises);

                for (let i = 0; i < results.length; i++) {
                    const [account, amount] = results[i];
                    console.log(`\n🔍 Bridge: Found deposit at index ${start + BigInt(i)}:`);

                    try {
                        const tx = createHash("sha256")
                            .update(`${start + BigInt(i)}-${account}-${amount}`)
                            .digest("hex");
                        await this.onDeposit(account, amount, start + BigInt(i), tx);
                        console.log(`✅ Successfully processed deposit at index ${start + BigInt(i)}`);
                        successCount++;
                    } catch (error) {
                        if ((error as Error).message === "Transaction already in blockchain") {
                            console.log(`⏭️ Skipping already processed deposit at index ${start + BigInt(i)}`);
                            skippedCount++;
                        } else {
                            console.log(`❌ Failed to process deposit: ${start + BigInt(i)}`);
                            errorCount++;
                        }
                    }
                }
            }

            // for (let i = 0n; i < count; i++) {
            //     const [account, amount] = await this.bridgeContract.deposits(i);
            //     console.log(`\n🔍 Bridge: Found deposit at index ${i}:`);

            //     try {
            //         const tx = createHash("sha256").update(`${i}-${account}-${amount}`).digest("hex");
            //         await this.onDeposit(account, amount, i, tx);
            //         console.log(`✅ Successfully processed deposit at index ${i}`);
            //         successCount++;
            //     } catch (error) {
            //         if ((error as Error).message === "Transaction already in blockchain") {
            //             console.log(`⏭️ Skipping already processed deposit at index ${i}`);
            //             skippedCount++;
            //         } else {
            //             console.log(`❌ Failed to process deposit: ${i}`);
            //             errorCount++;
            //         }
            //     }
            // }

            console.log("\n🏁 Bridge: Resync complete", {
                total: count,
                success: successCount,
                skipped: skippedCount,
                errors: errorCount
            });
        } catch (error) {
            console.error("\n💥 Bridge: Resync failed with error:", error);
            // Don't throw the error further - let the service continue running
        }
    }

    // Deprecated function
    public async resyncByEvents(): Promise<void> {
        console.log("\n🔄 Bridge: Starting resync...");

        try {
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
            let successCount = 0;
            let skippedCount = 0;
            let errorCount = 0;

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
                        await this.onDeposit(depositEvent.args.account, depositEvent.args.amount, index, depositEvent.transactionHash);
                        console.log(`✅ Successfully processed deposit at index ${index}`);
                        successCount++;
                    } catch (error) {
                        if ((error as Error).message === "Transaction already in blockchain") {
                            console.log(`⏭️ Skipping already processed deposit at index ${depositEvent.args.index - 1n}`);
                            skippedCount++;
                        } else {
                            console.log(`❌ Failed to process deposit:`, {
                                index: depositEvent.args.index.toString(),
                                error: (error as Error).message,
                                stack: (error as Error).stack
                            });
                            errorCount++;
                        }
                        // Continue with the next deposit instead of throwing
                    }
                }
            }

            console.log("\n🏁 Bridge: Resync complete", {
                total: events.length,
                success: successCount,
                skipped: skippedCount,
                errors: errorCount
            });
        } catch (error) {
            console.error("\n💥 Bridge: Resync failed with error:", error);
            // Don't throw the error further - let the service continue running
        }
    }
}
