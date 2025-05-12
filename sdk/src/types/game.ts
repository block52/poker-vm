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
    SHOW = "show"
}

export enum NonPlayerActionType {
    DEAL = "deal",
    JOIN = "join",
    LEAVE = "leave"
}

export const AllPlayerActions = { ...PlayerActionType, ...NonPlayerActionType };

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

export enum SUIT {
    CLUBS = 1,
    DIAMONDS = 2,
    HEARTS = 3,
    SPADES = 4
}

export type Card = {
    suit: SUIT;
    rank: number;
    value: number;
    mnemonic: string;
};

export type Positions = {
    dealer?: number;
    smallBlind?: number;
    bigBlind?: number;
};

export type Fee = {
    address: string;
    max: bigint;
    fixed: bigint;
    percentage: number;
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

// This is the type of the last action of a player
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
    amount: number;
};

export type PlayerDTO = {
    address: string;
    seat: number; // change to position
    stack: string; // BigNumber
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
    positions: Positions;
    players: string[];
    deck: string;
    communityCards: string[];
    pots: string[];
    nextToAct: number;
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
    deck: string; // Assume this will be encrypted
    pots: string[];
    lastToAct: number;
    nextToAct: number;
    previousActions: ActionDTO[];
    round: TexasHoldemRound;
    winners: WinnerDTO[];
    signature: string;
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
