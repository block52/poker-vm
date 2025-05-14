import { getMempoolInstance, Mempool } from "../core/mempool";
import { Block, Transaction } from "../models";
import { getGameManagementInstance } from "../state/index";
import { getBlockchainInstance, getTransactionInstance, getContractSchemaManagementInstance } from "../state/index";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import contractSchemas from "../schema/contractSchemas";
import { GameStateCommand } from "./gameStateCommand";
import TexasHoldemGame from "../engine/texasHoldem";
import { IGameStateDocument } from "../models/interfaces";
import { GameOptions, PlayerActionType } from "@bitcoinbrisbane/block52";
import { ethers } from "ethers";
import { IBlockchainManagement, IContractSchemaManagement, IGameManagement, ITransactionManagement } from "../state/interfaces";

export class MineCommand implements ISignedCommand<Block | null> {
    private readonly mempool: Mempool;
    private readonly blockchainManagement: IBlockchainManagement;
    private readonly transactionManagement: ITransactionManagement;
    private readonly gameStateManagement: IGameManagement;
    private readonly contractSchemaManagement: IContractSchemaManagement;

    constructor(private readonly privateKey: string) {
        this.mempool = getMempoolInstance();
        this.blockchainManagement = getBlockchainInstance();
        this.transactionManagement = getTransactionInstance();
        this.gameStateManagement = getGameManagementInstance();
        this.contractSchemaManagement = getContractSchemaManagementInstance();
    }

    public async execute(): Promise<ISignedResponse<Block | null>> {
        await this.expireActions();
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
                    data: tx.data ? tx.data.substring(0, 30) + (tx.data.length > 30 ? "..." : "") : "undefined"
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
            // Do in God mode
            const command = new GameStateCommand(address, this.privateKey, ethers.ZeroAddress);
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
    }

    private async expireActions(): Promise<void> {
        // Look for expired actions
        const gameStates = await this.gameStateManagement.getAll();
        const gameStateAddresses = gameStates.map((gameState: IGameStateDocument) => gameState.address);

        if (gameStateAddresses.length === 0) {
            console.log("No game states found");
            return;
        }

        const gameOptionsCache = new Map<string, GameOptions>();

        for (let i = 0; i < gameStateAddresses.length; i++) {
            const address = gameStateAddresses[i];
            // Todo: do in parallel
            const gameOptions = await this.contractSchemaManagement.getGameOptions(address);
            gameOptionsCache.set(address, gameOptions);
        }

        const now = new Date();
        for (let i = 0; i < gameStates.length; i++) {
            const gameState = gameStates[i];
            const gameOptions = gameOptionsCache.get(gameState.address);

            if (!gameOptions) {
                console.warn(`Game options not found for address ${gameState.address}`);
                continue;
            }

            const game = TexasHoldemGame.fromJson(gameState.state, gameOptions);
            const turn = game.getLastRoundAction();
            if (turn) {
                const expirationDate = new Date(turn.timestamp);
                expirationDate.setSeconds(expirationDate.getSeconds() + gameOptions.timeout);

                const turnIndex = game.getTurnIndex();

                if (now > expirationDate) {
                    const transaction = new Transaction(
                        gameState.address,
                        turn.playerId,
                        BigInt(0),
                        ethers.ZeroHash,
                        ethers.ZeroHash,
                        Date.now(),
                        0n,
                        undefined,
                        `${PlayerActionType.FOLD},${turnIndex}`
                    );

                    this.mempool.add(transaction);
                    console.log(`Expired action for game ${gameState.address} and player ${turn.playerId}`);
                }
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
