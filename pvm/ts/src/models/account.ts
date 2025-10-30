import { ethers } from "ethers";
import { IAccountDocument } from "./interfaces";
import { AccountDTO } from "@bitcoinbrisbane/block52";

export class Account implements IAccountDocument {
    address: string;
    balance: string;
    nonce: number;

    constructor(address: string, balance: bigint, nonce: number = 0) {
        this.address = address;
        this.balance = balance.toString();
        this.nonce = nonce;
    }

    public getNextNonce(): number {
        return this.nonce++;
    }

    public toJson(): AccountDTO {
        return {
            address: this.address,
            balance: this.balance.toString(),
            nonce: this.nonce
        };
    }

    public static fromJson(json: AccountDTO): Account {
        return new Account(json.address, BigInt(json.balance));
    }

    public static fromDocument(document: IAccountDocument): Account {
        return new Account(document.address, BigInt(document.balance), document.nonce);
    }

    public toDocument(): IAccountDocument {
        return {
            address: this.address,
            balance: this.balance,
            nonce: this.nonce
        };
    }

    public static create(privateKey: string): Account {
        const wallet = new ethers.Wallet(privateKey);
        const address = wallet.address;

        return new Account(address, 0n);
    }
}
