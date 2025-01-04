import { ISignedCommand, ISignedResponse } from "./interfaces";
import { signResult } from "./abstractSignedCommand";
import { Node } from "../core/types";

export class GetNodesCommand implements ISignedCommand<[]> {
    constructor(private readonly nodes: Map<string, Node>, private readonly privateKey: string) {}

    public async execute(): Promise<ISignedResponse<[]>> {
        return signResult([], this.privateKey);
    }   
}
