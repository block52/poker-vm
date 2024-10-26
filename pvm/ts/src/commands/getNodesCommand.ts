import { ISignedCommand, ISignedResponse } from "./interfaces";
import { signResult } from "./abstractSignedCommand";

export class GetNodesCommand implements ISignedCommand<[]> {
    constructor(private readonly privateKey: string) {}

    public async execute(): Promise<ISignedResponse<[]>> {
        return signResult([], this.privateKey);
    }   
}
