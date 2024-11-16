import { ethers } from "ethers";
import { Round, TexasHoldemState } from "../engine/types";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { Card, SUIT } from "../models/deck";

export class GameStateCommand implements ISignedCommand<TexasHoldemState> {
    constructor(
        readonly address: string,
        private readonly privateKey: string
    ) { }

    public async execute(): Promise<ISignedResponse<TexasHoldemState>> {

        // Test vectors
        // wonder broom charge load utility version matrix muffin human science scatter girl

        const mockState: TexasHoldemState = {
            smallBlind: 1,
            bigBlind: 2,
            players: [
                {
                    id: "0",
                    address: "0xD332DFf7b5632f293156C3c07F91070aD61E3893",
                    chips: 100,
                },
                {
                    id: "1",
                    address: "0xC26E2874B6DAe1fE438361d150f179a5277dc278",
                    chips: 200,
                }
            ],
            deck: ethers.ZeroHash,
            communityCards: [], // 3 cards
            turn: undefined, // 1 card
            river: undefined, // 1 card
            pot: 10,
            currentBet: 2,
            dealer: 0,
            nextPlayer: 1,
            round: Round.PREFLOP,
            handNumber: 0
        };

        return signResult(mockState, this.privateKey);
    }
}
