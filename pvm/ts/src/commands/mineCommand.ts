import { getMempoolInstance, Mempool } from "../core/mempool";
import { Block, Transaction } from "../models";
import { BlockchainManagement, getBlockchainInstance } from "../state/blockchainManagement";
import { GameManagement } from "../state/gameManagement";
import { getTransactionInstance, TransactionManagement } from "../state/transactionManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import contractSchemas from "../schema/contractSchemas";
import { IContractSchemaDocument } from "../models/interfaces";
import { GameStateCommand } from "./gameStateCommand";
import GameState from "../schema/gameState";

export class MineCommand implements ISignedCommand<Block | null> {
    private readonly mempool: Mempool;
    private readonly blockchainManagement: BlockchainManagement;
    private readonly transactionManagement: TransactionManagement;
    private readonly gameStateManagement: GameManagement;

    constructor(private readonly privateKey: string) {
        this.mempool = getMempoolInstance();
        this.blockchainManagement = getBlockchainInstance();
        this.transactionManagement = getTransactionInstance();
        this.gameStateManagement = new GameManagement();
    }

    public async execute(): Promise<ISignedResponse<Block | null>> {
        const txs = this.mempool.get();

        const validTxs: Transaction[] = this.validate(txs);
        const uniqueTxs: Transaction[] = await this.filter(validTxs);
        await this.processGameTransactions(uniqueTxs);

        const lastBlock = await this.blockchainManagement.getLastBlock();
        const block = Block.create(lastBlock.index + 1, lastBlock.hash, uniqueTxs, this.privateKey);

        await this.blockchainManagement.addBlock(block);
        await this.mempool.clear();

        return signResult(block, this.privateKey);
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

        // execute the commands as promise all
        // await Promise.all(commands.map(c => c.execute()));
        for (let i = 0; i < commands.length; i++) {
            const result = await commands[i].execute();
            // const gameState = new GameState({
            //     address: result.data.address,
            //     state: result.data
            // });

            const json = result.data.toJson();
            
            await this.gameStateManagement.saveFromJSON(json);
        }
    }

    private async filterGameTransactions(txs: Transaction[]): Promise<Transaction[]> {
        const validTxs: Transaction[] = [];

        // txs.forEach(tx => {
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

    private unique(txs: Transaction[]): Transaction[] {
        const txMap = new Map<string, Transaction>();
        for (const tx of txs) {
            txMap.set(tx.hash, tx);
        }
        return Array.from(txMap.values());
    }

    private async filter(txs: Transaction[]): Promise<Transaction[]> {
        const validTxs: Transaction[] = [];

        for (let i = 0; i < txs.length; i++) {
            const tx = txs[i];
            if (await this.transactionManagement.exists(tx.hash)) {
                continue;
            }
            validTxs.push(tx);
        }

        return validTxs;
    }
}
