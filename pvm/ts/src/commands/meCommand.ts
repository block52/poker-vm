import { ISignedCommand, ISignedResponse } from "./interfaces";

const VERSION = "1.0.3";
const PORT = 8545;

interface ServerInfo {
    name: string;
    version: string;
    url: string;
}

export class MeCommand implements ISignedCommand<ServerInfo> {
    constructor() { }

    public async execute(): Promise<ISignedResponse<ServerInfo>> {
        const info: ServerInfo = {
            name: "pvm-typescript",
            version: VERSION,
            url: `http://localhost:${PORT}`
        };
        return {
            data: info,
            signature: "" // No signing required for basic server info
        };
    }
}
