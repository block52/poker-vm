import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { ZeroHash } from "ethers";

export class SharedSecretCommand implements ISignedCommand<string> {
    constructor(private readonly publicKey: string) {
        this.publicKey = publicKey.startsWith("0x") ? publicKey.slice(2) : publicKey;
    }

    public async execute(): Promise<ISignedResponse<string>> {
        // Cannot compute shared secret without a private key
        // Return empty string since validator key is no longer required
        const sharedSecret = "";

        // Sign with ZeroHash since we no longer require a validator key
        return await signResult(sharedSecret, ZeroHash);
    }
}
