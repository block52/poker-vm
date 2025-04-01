import { connectDB } from "../data/dbConfig";
import Accounts from "../schema/accounts";
import Blocks from "../schema/blocks";
import Transactions from "../schema/transactions";
import GameState from "../schema/gameState";
import { ICommand } from "./interfaces";
import { getBlockchainInstance } from "../state/blockchainManagement";
import { getMempoolInstance } from "../core/mempool";
import { getServerInstance } from "../core/server";
import { Bridge } from "../core/bridge";

export class ResetCommand implements ICommand<boolean> {
    constructor(private readonly preserveContractSchemas: boolean = true) {}
    
    public async execute(): Promise<boolean> {
        try {
            // Connect to the database
            await connectDB.connect(process.env.DB_URL || "mongodb://localhost:27017/pvm");
            
            console.log("🧹 Starting blockchain reset...");
            
            // Clear all collections except contractSchemas
            console.log("🗑️ Clearing collections...");
            await Promise.all([
                Accounts.deleteMany({}),
                Blocks.deleteMany({}),
                Transactions.deleteMany({}),
                GameState.deleteMany({})
            ]);
            
            // Clear the mempool
            console.log("🧼 Clearing mempool...");
            const mempool = getMempoolInstance();
            mempool.clear();
            
            // Re-initialize blockchain with genesis block
            console.log("🌱 Reinitializing blockchain with genesis block...");
            const blockchain = getBlockchainInstance();
            
            // The genesis block should be automatically created when getting the last block
            // after clearing the blocks collection
            await blockchain.getLastBlock();
            
            // Re-process deposits to recreate accounts and balances
            console.log("💰 Reprocessing deposits to recreate accounts...");
            const server = getServerInstance();
            
            // Reset the deposit sync date to force a full resync
            server._lastDepositSync = new Date("2000-01-01");
            
            // Trigger deposit sync manually
            if (process.env.RPC_URL) {
                try {
                    const bridge = new Bridge(process.env.RPC_URL);
                    console.log("♻️ Resyncing bridge deposits...");
                    await bridge.resync();
                    console.log("🎧 Setting up bridge listener...");
                    await bridge.listenToBridge();
                } catch (error) {
                    console.error("⚠️ Bridge sync error:", error);
                    // Continue even if bridge sync fails
                }
            } else {
                console.warn("⚠️ No RPC_URL set, skipping bridge resync");
            }
            
            console.log("✅ Blockchain reset completed successfully");
            return true;
        } catch (error) {
            console.error("❌ Failed to reset blockchain:", error);
            return false;
        }
    }
}