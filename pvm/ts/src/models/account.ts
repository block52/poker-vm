import { ethers } from "ethers";
import { IAccountDocument } from "./interfaces";

export class Account {
    address: string;
    balance: bigint;
    // private nonce: number;
    // private privateKey: string;

    constructor(address: string, balance: bigint) {
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

    public static fromDocument(document: IAccountDocument): Account {
        return new Account(document.address, BigInt(document.balance));
    }

    public toDocument(): IAccountDocument {
        return {
            address: this.address,
            balance: Number(this.balance),
            nonce: 0,
        };
    }

    public static create(privateKey: string): Account {
        const wallet = new ethers.Wallet(privateKey);
        const address = wallet.address;

        return new Account(address, 0n);
    }
}
