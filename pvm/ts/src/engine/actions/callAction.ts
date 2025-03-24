import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class CallAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.CALL }

    verify(player: Player): Range | undefined {
        const lastAction = this.game.getLastRoundAction();

        if (!lastAction)
            throw new Error("No previous action to call.");

        if (lastAction?.amount === 0n || !lastAction?.amount)
            throw new Error("Should check instead.");

        // Get the sum of my bets in this round.
        let deductAmount: bigint = this.getDeductAmount(player);

        if (deductAmount === 0n)
            throw new Error("Player has already met maximum so can check instead.");

        // Safety check to ensure we never have negative amounts
        if (deductAmount < 0n)
            deductAmount = 0n;

        if (player.chips < deductAmount)
            deductAmount = player.chips;

        return { minAmount: deductAmount, maxAmount: deductAmount };
    }

    execute(player: Player): void {
        const deductAmount = this.getDeductAmount(player);
        if (deductAmount) {
            if (player.chips < deductAmount)
                throw new Error(`Player has insufficient chips to ${this.type}.`);

            player.chips -= deductAmount;
        }

        const round = this.game.currentRound;
        this.game.addAction({ playerId: player.address, action: !player.chips && deductAmount ? PlayerActionType.ALL_IN : this.type, amount: deductAmount }, round);
    }

    protected getDeductAmount(player: Player): bigint {
        const lastAction = this.game.getLastRoundAction();
        const sumBets = this.getSumBets(player.address);
        const amountToCall = lastAction?.amount || this.game.bigBlind;
        
        // If player has already bet the same or more than needed to call, return 0
        if (sumBets >= amountToCall) {
            return 0n;
        }
        
        // Otherwise return the difference needed to call
        return amountToCall - sumBets;
    }
}

export default CallAction;