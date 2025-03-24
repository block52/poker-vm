import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class RaiseAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.RAISE;
    }

    verify(player: Player): Range | undefined {
        super.verify(player);

        const lastBet = this.game.getLastRoundAction();
        if (!lastBet) throw new Error("No previous bet to raise.");

        const largestBet = this.getLargestBet();
        if (largestBet === 0n) throw new Error("Cannot raise when there's been no action.");
        
        const sumBets = this.getSumBets(player.address);

        const minAmount = (lastBet?.amount || 0n) + this.game.bigBlind;
        if (player.chips < minAmount) throw new Error("Player has insufficient chips to raise.");

        return { minAmount: minAmount, maxAmount: player.chips };
    }

    protected getDeductAmount(player: Player, amount: bigint): bigint {
        return player.chips < amount ? player.chips : amount;
    }
}

export default RaiseAction;
