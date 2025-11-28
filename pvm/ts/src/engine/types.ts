import { ActionDTO, PlayerActionType, PlayerStatus, TexasHoldemRound, Card, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { Player } from "../models/player";
import { Deck } from "../models/deck";

export interface IAction {
    readonly type: PlayerActionType | NonPlayerActionType;
    verify(player: Player): Range;
    execute(player: Player, index: number, amount: bigint): void;
}

export interface IPoker {
    smallBlind: bigint;
    bigBlind: bigint;
    getLastRoundAction(): Turn | undefined;
    performAction(address: string, action: PlayerActionType, index: number, amount?: bigint): void;
    getBets(round: TexasHoldemRound): Map<string, bigint>;
}

/**
 * Interface defining what the DealerPositionManager needs from the game
 */
export interface IDealerGameInterface {
    lastActedSeat: number;
    dealerPosition: number;
    minPlayers: number;
    maxPlayers: number;
    findActivePlayers(): Player[];
    getPlayerAtSeat(seat: number): Player | undefined;
    getPlayerSeatNumber(playerId: string): number;

    // getDealerPosition(): number | undefined;
    // setDealerPosition(seat: number): void;
}

export interface IPositionManager {
    findNextActivePlayer(currentSeat: number): Player | undefined;
}

/**
 * Interface defining the dealer position management contract
 */
export interface IDealerPositionManager extends IPositionManager {
    // Core dealer position methods
    getDealerPosition(): number;
    
    // Event handlers
    handlePlayerLeave(seat: number): void;
    handlePlayerJoin(seat: number): void;
    handleNewHand(): number;
    
    // Position getters
    getPosition(name: string): number;
    getSmallBlindPosition(): number;
    getBigBlindPosition(): number;
    
    // Validation
    validateDealerPosition(): boolean;
}

export type PlayerState = {
    address: string;
    chips: bigint;
    playerStatus: PlayerStatus;
    cards: [Card, Card];
};

export type Range = {
    minAmount: bigint;
    maxAmount: bigint;
};

export type Turn = {
    playerId: string;
    action: PlayerActionType | NonPlayerActionType;
    amount?: bigint;
    index: number;
};

// Timestamp in milliseconds is required for auto folding etc
export type TurnWithSeat = Turn & { seat: number; timestamp: number };

export type LegalAction = ActionDTO;

export interface IUpdate {
    addAction(action: Turn): void;
}

export interface IGame extends IUpdate {
    reinit(deck: Deck): void;
    getPlayers(): Player[];
    getPlayerStatus(): PlayerStatus;
    join(player: Player, chips: bigint): void;
    leave(player: Player): void;
}

export type OrderedTransaction = {
    from: string;
    to: string;
    value: bigint;
    type: PlayerActionType | NonPlayerActionType;
    index: number;
    data?: string;
};

export type Winner = {
    amount: bigint;
    cards: string[] | undefined;
    name: string | undefined;
    description: string | undefined;
};

export type Result = {
    place: number;
    playerId: string;
    payout: bigint;
}