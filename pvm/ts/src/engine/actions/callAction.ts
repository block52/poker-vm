import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player, Range } from "../../models/game";
import BaseAction from "./baseAction";

class CallAction extends BaseAction {
    get type(): PlayerActionType { return PlayerActionType.CALL }

    verify(player: Player): Range | undefined {
        super.verify(player);
        if (this.game.getMaxStake() === 0n)
            throw new Error("A bet must be made before it can be called.")

        const deductAmount: bigint = this.getDeductAmount(player);

        if (deductAmount === 0n)
            throw new Error("Player has already met maximum so can check instead.");
        
        if (player.chips < deductAmount)
            throw new Error("Player has insufficient chips to call.");
        
        return undefined;
    }

    protected getDeductAmount(player: Player, _amount?: bigint): bigint {
        // return this.game.getMaxStake() - this.game.getPlayerStake(player);
        return 0n;
    }
}

export default CallAction;