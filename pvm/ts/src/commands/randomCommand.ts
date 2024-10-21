import { ICommand } from "./interfaces";
import { randomBytes } from "crypto";

export class RandomCommand implements ICommand<string> {
    constructor(private readonly size: number = 32, private readonly seed: string = "") {
    }

    public async execute(): Promise<string> {
        const random = await randomBytes(this.size).toString("hex");
        return random;
    }
}
