export enum PlayerActionType {
    SMALL_BLIND = "post small blind",
    BIG_BLIND = "post big blind",
    FOLD = "fold",
    CHECK = "check",
    BET = "bet",
    CALL = "call",
    RAISE = "raise",
    ALL_IN = "all-in",
    MUCK = "muck"
}

export enum PlayerStatus {
    NOT_ACTED = "not-acted",
    TURN = "turn",
    ACTIVE = "active",
    SITTING_OUT = "sitting-out"
}

export enum TexasHoldemRound {
    PREFLOP = "preflop",
    FLOP = "flop",
    TURN = "turn",
    RIVER = "river",
    SHOWDOWN = "showdown"
}

/// This is the type of the last action of a player
export type ActionDTO = {
    action: PlayerActionType;
    amount: string;
};

export type LegalActionDTO = {
    action: PlayerActionType;
    min: string | undefined;
    max: string | undefined;
};

export type WinnerDTO = {
    address: string;
    amount: number;
};

export type PlayerDTO = {
    address: string;
    seat: number;
    stack: string; // BigNumber
    holeCards: number[] | undefined;
    status: PlayerStatus;
    lastAction: ActionDTO | undefined;
    actions: LegalActionDTO[];
    timeout: number;
    signature: string;
};

export type TexasHoldemJoinStateDTO = {
    type: "join";
    players: string[];
};

export type TexasHoldemGameStateDTO = {
    type: "cash";
    address: string;
    smallBlind: string;
    bigBlind: string;
    players: PlayerDTO[];
    communityCards: number[];
    pot: string;
    nextToAct: number;
    round: string;
    winners: WinnerDTO[];
};

export type TexasHoldemStateDTO = TexasHoldemJoinStateDTO | TexasHoldemGameStateDTO;
