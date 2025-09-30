import { Transaction } from "../models/transaction";
import { Account } from "../models/account";
import { Block } from "../models";
import { GameOptions } from "@bitcoinbrisbane/block52";
import { IGameStateDocument } from "../models/interfaces";

export interface IAccountManagement {
    createAccount(privateKey: string): Promise<Account>;
    getAccount(address: string): Promise<Account>;
    getBalance(address: string): Promise<bigint>;
    incrementBalance(address: string, amount: bigint): Promise<void>;
    decrementBalance(address: string, amount: bigint): Promise<void>;
    applyTransaction(tx: Transaction): Promise<void>;
    applyTransactions(txs: Transaction[]): Promise<void>;
}

export interface IBlockchainManagement {
    addBlock(block: Block): Promise<void>;
    getGenesisBlock(): Block;
    getBlockHeight(): Promise<number>;
    getLastBlock(): Promise<Block>;
    getBlockByHash(hash: string): Promise<Block | null>;
    getBlockByIndex(index: number): Promise<Block | null>;
    getBlock(index: number): Promise<Block>;
    getBlocks(count?: number): Promise<Block[]>;
    reset(): Promise<void>;
}

// export interface IContractSchemaManagement {
//     getByAddress(address: string): Promise<IContractSchemaDocument>;
//     getGameOptions(address: string): Promise<GameOptions>;
// }

export interface IGameManagement {
    getAll(): Promise<IGameStateDocument[]>;
    getByAddress(address: string): Promise<IGameStateDocument | null>;
    getGameOptions(address: string): Promise<GameOptions>;
    getState(address: string): Promise<any | null>;
    create(nonce: bigint, owner: string, gameOptions: GameOptions, timestamp?: string): Promise<string>;
    saveFromJSON(json: any): Promise<void>;
}

export interface ITransactionManagement {
    addTransaction(tx: Transaction): Promise<void>;
    addTransactions(txs: Transaction[], blockHash: string): Promise<void>;
    exists(txid: string): Promise<Boolean>;
    getTransactions(blockHash: string, count?: number): Promise<Transaction[]>;
    getTransaction(txid: string): Promise<Transaction | null>;
    getTransactionByIndex(index: string): Promise<Transaction | null>;
    getTransactionByData(data: string): Promise<Transaction | null>;
    getTransactionsByAddress(address: string, count?: number): Promise<Transaction[]>;
}
