import { GameOptions } from "@block52/poker-vm-sdk";

export interface IJSONModel {
    toJson(): unknown;
}

export interface IModel extends IJSONModel {
    getId(): string;
}

export interface ICryptoModel extends IModel {
    calculateHash(): string;
    verify(): boolean;
}

export interface IAccountDocument {
    address: string;
    balance: string;
    nonce: number;
}

export interface IBlockDocument {
    index: number;
    version: number;
    hash: string;
    merkle_root: string;
    previous_block_hash: string;
    timestamp: number;
    validator: string;
    signature: string;
    tx_count?: number;
    transactions: string[];  // Array of transaction hashes, matching BlockDTO naming
}

export interface IGameStateDocument {
    address: string;
    gameOptions: GameOptions;
    state: unknown;
}

export interface ITransaction {
    to: string;
    from: string;
    value: bigint;
    data?: string;
}

export interface ITransactionDocument {
    nonce?: string;
    to: string;
    from: string;
    value: string;
    hash: string;
    signature: string;
    timestamp: string;
    index?: string;
    data?: string;
    block_hash?: string;
}

export interface IContractSchemaDocument {
    address: string;
    category: string;
    name: string;
    schema: unknown;
    hash: string;
}
