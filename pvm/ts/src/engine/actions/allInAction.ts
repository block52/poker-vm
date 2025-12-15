import { PlayerActionType } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class AllInAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.ALL_IN }

    verify(player: Player): Range {
        super.verify(player);
        this.validateNotInAnteRound();
        
        if (player.chips === 0n) // !! check this as what happens if run out of chips in middle of game.  Answer, you sit out.
            throw new Error("Player has no chips so can't go all-in.");
        return { minAmount: player.chips, maxAmount: player.chips };
    }

    protected getDeductAmount(player: Player, _amount: bigint): bigint {
        return player.chips;
    }
}

export default AllInAction;