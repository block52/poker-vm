import { ISignedCommand, ISignedResponse } from "./interfaces";
import { signResult } from "./abstractSignedCommand";
import { Node } from "../core/types";
import { ZeroHash } from "ethers";

export class GetNodesCommand implements ISignedCommand<[]> {
    constructor(private readonly nodes: Map<string, Node>) {}

    public async execute(): Promise<ISignedResponse<[]>> {
        // Sign with ZeroHash since we no longer require a validator key
        return signResult([], ZeroHash);
    }   
}
