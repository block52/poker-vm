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

export type MoveDTO = {
    action: PlayerAction;
    minAmount: number | undefined;
    maxAmount: number | undefined;
}

export type WinnerDTO = {
    address: string;
    amount: number;    
}

export type PlayerDTO = {
    address: string;
    chips: number;
    holeCards: number[] | undefined;
    lastMove: MoveDTO | undefined;
    validMoves: MoveDTO[];
    isActive: boolean;
    isEliminated: boolean;
    isSmallBlind: boolean;
    isBigBlind: boolean;
}

export type TexasHoldemJoinStateDTO = {
    type: "join",
    players: string[];
}

export type TexasHoldemGameStateDTO = {
    type: "game",
    address: string;
    smallBlind: number;
    bigBlind: number;
    players: PlayerDTO[];
    communityCards: number[];
    pot: number;
    currentBet: number;
    round: string;
    winners: WinnerDTO[];
}

export type TexasHoldemStateDTO = TexasHoldemJoinStateDTO | TexasHoldemGameStateDTO;
