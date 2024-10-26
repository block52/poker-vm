import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { RandomCommand } from "./randomCommand";

export class ChallengeCommand implements ISignedCommand<string> {
    public readonly randomCommand: RandomCommand;
    
    constructor(readonly publicKey: string, private readonly privateKey: string) {
        this.randomCommand = new RandomCommand(32, "", privateKey);
    }

    public async execute(): Promise<ISignedResponse<string>> {
        const random: ISignedResponse<Buffer> = await this.randomCommand.execute();
        const now = new Date();
        return signResult(`Challenge from ${this.publicKey} at ${now}: ${random.data.toString()}`, this.privateKey);
    }
}