import { ICommand } from "./interfaces";
import { RandomCommand } from "./randomCommand";
import { AbstractCommand } from "./abstractSignedCommand";

export class ChallengeCommand extends AbstractCommand<string> {
    public readonly randomCommand: ICommand<Buffer>;
    
    constructor(readonly publicKey: string, privateKey: string) {
        super(privateKey);
        this.randomCommand = new RandomCommand(32, "", privateKey);
    }

    public async executeCommand(): Promise<string> {
        const random = await this.randomCommand.execute();
        const now = new Date();
        return `Challenge from ${this.publicKey} at ${now}: ${random.toString()}`;
    }
}