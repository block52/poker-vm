import { ICommand } from "./interfaces";
import { Round, TexasHoldemState } from "../engine/types";
import { AbstractCommand } from "./abstractSignedCommand";

export class GameStateCommand extends AbstractCommand<TexasHoldemState> {
    constructor(readonly address: string, privateKey: string) {
        super(privateKey);
    }

    public async executeCommand(): Promise<TexasHoldemState> {
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
        
        return mockState;
    }
}
