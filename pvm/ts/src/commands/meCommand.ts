import { ISignedCommand, ISignedResponse } from "./interfaces";
import { readFileSync } from "fs";
import { join } from "path";

// Read version from package.json as single source of truth
const packageJson = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf-8"));
const VERSION = packageJson.version;
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
