import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/game";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class CallAction extends BaseAction implements IAction {
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
        const lastAction = this.game.getLastAction();

        // default to big blind if no previous action.
        // Note: this could fail in some edge cases where the big blind is
        // not the minimum bet.
        return lastAction?.amount || this.game.bigBlind;
    }
}

export default CallAction;