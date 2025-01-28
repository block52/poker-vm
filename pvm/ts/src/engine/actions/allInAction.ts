import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player, Range } from "../../models/game";
import BaseAction from "./baseAction";

class AllInAction extends BaseAction {
    get type(): PlayerActionType { return PlayerActionType.ALL_IN }

    verify(player: Player): Range | undefined {
        super.verify(player);
        if (player.chips === 0n) // !! check this as what happens if run out of chips in middle of game.  Answer, you sit out.
            throw new Error("Player has no chips so can't go all-in.");
        return undefined;
    }

    protected getDeductAmount(player: Player, _amount: BigInt): BigInt {
        return player.chips;
    }
}

export default AllInAction;