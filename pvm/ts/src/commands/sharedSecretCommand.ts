import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { SigningKey } from "ethers";

export class SharedSecretCommand implements ISignedCommand<string> {
    constructor(
        private readonly publicKey: string,
        private readonly privateKey: string
    ) {
        this.publicKey = publicKey.startsWith("0x") ? publicKey.slice(2) : publicKey;
        this.privateKey = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
    }

    public async execute(): Promise<ISignedResponse<string>> {
        const signingKey = new SigningKey(this.privateKey);
        const sharedSecret = signingKey.computeSharedSecret(this.publicKey);

        return await signResult(sharedSecret, this.privateKey);
    }
}
