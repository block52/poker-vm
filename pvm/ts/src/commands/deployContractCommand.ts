import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { GameOptions } from "@bitcoinbrisbane/block52";
import { getGameManagementInstance } from "../state/gameManagement";
import { IGameManagement } from "../state/interfaces";

export class DeployContractCommand implements ISignedCommand<string> {
    private readonly gameManagement: IGameManagement;
    private readonly gameOptions: GameOptions;
    
    constructor(private readonly nonce: bigint, private readonly owner: string, private readonly data: string, private readonly privateKey: string) {
        const params = data.split(",");

        if (params.length !== 7) {
            throw new Error("Invalid number of parameters. Expected 7 parameters.");
        }

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
        this.gameManagement = getGameManagementInstance();
    }

    public async execute(): Promise<ISignedResponse<string>> {
        const address = await this.gameManagement.create(this.nonce, this.owner, this.gameOptions);
        return signResult(address, this.privateKey);
    }
}
