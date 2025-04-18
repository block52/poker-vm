import { TransactionDTO } from "@bitcoinbrisbane/block52";

// export interface Transaction {
//     nonce: string;
//     to: string;
//     from: string;
//     value: string;
//     hash: string;
//     signature: string;
//     timestamp: string;
//     data: string;
// }

export interface Block {
    index: number;
    hash: string;
    previousHash: string;
    merkleRoot: string;
    signature: string;
    timestamp: number;
    validator: string;
    version: string;
    transactions: TransactionDTO[];
    transactionCount: number;
}