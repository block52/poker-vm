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
        private readonly privateKey: string
    ) {
        this.gameManagement = getGameManagementInstance();
    }

    public async execute(): Promise<ISignedResponse<string>> {
        const address = await this.gameManagement.create(this.nonce, this.owner, this.gameOptions);

        return signResult(address, this.privateKey);
    }
}
