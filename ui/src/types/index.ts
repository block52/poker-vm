import { PlayerActionType, PlayerDTO } from "@bitcoinbrisbane/block52";

// types.ts
export interface LastActionType {
    action: string;
    amount: number;
}

export interface PlayerContextType {
    players: PlayerDTO[];
    pots: string[];
    tableSize: number;
    seat: number;
    totalPot: number;
    bigBlind: string;
    smallBlind: string;
    roundType: string;
    tableType: string;
    gamePlayers: PlayerDTO[];
    nextToAct: number;
    playerSeats: number[];
    communityCards: string[];
    // updatePlayer: (index: number, updatedPlayer: Player) => void;
    // setPlayerBalance: (index: number, balance: number) => void;
    // setPlayerPot: (index: number, balance: number) => void;
    // handleStatusChange: (index: number, choice: number, updatedPlayers: Player[]) => void;
    // moveToNextPlayer: (index: number, updatedPlayers: Player[]) => void;
    // changeToThinkingBeforeTimeout: () => void;
    setPlayerAction: (action: PlayerActionType, amount?: number) => void;
    dealerIndex: number;
    lastPot: number;
    playerIndex: number;
    openOneMore: boolean;
    openTwoMore: boolean;
    showThreeCards: boolean;
    isLoading: boolean;
    error: Error | null;
}

export type Player = {
    address: string;
    seat: number;
    legalActions: LegalAction[];
    timeout: number;
}

export type LegalAction = {
    action: string;
}

export type TableData = {
    smallBlindPosition: number;
    bigBlindPosition: number;
    nextToAct: number;
    dealer: number;
    players: Player[];
    round: string;
    pots: string[];
}

type Limits = {
    min: string;
    max: string;
}

export type TableStatus = {
    isInTable: boolean;
    isPlayerTurn: boolean;
    seat: number;
    stack: string;
    status: string;
    availableActions: LegalAction[];
    canPostSmallBlind: boolean;
    canPostBigBlind: boolean;
    canCheck: boolean;
    canCall: boolean;
    canBet: boolean;
    canRaise: boolean;
    canFold: boolean;
    betLimits: Limits | null;
    raiseLimits: Limits | null;
    callAmount: string;
    smallBlindAmount: string;
    bigBlindAmount: string;
    isSmallBlindPosition: boolean;
}