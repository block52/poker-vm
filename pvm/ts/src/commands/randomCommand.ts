import { AbstractCommand } from "./abstractSignedCommand";
import { ICommand } from "./interfaces";
import { randomBytes } from "crypto";

export class RandomCommand extends AbstractCommand<Buffer> {
    constructor(private readonly size: number = 32, private readonly seed: string = "", privateKey: string) {
        super(privateKey);
    }

    public async executeCommand(): Promise<Buffer> {
        const random: Buffer = await randomBytes(this.size);
        // return as hex string
        return random;
    }
}
