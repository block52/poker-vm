export enum PlayerAction {
    SMALL_BLIND = "post small blind",
    BIG_BLIND = "post big blind",
    FOLD = "fold",
    CHECK = "check",
    BET = "bet",
    CALL = "call",
    RAISE = "raise",
    ALL_IN = "going all-in"
}

export type PlayerDTO = {
    address: string;
    chips: number;
    holeCards?: number[];
    lastAction?: PlayerAction;
    isActive: boolean;
    isTurn: boolean;
    isSmallBlind: boolean;
    isBigBling: boolean;
}

export type TexasHoldemDTO = {
    address: string;
    smallBlind: number;
    bigBlind: number;
    players: PlayerDTO[];
    communityCards: number[];
    pot: number;
    currentBet: number;
    currentPlayerAddress: string;
    round: string;
    winner?: number;
}