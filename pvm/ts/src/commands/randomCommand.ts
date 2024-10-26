import { randomBytes } from "crypto";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class RandomCommand implements ISignedCommand<Buffer> {
    constructor(
        private readonly size: number = 32,
        private readonly seed: string = "",
        private readonly privateKey: string
    ) {}

    public async execute(): Promise<ISignedResponse<Buffer>> {
        const random: Buffer = await randomBytes(this.size);
        return signResult(random, this.privateKey);
    }
}
