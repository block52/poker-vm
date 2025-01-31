// !! TODO: Cleanup

import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player } from "../models/game";

export interface IPoker {
    deal(): void;
    join(player: Player): void;
}

export interface IPlayerAction {
    type: PlayerActionType;
    verify(player: Player): Range | undefined;
    execute(player: Player, amount: bigint): void;
}