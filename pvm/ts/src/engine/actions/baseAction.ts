import TexasHoldemGame from "../texasHoldem";
import { ActionType, IUpdate, Player, PlayerStatus } from "../types";

abstract class BaseAction {
    constructor(protected game: TexasHoldemGame, protected update: IUpdate) { }

    abstract get action(): ActionType;

    verify(player: Player, amount?: number): void {
        if (this.game.currentPlayer != player.id)
            throw new Error("Must be currently active player.")
        if (this.game.getPlayerStatus(player) != PlayerStatus.ACTIVE)
            throw new Error(`Only active player can ${this.action}.`);
    }

    execute(player: Player, amount?: number): void {
        this.verify(player, amount);
    }
}

export default BaseAction;