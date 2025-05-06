import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class BigBlindAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.BIG_BLIND;
    }

    verify(_player: Player): Range {
        // Check base conditions (hand active, player's turn, player active)
        super.verify(_player);

        // 1. Round state check: Big blind can only be posted during ANTE round
        if (this.game.currentRound !== TexasHoldemRound.ANTE) {
            throw new Error("Big blind can only be posted during ante round.");
        }

        // 2. Player position check: Only the big blind position can post big blind
        const seat = this.game.getPlayerSeatNumber(_player.address);
        if (seat !== this.game.bigBlindPosition) {
            throw new Error("Only the big blind player can post the big blind.");
        }

        // 3. Action sequence check: Small blind must be posted first
        const actions = this.game.getActionsForRound(TexasHoldemRound.ANTE);
        const smallBlindAction = actions.find(a => a.action === PlayerActionType.SMALL_BLIND);
        if (!smallBlindAction) {
            throw new Error("Small blind must be posted before big blind.");
        }

        // 4. Prevent duplicate action: Big blind should not be posted twice
        const bigBlindAction = actions.find(a => a.action === PlayerActionType.BIG_BLIND);
        if (bigBlindAction) {
            throw new Error("Big blind has already been posted.");
        }

        // Return the exact big blind amount required
        return { minAmount: this.game.bigBlind, maxAmount: this.game.bigBlind };
    }

    getDeductAmount(): bigint {
        return this.game.bigBlind;
    }
}

export default BigBlindAction;