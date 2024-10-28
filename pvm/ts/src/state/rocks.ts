import { Account, Transaction } from "../models";
import { IAccountManagement } from "./interfaces";

import { Level } from "level";

export class Rocks implements IAccountManagement {

    private db: Level

    constructor() {
        this.db = new Level('./accounts', { valueEncoding: 'json' })
    }

    async createAccount(address: string): Promise<Account> {
        throw new Error("Method not implemented.");
    }

    async getAccount(address: string): Promise<Account> {
        const account = await this.db.get(address);

        return new Account(account.address, account.balance);
    }

    async getBalance(address: string): Promise<bigint> {
        throw new Error("Method not implemented.");
    }

    async incrementBalance(address: string, balance: bigint): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async decrementBalance(address: string, balance: bigint): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async applyTransaction(tx: Transaction): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async applyTransactions(txs: Transaction[]): Promise<void> {
        throw new Error("Method not implemented.");
    }

}