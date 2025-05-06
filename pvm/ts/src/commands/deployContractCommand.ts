import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { GameOptions } from "@bitcoinbrisbane/block52";
import { GameManagement } from "../state/gameManagement";

export class DeployContractCommand implements ISignedCommand<string> {
    private readonly gameManagement: GameManagement;
    private readonly gameOptions: GameOptions;
    
    constructor(private readonly nonce: bigint, private readonly owner: string, private readonly data: string, private readonly privateKey: string) {
        const params = data.split(",");

        const gameOptions: GameOptions = {
            minBuyIn: BigInt(params[0]),
            maxBuyIn: BigInt(params[1]),
            minPlayers: parseInt(params[2]),
            maxPlayers: parseInt(params[3]),
            smallBlind: BigInt(params[4]),
            bigBlind: BigInt(params[5]),
            timeout: params[6] ? parseInt(params[6]) : 60000, // Default timeout if not provided
        };

        this.gameOptions = gameOptions;
        this.gameManagement = new GameManagement();
    }

    public async execute(): Promise<ISignedResponse<string>> {
        const address = await this.gameManagement.create(this.nonce, this.owner, this.gameOptions);
        return signResult(address, this.privateKey);
    }
}
