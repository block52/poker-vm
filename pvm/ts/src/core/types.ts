import { IJSONModel } from "../models/interfaces";

// Temporary types to be replaced with the actual types from the PVM
export type NodeResponse = {
    pubKey: string;
    url: string;
};

export class Node implements IJSONModel {
    public client: string;
    public publicKey: string;
    public url: string;
    public version: string;
    public isValidator: boolean;
    public readonly name: string;
    public height: number = 0;

    constructor(client: string, publicKey: string, url: string, version: string, isValidator: boolean, height: number, name?: string) {
        this.client = client;
        this.publicKey = publicKey;
        this.url = url;
        this.version = version;
        this.isValidator = isValidator;
        this.height = height;
        this.name = name || url;
    }

    public toJson(): NodeDTO {
        return {
            client: this.client,
            publicKey: this.publicKey,
            url: this.url,
            version: this.version,
            isValidator: this.isValidator,
            name: this.name,
            height: this.height,
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
    height: number;
};
