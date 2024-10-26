import { ICommand, ISignedResponse } from "./interfaces";
import crypto from "../utils/crypto";
import { IJSONModel } from "../models/interfaces";

export abstract class AbstractCommand<T> implements ICommand<T> {
    constructor(protected readonly privateKey: string) { }

    public async execute(): Promise<ISignedResponse<T>> {
        const commandResult = await this.executeCommand();
        const data =
            typeof (commandResult as any).toJson === "function"
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

    private castPemToHex(key: string): string {
        // Remove the PEM header and footer
        const pem = key
            .replace(/-----BEGIN [\w\s]+-----/, "")
            .replace(/-----END [\w\s]+-----/, "")
            .replace(/\n/g, "");

        // Decode the base64-encoded content
        const binaryKey = Buffer.from(pem, "base64");

        // Convert the binary data to a hexadecimal string
        return binaryKey.toString("hex");
    }

    private hexToPem(hexKey: string): string {
        if (!hexKey || hexKey.length === 0 || hexKey.length % 2 !== 0) {
            throw new Error("Invalid hex key");
        }

        // Determine the key type
        const keyType = hexKey.length === 64 ? "PRIVATE KEY" : "PUBLIC KEY";


        // Convert hex to binary buffer
        const binaryKey = Buffer.from(hexKey, "hex");

        // Encode the binary key in base64
        const base64Key = binaryKey.toString("base64");
        if (!base64Key) {
            throw new Error("Error converting key to base64");
        }

        // Format the base64 string into PEM format (64 characters per line)
        const matchResult = base64Key.match(/.{1,64}/g);
        if (!matchResult) {
            throw new Error("Error formatting key");
        }
        const formattedKey = matchResult.join("\n");

        // Wrap with PEM headers and footers
        return `-----BEGIN ${keyType}-----\n${formattedKey}\n-----END ${keyType}-----`;
    }
}
