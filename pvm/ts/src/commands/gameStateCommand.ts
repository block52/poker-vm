import { Round, TexasHoldemState } from "../engine/types";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class GameStateCommand implements ISignedCommand<TexasHoldemState> {
    constructor(
        readonly address: string,
        private readonly privateKey: string
    ) {}

    public async execute(): Promise<ISignedResponse<TexasHoldemState>> {
        const mockState: TexasHoldemState = {
            smallBlind: 1,
            bigBlind: 2,
            players: [],
            deck: [],
            communityCards: [],
            turn: "",
            river: "",
            pot: 0,
            currentBet: 2,
            dealer: 0,
            nextPlayer: 1,
            round: Round.PREFLOP,
            handNumber: 0
        };

        return signResult(mockState, this.privateKey);
    }
}
