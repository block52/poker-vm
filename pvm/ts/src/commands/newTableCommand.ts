import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { IGameManagement } from "../state/interfaces";
import { getGameManagementInstance } from "../state/index";
import { GameOptions } from "@bitcoinbrisbane/block52";

export class NewTableCommand implements ISignedCommand<string> {
    private readonly gameManagement: IGameManagement;

    constructor(
        private readonly owner: string, 
        private readonly gameOptions: GameOptions, 
        private readonly nonce: bigint,
        private readonly privateKey: string,
        private readonly timestamp?: string
    ) {
        this.gameManagement = getGameManagementInstance();
    }

    public async execute(): Promise<ISignedResponse<string>> {
        console.log("⚡ NewTableCommand.execute() called:");
        console.log(`Owner: ${this.owner}`);
        console.log(`Nonce: ${this.nonce}`);
        console.log(`Timestamp: ${this.timestamp || "not provided"}`);
        
        const address = await this.gameManagement.create(this.nonce, this.owner, this.gameOptions, this.timestamp);
        
        console.log(`✅ Table created with address: ${address}`);
        return signResult(address, this.privateKey);
    }
}
