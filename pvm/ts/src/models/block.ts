import { ICryptoModel } from "./interfaces";

export class Block implements ICryptoModel {
    getHash(): string {
        throw new Error("Method not implemented.");
    }
    isValid(): boolean {
        throw new Error("Method not implemented.");
    }
    getId(): string {
        throw new Error("Method not implemented.");
    }
    toJson() {
        throw new Error("Method not implemented.");
    }
    
}