export enum States {
    INIT = "INIT",
    WAITING_FOR_PLAYERS = "WAITING_FOR_PLAYERS",
    DEALING = "DEALING",
    BETTING = "BETTING",
    SHOWDOWN = "SHOWDOWN",
    END = "END",
}

export enum Actions {
    JOIN = "JOIN",
    START = "START",
    BET = "BET",
    CHECK = "CHECK",
    FOLD = "FOLD",
    CALL = "CALL",
    RAISE = "RAISE",
    SHOWDOWN = "SHOWDOWN",
    END = "END",
}

export enum Round {
    PREFLOP = "PREFLOP",
    FLOP = "FLOP",
    TURN = "TURN",
    RIVER = "RIVER",
}

export type Player = {
    address: string;
    chips: number;
    holeCards: string[];
};

export type TexasHoldemState = {
    smallBlind: number;
    bigBlind: number;
    players: Player[];
    deck: string; // hash of deck
    communityCards?: string[];
    turn?: string; // Card
    river?: string; // Card
    pot: number;
    currentBet: number;
    dealer: number; // index of dealer
    nextPlayer: number; // index of next player to act
    round: Round;
    winner?: number;
    handNumber: number;
};
