import { ethers } from "ethers";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class ContractsCommand implements ISignedCommand<string[]> {
    constructor(private readonly privateKey: string) {}

    public async execute(): Promise<ISignedResponse<string[]>> {
        const contracts = [ethers.ZeroAddress];
        return signResult(contracts, this.privateKey);
    }
}
