import TexasHoldemGame from "../texasHoldem";
import { ActionType, IUpdate, Player, PlayerStatus } from "../types";

abstract class BaseAction {
    constructor(protected game: TexasHoldemGame, protected update: IUpdate) { }

    abstract get type(): ActionType;

    verify(player: Player): number | undefined {
        if (this.game.currentPlayerId != player.id)
            throw new Error("Must be currently active player.")
        if (this.game.getPlayerStatus(player) != PlayerStatus.ACTIVE)
            throw new Error(`Only active player can ${this.type}.`);
        return undefined;
    }

    execute(player: Player, amount?: number): void {
        const minAmount = this.verify(player);
        if (minAmount) {
            if (!amount || (amount < minAmount))
                throw new Error("Amount is less than minimum required.");
        } else if (amount) {
            throw new Error(`Amount should not be specified for ${this.type}`);
        }
        // in some cases, the amount field is not used so need to calculate to match maximum bet; in the case of a raise,
        // the amount only specifies that over the existing maximum which the player may not yet have covered
        const deductAmount = this.getDeductAmount(player, amount);
        if (deductAmount) {
            if (player.chips < deductAmount)
                throw new Error(`Player has insufficient chips to ${this.type}.`);
            player.chips -= deductAmount;
        }
        this.update.addMove({ playerId: player.id, action: !player.chips && deductAmount ? ActionType.ALL_IN : this.type, amount: deductAmount });
    }

    protected getDeductAmount(_player: Player, amount?: number): number | undefined {
        return amount;
    }
}

export default BaseAction;