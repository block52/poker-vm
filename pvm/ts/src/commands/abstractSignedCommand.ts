import { ICommand, ISignedResponse } from "./interfaces";
import crypto from "../utils/crypto";
import { IJSONModel } from "../models/interfaces";

export abstract class AbstractCommand<T> implements ICommand<T> {
    constructor(protected readonly privateKey: string) {}

    public async execute(): Promise<ISignedResponse<T>> {
        const commandResult = await this.executeCommand();
        const data = typeof (commandResult as any).toJson === 'function' 
            ? (commandResult as IJSONModel).toJson() 
            : commandResult;

        const signature = await this.signResult(data);

        return {
            data,
            signature,
        };
    }

    public abstract executeCommand(): Promise<T>;

    private async signResult(result: T): Promise<string> {
        const message = JSON.stringify(result);
        return crypto.signData(this.privateKey, message);
    }
}
