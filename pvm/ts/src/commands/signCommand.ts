
import { createSign } from "crypto";
import { AbstractCommand } from "./abstractSignedCommand";
import { ICommand } from "./interfaces";

export class SignCommand implements ICommand<String> {

    private privateKey: string;
    private hashAlgorithm: string = 'SHA256';

    constructor(readonly message: string) {
        this.message = message;

        this.privateKey = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgQr6U9vA6VsY9D9FG
eM9XsRv8b1gM7ZtZVc1p5IW+AXGhRANCAARUULCTnYsC8qS9D6lXd5zzR7XYcU/v
IGxwPjFJZyl5BbHKhgjZBBkGieTthxtX0FSOB3Pcy/W8ZMkP6AvUMqZ7
-----END PRIVATE KEY-----`;
    }

    public async executeCommand(): Promise<String> {
        const sign = createSign(this.hashAlgorithm);
        sign.update(this.message);
        sign.end();

        // Sign the message using the private key
        const signature = sign.sign(this.privateKey, 'hex');
        return signature;
    }
}
