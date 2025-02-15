import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player, Range } from "../../models/game";
import BaseAction from "./baseAction";

// Obsolete, use BetAction instead
class RaiseAction extends BaseAction {
    get type(): PlayerActionType { return PlayerActionType.RAISE }

    verify(player: Player): Range | undefined {
        super.verify(player);
        if (this.game.getMaxStake() === 0n)
            throw new Error("A bet must be made before it can be raised.");
        
        if (player.chips < this.getDeductAmount(player, this.game.bigBlind))
            throw new Error("Player has insufficient chips to raise.");

        return { minAmount: this.game.bigBlind, maxAmount: player.chips };
    }

    protected getDeductAmount(player: Player, amount: bigint): bigint {
        // return this.game.getMaxStake() - this.game.getPlayerStake(player) + amount!;
        // return this.game.getMaxStake() - this.game.getPlayerStake(player) + amount

        return 0n
    }
}

export default RaiseAction;