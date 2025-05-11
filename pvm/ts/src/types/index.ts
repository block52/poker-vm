import { TexasHoldemRound, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";

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

export type TransactionResponse = {
    nonce: string;
    to: string;
    from: string;
    value: string;
    hash: string;
    signature: string;
    timestamp: string;
    data?: string;
}

export type GameStateResponse = {
    state: TexasHoldemStateDTO;
}

// export type PerformActionResponse = GameStateResponse & TransactionResponse;
export type PerformActionResponse= {
    state: TexasHoldemStateDTO;
    nonce: string;
    to: string;
    from: string;
    value: string;
    hash: string;
    signature: string;
    timestamp: string;
    data?: string;
}
