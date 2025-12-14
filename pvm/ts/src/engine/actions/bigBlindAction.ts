import { PlayerActionType, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class BigBlindAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.BIG_BLIND;
    }

    verify(player: Player): Range {
        // Player must be active (not sitting out)
        super.verifyPlayerIsActive(player);

        // 1. Round state check: Big blind can only be posted during ANTE round
        this.validateInSpecificRound(TexasHoldemRound.ANTE);

        // 2. Player position check: Only the big blind position can post big blind
        const seat = this.game.getPlayerSeatNumber(player.address);
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