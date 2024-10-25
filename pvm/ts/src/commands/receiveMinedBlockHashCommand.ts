import { AbstractCommand } from "./abstractSignedCommand";

export class ReceiveMinedBlockHashCommand extends AbstractCommand<string> {
    constructor(private readonly blockHash: string, privateKey: string) {
        super(privateKey);
    }

    public async executeCommand(): Promise<string> {
        console.log(`Received mined block hash: ${this.blockHash}`);
        return this.blockHash;
    }
}
