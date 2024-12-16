// !! TODO: Cleanup

import { Player } from "../models/game";

export interface IPoker {
    deal(): void;
    join(player: Player): void;
}