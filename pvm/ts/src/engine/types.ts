import { ActionDTO, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../models/game";
import { Card } from "../models/deck";

export interface IAction {
    type: PlayerActionType;
    verify(player: Player): Range | undefined;
}

export interface IPoker {
    deal(): void;
    join(player: Player): void;
    joinAtSeat(player: Player, seat: number): void;
    leave(address: string): void;
    getLastAction(): Turn | undefined;
    performAction(address: string, action: PlayerActionType, amount?: bigint): void;
    getBets(round: TexasHoldemRound): Map<string, bigint>;
    hasRoundEnded(): boolean;
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
};

export type LegalAction = ActionDTO;

export interface IUpdate {
    addAction(action: Turn): void;
}