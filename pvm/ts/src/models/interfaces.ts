import { NonPlayerActionType, PlayerActionType } from "@bitcoinbrisbane/block52";

export interface IJSONModel {
    toJson(): any;
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
    balance: number;
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
    schemaAddress: string;
    state: any;
}

export interface ITransaction {
    to: string;
    from: string;
    value: bigint;
    timestamp: number;
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
    schema: any;
    hash: string;
}
