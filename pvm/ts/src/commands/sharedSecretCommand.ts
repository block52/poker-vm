import { ICommand } from "./interfaces";
import { ethers } from "ethers";

export class SharedSecretCommand implements ICommand<string> {
    constructor(private readonly publicKey: string) {
    }

    public async execute(): Promise<string> {
        // sign1 = new SigningKey(id("some-secret-1"))
        // sign2 = new SigningKey(id("some-secret-2"))
        
        // // Notice that privA.computeSharedSecret(pubB)...
        // sign1.computeSharedSecret(sign2.publicKey)
        // // '0x04b5bc2a5428042331a4c70da8f090d5552bdb35bc08a00ea8ed0a9b6d8737b8b7ea016b268d7cb9f02e11736b82b129ea3f37a8fdc6a7b0e9f5cdde4105ceb0de'
        
        // // ...is equal to privB.computeSharedSecret(pubA).
        // sign2.computeSharedSecret(sign1.publicKey)

        throw new Error("Method not implemented.");
    }
}
