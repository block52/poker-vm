import { ethers } from "ethers";
import { ICommand } from "./interfaces";
import { Round, TexasHoldemState } from "../engine/types";

export class GameStateCommand implements ICommand<TexasHoldemState> {
    constructor(readonly address: string) {
    }

    public async execute(): Promise<TexasHoldemState> {
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
