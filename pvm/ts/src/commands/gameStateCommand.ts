import { TexasHoldemState } from "../models/game";
import { GameManagement } from "../state/gameManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class GameStateCommand implements ISignedCommand<TexasHoldemState> {
    private readonly gameManagement: GameManagement;

    constructor(readonly address: string, private readonly privateKey: string) {
        this.gameManagement = new GameManagement();
    }

    public async execute(): Promise<ISignedResponse<TexasHoldemState>> {
        const state: TexasHoldemState = await this.gameManagement.get(this.address);
        return signResult(state, this.privateKey);
    }
}
