import { getServerInstance, Server } from "../core/server";
import { Node } from "../core/types";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { ZeroHash } from "ethers";

export class MeCommand implements ISignedCommand<Node> {
    private readonly server: Server;

    constructor() {
        this.server = getServerInstance();
    }

    public async execute(): Promise<ISignedResponse<Node>> {
        const node = await this.server.me();
        // Sign with ZeroHash since we no longer require a validator key
        return signResult(node, ZeroHash);
    }
}
