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
    LEAVE = "leave",
    NEW_HAND = "new-hand",
}

export const AllPlayerActions = { ...PlayerActionType, ...NonPlayerActionType };

export enum GameType {
    CASH = "cash",
    SIT_AND_GO = "sit-and-go",
    TOURNAMENT = "tournament"
}

export enum GameStatus {
    WAITING_FOR_PLAYERS = "waiting-for-players",
    REGISTRATION = "registration",
    IN_PROGRESS = "in-progress",
    FINISHED = "finished"
}

export enum PlayerStatus {
    NOT_ACTED = "not-acted",
    TURN = "turn",
    ACTIVE = "active",
    BUSTED = "busted",
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
    type: GameType; // Optional for cash games
    otherOptions?: Record<string, any>; // Placeholder for future options
};

export type GameOptionsDTO = {
    minBuyIn?: string;
    maxBuyIn?: string;
    minPlayers?: number;
    maxPlayers?: number;
    smallBlind?: string;
    bigBlind?: string;
    timeout?: number;
    type?: GameType; // Optional for cash games
    otherOptions?: Record<string, any>; // Placeholder for future options
};

// This is the type of the last action of a player
export type ActionDTO = {
    playerId: string,
    seat: number,
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
    seat: number; // change to position
    stack: string; // BigNumber
    isSmallBlind: boolean,
    isBigBlind: boolean,
    isDealer: boolean,
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
    type: GameType;
    address: string;
    gameOptions: GameOptionsDTO;
    smallBlindPosition?: number;
    bigBlindPosition?: number;
    dealer?: number;
    players: PlayerDTO[];
    communityCards: string[];
    deck: string; // Assume this will be encrypted
    pots: string[];
    lastActedSeat?: number;
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
    SPADES = 4
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
}

export type GameStateResponse = {
    state: TexasHoldemStateDTO;
}

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
}