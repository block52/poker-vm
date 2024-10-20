import { IJSONModel } from "../models/interfaces";

export class Node implements IJSONModel {
    client: string;
    publicKey: string;
    url: string;
    version: string;
    isValidator: boolean;

    constructor(client: string, publicKey: string, url: string, version: string, isValidator: boolean) {
        this.client = client;
        this.publicKey = publicKey;
        this.url = url;
        this.version = version;
        this.isValidator = isValidator;
    }

    public toJson(): NodeDTO {
        return {
            client: this.client,
            publicKey: this.publicKey,
            url: this.url,
            version: this.version,
            isValidator: this.isValidator
        };
    }
};

export type NodeDTO = {
    client: string;
    publicKey: string;
    url: string;
    version: string;
    isValidator: boolean;
};