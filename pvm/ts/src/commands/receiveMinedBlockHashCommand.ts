import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class ReceiveMinedBlockHashCommand implements ISignedCommand<string> {
    constructor(
        private readonly blockHash: string,
        private readonly privateKey: string
    ) {}

    public async execute(): Promise<ISignedResponse<string>> {
        console.log(`Received mined block hash: ${this.blockHash}`);
        return signResult(this.blockHash, this.privateKey);
    }
}
