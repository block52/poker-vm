import { getMempoolInstance, Mempool } from "../core/mempool";
import { Block, Transaction } from "../models";
import { BlockchainManagement, getBlockchainInstance } from "../state/blockchainManagement";
import { GameManagement } from "../state/gameManagement";
import { getTransactionInstance, TransactionManagement } from "../state/transactionManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import contractSchemas from "../schema/contractSchemas";
import { GameStateCommand } from "./gameStateCommand";
import GameState from "../schema/gameState";
import { AccountManagement, getAccountManagementInstance } from "../state/accountManagement";
import TexasHoldemGame from "../engine/texasHoldem";
import { ContractSchemaManagement, getContractSchemaManagement } from "../state/contractSchemaManagement";
import { IGameStateDocument } from "../models/interfaces";
import { GameOptions } from "@bitcoinbrisbane/block52";

export class MineCommand implements ISignedCommand<Block | null> {
    private readonly mempool: Mempool;
    private readonly accountManagement: AccountManagement;
    private readonly blockchainManagement: BlockchainManagement;
    private readonly transactionManagement: TransactionManagement;
    private readonly gameStateManagement: GameManagement;
    private readonly contractSchemaManagement: ContractSchemaManagement

    constructor(private readonly privateKey: string) {
        this.mempool = getMempoolInstance();
        this.accountManagement = getAccountManagementInstance();
        this.blockchainManagement = getBlockchainInstance();
        this.transactionManagement = getTransactionInstance();
        this.gameStateManagement = new GameManagement();
        this.contractSchemaManagement = getContractSchemaManagement();
    }

    public async execute(): Promise<ISignedResponse<Block | null>> {
        const txs = this.mempool.get();

        const validTxs: Transaction[] = this.validate(txs);
        const uniqueTxs: Transaction[] = await this.filter(validTxs);

        if (uniqueTxs.length === 0) {
            console.log("ℹ️ No transactions to process, will create an empty block");
        } else {
            // Log transaction details for debugging
            uniqueTxs.forEach((tx, idx) => {
                console.log(`🧾 Transaction ${idx + 1}/${uniqueTxs.length}:`, {
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to,
                    value: tx.value.toString(),
                    data: tx.data ? (tx.data.substring(0, 30) + (tx.data.length > 30 ? '...' : '')) : 'undefined'
                });
            });

            // IMPORTANT: We no longer process transactions here. 
            // BlockchainManagement.addBlock will do this for us to avoid double-processing.
            // Simply create the block and let addBlock handle the transaction processing

            // Process game-specific transactions (this is still needed)
            await this.processGameTransactions(uniqueTxs);
        }

        const lastBlock = await this.blockchainManagement.getLastBlock();
        const block = Block.create(lastBlock.index + 1, lastBlock.hash, uniqueTxs, this.privateKey);

        await this.blockchainManagement.addBlock(block);
        await this.mempool.clear();

        return signResult(block, this.privateKey);
    }

    private async processTransactions(txs: Transaction[]) {
        const validAccountTxs = await this.filter(txs);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < validAccountTxs.length; i++) {
            const tx = validAccountTxs[i];
            console.log(`\n🔄 Processing transaction ${i + 1}/${validAccountTxs.length}:`, {
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: tx.value.toString(),
                data: tx.data ? (tx.data.substring(0, 30) + (tx.data.length > 30 ? '...' : '')) : 'undefined'
            });

            try {
                // Check if accounts exist before attempting to update balances
                const [fromAccount, toAccount] = await Promise.all([
                    this.accountManagement.getAccount(tx.from),
                    this.accountManagement.getAccount(tx.to)
                ]);

                console.log(`👤 Account check:`, {
                    fromExists: !!fromAccount,
                    fromAddress: tx.from,
                    fromBalance: fromAccount ? fromAccount.balance.toString() : "N/A",
                    toExists: !!toAccount,
                    toAddress: tx.to,
                    toBalance: toAccount ? toAccount.balance.toString() : "N/A"
                });

                // Check if this is a mint transaction (data starts with "MINT_")
                const isMintTx = tx.data && tx.data.startsWith("MINT_");

                // For mint transactions, only increment the receiver's balance
                if (isMintTx) {
                    console.log(`💰 MINT Transaction detected: ${tx.data}`);
                    console.log(`🔼 Incrementing balance for ${tx.to} by ${tx.value.toString()}`);
                    await this.accountManagement.incrementBalance(tx.to, tx.value);
                } else {
                    // Normal transaction - decrement from sender, increment to receiver
                    console.log(`🔼 Incrementing balance for ${tx.to} by ${tx.value.toString()}`);
                    await this.accountManagement.incrementBalance(tx.to, tx.value);

                    console.log(`🔽 Decrementing balance for ${tx.from} by ${tx.value.toString()}`);
                    await this.accountManagement.decrementBalance(tx.from, tx.value);
                }

                console.log(`✅ Transaction ${tx.hash} processed successfully`);
                successCount++;
            }
            catch (error) {
                console.error(`❌ Error processing transaction ${tx.hash}:`, error);
                errorCount++;
            }
        }

        console.log(`\n📊 Transaction processing summary:`, {
            total: validAccountTxs.length,
            success: successCount,
            errors: errorCount
        });
    }

    private async processGameTransactions(txs: Transaction[]) {
        console.log(`Processing ${txs.length} game transactions`);
        const validGameTxs = await this.filterGameTransactions(txs);

        console.log(`Valid game transactions: ${validGameTxs.length}`);

        // find unique to addresses from the transactions
        const uniqueAddresses = new Set<string>();
        for (let i = 0; i < validGameTxs.length; i++) {
            const tx = validGameTxs[i];
            uniqueAddresses.add(tx.to);
        }

        const commands: GameStateCommand[] = [];

        // iterate over the unique addresses
        for (const address of uniqueAddresses) {
            const command = new GameStateCommand(address, this.privateKey);
            commands.push(command);
        }

        for (let i = 0; i < commands.length; i++) {
            try {
                const result = await commands[i].execute();
                // Save the game state to the database
                await this.gameStateManagement.saveFromJSON(result.data);
            } catch (error) {
                console.warn(`Error processing game transactions for address ${commands[i].address}: ${(error as Error).message}`);
            }
        }

        // Look for expired actions
        const gameStates = await this.gameStateManagement.getAll();
        const gameStateAddresses = gameStates.map((gameState: IGameStateDocument) => gameState.address);

        const gameOptionsCache = new Map<string, GameOptions>();

        for (let i = 0; i < gameStateAddresses.length; i++) {
            const address = gameStateAddresses[i];
            // Todo: do in parallel
            const gameOptions = await this.contractSchemaManagement.getGameOptions(address);
            gameOptionsCache.set(address, gameOptions);
        }

        for (let i = 0; i < gameStates.length; i++) {
            const gameState = gameStates[i];
            const gameOptions = gameOptionsCache.get(gameState.address);
            if (!gameOptions) {
                console.warn(`Game options not found for address ${gameState.address}`);
                continue;
            }
            const game = TexasHoldemGame.fromJson(gameState, gameOptions);
            const turn = game.getLastRoundAction();
            if (turn) {
            }
        }
    }

    private async filterGameTransactions(txs: Transaction[]): Promise<Transaction[]> {
        const validTxs: Transaction[] = [];

        for (let i = 0; i < txs.length; i++) {
            const tx = txs[i];
            const schema = await contractSchemas.findOne({ address: tx.to });

            if (!schema) {
                continue;
            }

            validTxs.push(tx);
        }

        return validTxs;
    }

    private validate(txs: Transaction[]): Transaction[] {
        const validTxs: Transaction[] = [];
        for (const tx of txs) {
            if (tx.verify()) {
                validTxs.push(tx);
            }
        }
        return validTxs;
    }

    private async filter(txs: Transaction[]): Promise<Transaction[]> {
        const validTxs: Transaction[] = [];
        let duplicateCount = 0;

        for (let i = 0; i < txs.length; i++) {
            const tx = txs[i];
            const exists = await this.transactionManagement.exists(tx.hash);

            if (exists) {
                duplicateCount++;
                continue;
            }
            validTxs.push(tx);
        }
        return validTxs;
    }
}