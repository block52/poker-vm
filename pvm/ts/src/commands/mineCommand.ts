import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Block, Transaction } from "../models";

import { BlockchainManagement, getBlockchainInstance } from "../state/blockchainManagement";
import { GameManagement } from "../state/gameManagement";
import { getTransactionInstance, TransactionManagement } from "../state/transactionManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import contractSchemas from "../schema/contractSchemas";
import { IContractSchemaDocument } from "../models/interfaces";
import TexasHoldemGame from "../engine/texasHoldem";

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

        const lastBlock = await this.blockchainManagement.getLastBlock();
        const block = Block.create(lastBlock.index + 1, lastBlock.hash, uniqueTxs, this.privateKey);

        await this.blockchainManagement.addBlock(block);
        await this.mempool.clear();

        return signResult(block, this.privateKey);
    }

    private async processGameTransactions(txs: Transaction[]) {
        
        for (let i = 0; i < txs.length; i++) {
            const tx = txs[i];
            const schema = await contractSchemas.findOne({ address: tx.to });

            if (!schema) {
                continue;
            }

            // get last game state
            const gameState = await this.gameStateManagement.get(tx.to);

            if (schema.category === "texasholdem") {
                const game = TexasHoldemGame.fromJson(gameState);
                game.performAction(tx.from, PlayerActionType.BET, tx.value);

                // update game state
                await this.gameStateManagement.save(game.state);
            }
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

            // if (schema) {
            //     const args = schema.schema.split(",");
            //     const game = this.gameStateManagement.getGame(txs[i].to);
            //     if (!game) {
            //         continue;
            //     }

            //     const tx = txs[i];
            //     if (tx.verify()) {
            //         validTxs.push(tx);
            //     }
            // }

            // switch (tx.data) {
            //     case "join":
            //         // const player = new Player(tx.from, Number(tx.value));
            //         game.join2(tx.from, tx.value);
            //         break;
            //     case "bet":
            //         game.performAction(tx.from, PlayerActionType.BET, tx.value);
            //         break;
            //     case "call":
            //         game.performAction(tx.from, PlayerActionType.CALL, tx.value);
            //         break;
            //     case "fold":
            //         game.performAction(tx.from, PlayerActionType.FOLD, 0n);
            //         break;
            //     case "check":
            //         game.performAction(tx.from, PlayerActionType.CHECK, 0n);
            //         break;
            //     case "raise":
            //         game.performAction(tx.from, PlayerActionType.RAISE, tx.value);
            //         break;
            //     default:
            //         throw new Error("Invalid action");
            // };
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
