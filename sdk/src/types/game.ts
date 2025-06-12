export enum PlayerActionType {
    SMALL_BLIND = "post-small-blind",
    BIG_BLIND = "post-big-blind",
    FOLD = "fold",
    CHECK = "check",
    BET = "bet",
    CALL = "call",
    RAISE = "raise",
    ALL_IN = "all-in",
    MUCK = "muck",
    SIT_IN = "sit-in",
    SIT_OUT = "sit-out",
    SHOW = "show",
}

export enum NonPlayerActionType {
    DEAL = "deal",
    JOIN = "join",
    LEAVE = "leave",
    NEW_HAND = "new-hand",
    TOPUP = "topup", // New action type for in-game top-up
}

export const AllPlayerActions = {
    // Non-player actions
    DEAL: NonPlayerActionType.DEAL,
    JOIN: NonPlayerActionType.JOIN,
    LEAVE: NonPlayerActionType.LEAVE,
    NEW_HAND: NonPlayerActionType.NEW_HAND,
    TOPUP: NonPlayerActionType.TOPUP,
    // Player actions
    SMALL_BLIND: PlayerActionType.SMALL_BLIND,
    BIG_BLIND: PlayerActionType.BIG_BLIND,
    FOLD: PlayerActionType.FOLD,
    CHECK: PlayerActionType.CHECK,
    BET: PlayerActionType.BET,
    CALL: PlayerActionType.CALL,
    RAISE: PlayerActionType.RAISE,
    ALL_IN: PlayerActionType.ALL_IN,
    MUCK: PlayerActionType.MUCK,
    SIT_IN: PlayerActionType.SIT_IN,
    SIT_OUT: PlayerActionType.SIT_OUT,
    SHOW: PlayerActionType.SHOW,
};

export enum GameType {
    CASH = "cash",
    TOURNAMENT = "tournament"
}

export enum PlayerStatus {
    NOT_ACTED = "not-acted",
    TURN = "turn",
    ACTIVE = "active",
    FOLDED = "folded",
    ALL_IN = "all-in",
    SITTING_OUT = "sitting-out",
    SITTING_IN = "sitting-in",
    SHOWING = "showing"
}

export enum TexasHoldemRound {
    ANTE = "ante",
    PREFLOP = "preflop",
    FLOP = "flop",
    TURN = "turn",
    RIVER = "river",
    SHOWDOWN = "showdown",
    END = "end"
}

export type GameOptions = {
    minBuyIn: bigint;
    maxBuyIn: bigint;
    minPlayers: number;
    maxPlayers: number;
    smallBlind: bigint;
    bigBlind: bigint;
    timeout: number;
};

export type GameOptionsDTO = {
    minBuyIn?: string;
    maxBuyIn?: string;
    minPlayers?: number;
    maxPlayers?: number;
    smallBlind?: string;
    bigBlind?: string;
    timeout?: number;
};

export type ActionDTO = {
    playerId: string;
    seat: number;
    action: PlayerActionType | NonPlayerActionType;
    amount: string;
    round: TexasHoldemRound;
    index: number;
    timestamp: number;
};

export type LegalActionDTO = {
    action: PlayerActionType | NonPlayerActionType;
    min: string | undefined;
    max: string | undefined;
    index: number;
};

export type WinnerDTO = {
    address: string;
    amount: string;
    cards: string[] | undefined;
    name: string | undefined;
    description: string | undefined;
};

export type PlayerDTO = {
    address: string;
    seat: number;
    stack: string;
    isSmallBlind: boolean;
    isBigBlind: boolean;
    isDealer: boolean;
    holeCards: string[] | undefined;
    status: PlayerStatus;
    lastAction: ActionDTO | undefined;
    legalActions: LegalActionDTO[];
    sumOfBets: string;
    timeout: number;
    signature: string;
};

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
    players: string[];
    deck: string;
    communityCards: string[];
    pots: string[];
    lastActedSeat: number;
    actionCount: number;
    handNumber: number;
    round: TexasHoldemRound;
    winners: string[];
    signature: string;
};

export type TexasHoldemStateDTO = {
    type: "cash";
    address: string;
    gameOptions: GameOptionsDTO;
    smallBlindPosition: number;
    bigBlindPosition: number;
    dealer: number;
    players: PlayerDTO[];
    communityCards: string[];
    deck: string;
    pots: string[];
    lastActedSeat: number;
    nextToAct: number;
    previousActions: ActionDTO[];
    actionCount: number;
    handNumber: number;
    round: TexasHoldemRound;
    winners: WinnerDTO[];
    signature: string;
};

export enum SUIT {
    CLUBS = 1,
    DIAMONDS = 2,
    HEARTS = 3,
    SPADES = 4,
}

export type Card = {
    suit: SUIT;
    rank: number;
    value: number;
    mnemonic: string;
};

export type GameOptionsResponse = {
    address: string;
    gameOptions: GameOptionsDTO;
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
};

export type GameStateResponse = {
    state: TexasHoldemStateDTO;
};

export type PerformActionResponse = {
    state: TexasHoldemStateDTO;
    nonce: string;
    to: string;
    from: string;
    value: string;
    hash: string;
    signature: string;
    timestamp: string;
    data?: string;
}; 