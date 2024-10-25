import { ethers } from "ethers";
import { AbstractCommand } from "./abstractSignedCommand";

export class ResponseCommand extends AbstractCommand<string> {    
    constructor(readonly challenge: string, privateKey: string) {
        super(privateKey);
    }

    public async executeCommand(): Promise<string> {
        const wallet = new ethers.Wallet(this.privateKey);
        return await wallet.signMessage(this.challenge);
    }
}