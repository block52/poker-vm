import { ethers } from "ethers";

export class Account {
    address: string;
    balance: number;
    // private nonce: number;
    // private privateKey: string;

    constructor(address: string, balance: number) {
        this.address = address;
        this.balance = balance;
        // this.nonce = 0;
    }

    public getNextNonce(): number {
        return 0;
    }

    public toJson(): any {
        return {
            address: this.address,
            balance: this.balance,
        };
    }

    public static fromJson(json: any): Account {
        return new Account(json.address, json.balance);
    }

    public static create(privateKey: string): Account {
        const wallet = new ethers.Wallet(privateKey);
        const address = wallet.address;

        return new Account(address, 0);
    }
}