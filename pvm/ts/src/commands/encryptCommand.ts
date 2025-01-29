import { createCipheriv, randomBytes } from "crypto";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { sha256, toUtf8Bytes } from "ethers";

interface EncryptedData {
    iv: string; // Initialization vector
    data: string; // Encrypted data
    authTag: string; // Authentication tag
}

export class EncryptCommand implements ISignedCommand<EncryptedData> {

    private _iv: Buffer = randomBytes(12); // 96-bit IV for GCM

    constructor(private readonly data: string, private readonly sharedSecret: string, private readonly privateKey: string, private iv?: string) {
        if (iv) {
            this._iv = Buffer.from(iv, "hex");
        }
    }

    public async execute(): Promise<ISignedResponse<EncryptedData>> {
        const key = this.deriveKey(this.sharedSecret);

        // Create cipher
        const cipher = createCipheriv("aes-256-gcm", key, this._iv);

        // Encrypt the data
        let encryptedData = cipher.update(this.data, "utf8", "hex");
        encryptedData += cipher.final("hex");

        // Get authentication tag
        const authTag = cipher.getAuthTag();

        const result: EncryptedData = {
            iv: this._iv.toString("hex"),
            data: encryptedData,
            authTag: authTag.toString("hex")
        };

        return await signResult(result, this.privateKey);
    }

    private deriveKey(sharedSecret: string): Buffer {
        // Remove '0x' prefix if present
        const secret = sharedSecret.startsWith("0x") ? sharedSecret.slice(2) : sharedSecret;
        return Buffer.from(sha256(toUtf8Bytes("0x" + secret)).slice(2), "hex");
    }
}
