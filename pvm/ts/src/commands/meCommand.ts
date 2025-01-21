import { getServerInstance, Server } from "../core/server";
import { Node } from "../core/types";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class MeCommand implements ISignedCommand<Node> {
    private readonly server: Server;

    constructor(private readonly privateKey: string) {
        this.server = getServerInstance();
    }

    public async execute(): Promise<ISignedResponse<Node>> {
        const node = await this.server.me();
        return signResult(node, this.privateKey);
    }
}
