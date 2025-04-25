import { TexasHoldemRound } from "@bitcoinbrisbane/block52";

export type TexasHoldemGameState = {
    type: string;
    address: string;
    minBuyIn: string;
    maxBuyIn: string;
    minPlayers: number;
    maxPlayers: number;
    smallBlind: string;
    bigBlind: string;
    dealer: number;
    players: unknown[];
    deck: string;
    communityCards: string[];
    pots: string[];
    nextToAct: number;
    round: TexasHoldemRound;
    winners: unknown[];
    signature: string;
};