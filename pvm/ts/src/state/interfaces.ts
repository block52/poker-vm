import { Account, Transaction } from "../models";

export interface IAccountManagement {
    createAccount(address: string): Promise<Account>;
    getAccount(address: string): Promise<Account>;
    getBalance(address: string): Promise<bigint>;
    incrementBalance(address: string, balance: bigint): Promise<void>;
    decrementBalance(address: string, balance: bigint): Promise<void>;
    applyTransaction(tx: Transaction): Promise<void>;
    applyTransactions(txs: Transaction[]): Promise<void>;
  }
  