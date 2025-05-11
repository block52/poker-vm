import { Redis } from "ioredis";
import { Account } from "../../models/account";
import { IAccountDocument } from "../../models/interfaces";
import { Transaction } from "../../models/transaction";
import { CONTRACT_ADDRESSES } from "../../core/constants";
import { IAccountManagement } from "../interfaces";

export class RedisAccountManagement implements IAccountManagement {
    private readonly redisClient: Redis;
    private readonly accountsKey: string;
    private isConnected: boolean = false;

    constructor(redisUrl: string, namespace: string = "pvm") {
        this.redisClient = new Redis(redisUrl);
        this.accountsKey = `${namespace}:accounts`;
    }

    /**
     * Connect to Redis
     */
    public async connect(): Promise<void> {
        if (!this.isConnected) {
            try {
                // Ping Redis to ensure connection is valid
                await this.redisClient.ping();
                this.isConnected = true;
            } catch (error) {
                throw new Error(`Failed to connect to Redis: ${error}`);
            }
        }
    }

    /**
     * Disconnect from Redis
     */
    public async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.redisClient.quit();
            this.isConnected = false;
        }
    }

    /**
     * Create a new account or retrieve an existing one
     * @param privateKey Private key for the account
     */
    public async createAccount(privateKey: string): Promise<Account> {
        const account = Account.create(privateKey);

        // If this account already exists, just return the existing account
        const existingAccount = await this._getAccount(account.address);
        if (existingAccount) {
            return this.getAccount(account.address);
        }

        // Store the new account in Redis
        await this.connect();
        await this.redisClient.hset(
            this.accountsKey,
            account.address,
            JSON.stringify({
                address: account.address,
                balance: account.balance.toString(),
                nonce: 0
            })
        );

        return account;
    }

    /**
     * Get an account by address
     * @param address Account address
     */
    public async getAccount(address: string): Promise<Account> {
        const account = await this._getAccount(address);

        if (!account) {
            return new Account(address, 0n);
        }

        return Account.fromDocument(account);
    }

    /**
     * Internal method to get account document
     * @param address Account address
     */
    private async _getAccount(address: string): Promise<IAccountDocument | null> {
        await this.connect();
        const accountJson = await this.redisClient.hget(this.accountsKey, address);

        if (!accountJson) {
            return null;
        }

        const account = JSON.parse(accountJson);
        return {
            address: account.address,
            balance: account.balance,
            nonce: account.nonce
        };
    }

    /**
     * Get account balance
     * @param address Account address
     */
    public async getBalance(address: string): Promise<bigint> {
        const account = await this.getAccount(address);
        return account.balance;
    }

    /**
     * Increment account balance
     * @param address Account address
     * @param amount Amount to increment
     */
    public async incrementBalance(address: string, amount: bigint): Promise<void> {
        if (amount < 0n) {
            console.log("Balance must be positive");
            return;
        }

        // Skip for bridge address
        if (address !== CONTRACT_ADDRESSES.bridgeAddress) {
            await this.connect();

            const account = await this._getAccount(address);
            if (!account) {
                // Create a new account with the specified balance
                await this.redisClient.hset(
                    this.accountsKey,
                    address,
                    JSON.stringify({
                        address,
                        balance: amount.toString(),
                        nonce: 0
                    })
                );
            } else {
                // Update existing account
                let balance = BigInt(account.balance);

                if (balance + amount < 0n) {
                    console.log("Insufficient funds");
                    return;
                }

                balance += amount;

                await this.redisClient.hset(
                    this.accountsKey,
                    address,
                    JSON.stringify({
                        address,
                        balance: balance.toString(),
                        nonce: account.nonce
                    })
                );
            }
        }
    }

    /**
     * Decrement account balance
     * @param address Account address
     * @param amount Amount to decrement
     */
    public async decrementBalance(address: string, amount: bigint): Promise<void> {
        if (amount < 0n) {
            console.log("Balance must be positive");
            return;
        }

        // Skip for bridge address
        if (address !== CONTRACT_ADDRESSES.bridgeAddress) {
            await this.connect();

            const account = await this._getAccount(address);
            if (!account) {
                console.log("Account not found");
                return;
            }

            const balance = BigInt(account.balance);

            if (balance - amount < 0n) {
                console.log("Insufficient funds");
                return;
            }

            const newBalance = balance - amount;

            await this.redisClient.hset(
                this.accountsKey,
                address,
                JSON.stringify({
                    address,
                    balance: newBalance.toString(),
                    nonce: account.nonce
                })
            );
        }
    }

    /**
     * Apply a transaction
     * @param tx Transaction to apply
     */
    public async applyTransaction(tx: Transaction): Promise<void> {
        // Use Redis transaction (multi) to ensure atomicity
        const multi = this.redisClient.multi();

        try {
            // Deduct from sender if specified
            if (tx.from) {
                const fromAccount = await this._getAccount(tx.from);

                if (fromAccount) {
                    const balance = BigInt(fromAccount.balance);

                    if (balance - tx.value < 0n) {
                        console.log("Insufficient funds");
                        return;
                    }

                    const newBalance = balance - tx.value;

                    multi.hset(
                        this.accountsKey,
                        tx.from,
                        JSON.stringify({
                            address: tx.from,
                            balance: newBalance.toString(),
                            nonce: fromAccount.nonce + 1 // Increment nonce on transaction
                        })
                    );
                } else {
                    console.log("Sender account not found");
                    return;
                }
            }

            // Add to recipient if specified
            if (tx.to) {
                const toAccount = await this._getAccount(tx.to);

                if (toAccount) {
                    const balance = BigInt(toAccount.balance);
                    const newBalance = balance + tx.value;

                    multi.hset(
                        this.accountsKey,
                        tx.to,
                        JSON.stringify({
                            address: tx.to,
                            balance: newBalance.toString(),
                            nonce: toAccount.nonce
                        })
                    );
                } else {
                    // Create new recipient account
                    multi.hset(
                        this.accountsKey,
                        tx.to,
                        JSON.stringify({
                            address: tx.to,
                            balance: tx.value.toString(),
                            nonce: 0
                        })
                    );
                }
            }

            // Execute the transaction
            await multi.exec();
        } catch (error) {
            console.error(`Transaction failed: ${error}`);
            // Discard the transaction
            multi.discard();
            throw error;
        }
    }

    /**
     * Apply multiple transactions
     * @param txs Transactions to apply
     */
    public async applyTransactions(txs: Transaction[]): Promise<void> {
        // Process transactions one by one to maintain consistency
        for (const tx of txs) {
            await this.applyTransaction(tx);
        }
    }

    /**
     * Get all accounts (useful for testing/debugging)
     */
    public async getAllAccounts(): Promise<Account[]> {
        await this.connect();

        const accountKeys = await this.redisClient.hkeys(this.accountsKey);
        const accounts: Account[] = [];

        for (const address of accountKeys) {
            const account = await this.getAccount(address);
            accounts.push(account);
        }

        return accounts;
    }

    /**
     * Reset all accounts (useful for testing)
     */
    public async reset(): Promise<void> {
        await this.connect();
        await this.redisClient.del(this.accountsKey);
    }
}

// Singleton instance
let instance: RedisAccountManagement;

export const getRedisAccountManagementInstance = (): IAccountManagement => {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    if (!instance) {
        instance = new RedisAccountManagement(redisUrl);
    }
    return instance;
};
