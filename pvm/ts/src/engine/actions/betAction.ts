import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { Range } from "../types";

class BetAction extends BaseAction {
    get type(): PlayerActionType {
        return PlayerActionType.BET;
    }

    verify(player: Player): Range | undefined {

        // Can never check if you haven't matched the largest bet of the round
        const largestBet = this.getLargestBet();
        const sumBets = this.getSumBets(player.address);

        if (largestBet > sumBets) {
            throw new Error("Player must call or raise.");
        }

        super.verify(player);

        if (player.chips < this.game.bigBlind) {
            return { minAmount: player.chips, maxAmount: player.chips };
        }

        return { minAmount: this.game.bigBlind, maxAmount: player.chips };
    }
}

export default BetAction;
