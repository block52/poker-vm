import { ethers } from "ethers";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class ResponseCommand implements ISignedCommand<string> {
    constructor(
        readonly challenge: string,
        private readonly privateKey: string
    ) {}

    public async execute(): Promise<ISignedResponse<string>> {
        const wallet = new ethers.Wallet(this.privateKey);
        return signResult(
            await wallet.signMessage(this.challenge),
            this.privateKey
        );
    }
}
