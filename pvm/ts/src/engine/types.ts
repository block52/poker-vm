import { ActionDTO, PlayerActionType, PlayerStatus, TexasHoldemRound, Card } from "@bitcoinbrisbane/block52";
import { Player } from "../models/player";

export interface IAction {
    readonly type: PlayerActionType;
    verify(player: Player): Range | undefined;
    execute(player: Player, index: number, amount?: bigint): void;
}

export interface IPoker {
    deal(): void;
    joinAtSeat(player: Player, seat: number): void;
    leave(address: string): void;
    getLastRoundAction(): Turn | undefined;
    performAction(address: string, action: PlayerActionType, index: number, amount?: bigint): void;
    getBets(round: TexasHoldemRound): Map<string, bigint>;
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
}

export type Turn = {
    playerId: string;
    action: PlayerActionType;
    amount?: bigint;
    index: number;
};

// Timestamp in milliseconds is required for auto folding etc
export type TurnWithSeat = Turn & { seat: number, timestamp: number };

export type LegalAction = ActionDTO;

export interface IUpdate {
    addAction(action: Turn): void;
}

export interface IGame extends IUpdate {
    getPlayers(): Player[];
    getPlayerStatus(): PlayerStatus;
    join(player: Player, chips: bigint): void;
}