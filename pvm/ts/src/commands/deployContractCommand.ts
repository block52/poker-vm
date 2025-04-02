import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { GameOptions } from "@bitcoinbrisbane/block52";
import { GameManagement } from "../state/gameManagement";

export class DeployContractCommand implements ISignedCommand<string> {
    private readonly gameManagement: GameManagement;
    
    constructor(private nonce: bigint, private owner: string, private gameOptions: GameOptions, private readonly privateKey: string) { 
        this.gameManagement = new GameManagement();
    }

    public async execute(): Promise<ISignedResponse<string>> {
        const address = await this.gameManagement.create(this.nonce, this.owner, this.gameOptions);
        return signResult(address, this.privateKey);
    }
}
