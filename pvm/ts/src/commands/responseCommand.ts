import { ethers } from "ethers";
import { ICommand } from "./interfaces";

export class ResponseCommand implements ICommand<string> {    
    constructor(readonly challenge: string, private readonly privateKey: string) {
    }

    public async execute(): Promise<string> {
        const wallet = new ethers.Wallet(this.privateKey);
        return await wallet.signMessage(this.challenge);
    }
}