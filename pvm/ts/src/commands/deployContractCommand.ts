import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { GameOptions, GameType } from "@bitcoinbrisbane/block52";
import { getGameManagementInstance } from "../state/index";
import { IGameManagement } from "../state/interfaces";

export class DeployContractCommand implements ISignedCommand<string> {
    private readonly gameManagement: IGameManagement;
    private readonly gameOptions: GameOptions;
    
    constructor(private readonly nonce: bigint, private readonly owner: string, data: string, private readonly privateKey: string) {
        const params: string[] = data.split(",");

        if (params.length !== 8) {
            throw new Error("Invalid number of parameters. Expected 8 parameters.");
        }

        const gameOptions: GameOptions = {
            minBuyIn: BigInt(params[0]),
            maxBuyIn: BigInt(params[1]),
            minPlayers: parseInt(params[2]),
            maxPlayers: parseInt(params[3]),
            smallBlind: BigInt(params[4]),
            bigBlind: BigInt(params[5]),
            timeout: params[6] ? parseInt(params[6]) : 60000, // Default timeout if not provided
            type: params[7] ? params[7] as GameType : GameType.CASH // Default type if not provided
        };

        this.gameOptions = gameOptions;
        this.gameManagement = getGameManagementInstance();
    }

    public async execute(): Promise<ISignedResponse<string>> {
        const address = await this.gameManagement.create(this.nonce, this.owner, this.gameOptions);
        return signResult(address, this.privateKey);
    }
}
