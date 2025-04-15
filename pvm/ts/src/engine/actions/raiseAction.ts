import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class RaiseAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.RAISE;
    }

    verify(player: Player): Range | undefined {
        // Cannot call in the ANTE round
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot call in the ante round. Small blind must post.");
        }

        super.verify(player);

        const lastBet = this.game.getLastRoundAction();
        if (!lastBet) throw new Error("No previous bet to raise.");

        const sumBets = this.getSumBets(player.address);
        const minAmount = (lastBet?.amount || 0n) + this.game.bigBlind - sumBets;

        if (minAmount < player.chips) {
            return { minAmount: minAmount, maxAmount: player.chips };
        }

        return { minAmount: minAmount, maxAmount: player.chips };
    }

    protected getDeductAmount(player: Player, amount?: bigint): bigint {
        if (!amount) return 0n;

        // Calculate how much more the player needs to add to the pot
        const currentBet = this.getSumBets(player.address);
        const toAdd = amount - currentBet;

        // Return the amount to add (or player's entire stack if they don't have enough)
        return toAdd > player.chips ? player.chips : toAdd;
    }
}

export default RaiseAction;
