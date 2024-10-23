import { ICommand } from "./interfaces";
import { randomBytes } from "crypto";

export class RandomCommand implements ICommand<Buffer> {
    constructor(private readonly size: number = 32, private readonly seed: string = "") {
    }

    public async execute(): Promise<Buffer> {
        const random: Buffer = await randomBytes(this.size);
        // return as hex string
        return random;
    }
}
