// !! TODO: Cleanup

import { PlayerStatus } from "@bitcoinbrisbane/block52";
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