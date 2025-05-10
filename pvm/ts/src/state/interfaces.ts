import { Transaction } from "../models/transaction";
import { Account } from "../models/account";

export interface IAccountManagement {
    createAccount(privateKey: string): Promise<Account>;
    getAccount(address: string): Promise<Account>;
    incrementBalance(address: string, amount: bigint): Promise<void>;
    decrementBalance(address: string, amount: bigint): Promise<void>;
    applyTransaction(tx: Transaction): Promise<void>;
    applyTransactions(txs: Transaction[]): Promise<void>;
}