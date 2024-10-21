import { Transaction } from "ethers";
import { ICommand } from "./interfaces";

export class TransferCommand implements ICommand<Transaction> {
    constructor(readonly from: string, readonly to: string, readonly amount: bigint) {
        this.from = from;
        this.to = to;
        this.amount = amount;
    }

    public async execute(): Promise<Transaction> {
        throw new Error("Method not implemented.");
    }
}
