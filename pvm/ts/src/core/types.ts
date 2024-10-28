import { IJSONModel } from "../models/interfaces";
import { TransactionDTO } from "@block52/sdk";

// Temporary types to be replaced with the actual types from the PVM
export type NodeResponse = {
    pubKey: string;
    url: string;
};

export class Node implements IJSONModel {
    client: string;
    publicKey: string;
    url: string;
    version: string;
    isValidator: boolean;
    name: string;

    constructor(client: string, publicKey: string, url: string, version: string, isValidator: boolean, name?: string) {
        this.client = client;
        this.publicKey = publicKey;
        this.url = url;
        this.version = version;
        this.isValidator = isValidator;
        this.name = name || url;
    }

    public toJson(): NodeDTO {
        return {
            client: this.client,
            publicKey: this.publicKey,
            url: this.url,
            version: this.version,
            isValidator: this.isValidator,
            name: this.name
        };
    }
};

export type NodeDTO = {
    client: string;
    publicKey: string;
    url: string;
    version: string;
    isValidator: boolean;
    name: string;
};

export type BlockDTO = {
    index: number;
    version: string;
    hash: string;
    merkleRoot: string;
    previousHash: string;
    timestamp: number;
    validator: string;
    signature: string;
    transactions: TransactionDTO[];
};

