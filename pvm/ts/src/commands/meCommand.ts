import { getServerInstance, Server } from "../core/server";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class MeCommand implements ISignedCommand<any> {
    private readonly server: Server;

    constructor() {
        this.server = getServerInstance();
    }

    public async execute(): Promise<ISignedResponse<any>> {
        const info = await this.server.me();
        return {
            data: info,
            signature: "" // No signing required for basic server info
        };
    }
}
