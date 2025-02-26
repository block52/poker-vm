// !! TODO: Cleanup

import { ActionDTO, PlayerActionType, PlayerStatus } from "@bitcoinbrisbane/block52";
import { Player } from "../models/game";
import { Card } from "../models/deck";

export interface IPoker {
    deal(): void;
    join(player: Player): void;
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