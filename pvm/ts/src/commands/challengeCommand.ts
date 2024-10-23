import { ICommand } from "./interfaces";
import { RandomCommand } from "./randomCommand";

export class ChallengeCommand implements ICommand<string> {
    public readonly randomCommand: ICommand<Buffer>;
    
    constructor(readonly publicKey: string) {
        this.randomCommand = new RandomCommand(32, "");
    }

    public async execute(): Promise<string> {
        const random = await this.randomCommand.execute();
        const now = new Date();
        return `Challenge from ${this.publicKey} at ${now}: ${random.toString("hex")}`;
    }
}