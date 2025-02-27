import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/game";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class CallAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.CALL }

    verify(player: Player): Range | undefined {
        const lastAction = this.game.getLastAction();

        if (!lastAction)
            throw new Error("No previous action to call.");

        if (lastAction?.amount === 0n || !lastAction?.amount)
            throw new Error("Should check instead.");

        // Get the sum of my bets in this round.
        let deductAmount: bigint = this.getDeductAmount(player);

        if (deductAmount === 0n)
            throw new Error("Player has already met maximum so can check instead.");

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

        this.game.addAction({ playerId: player.address, action: !player.chips && deductAmount ? PlayerActionType.ALL_IN : this.type, amount: deductAmount });
    }

    protected getDeductAmount(player: Player): bigint {
        const lastAction = this.game.getLastAction();
        const sumBets = this.getSumBets(player.address);

        // default to big blind if no previous action.
        // Note: this could fail in some edge cases where the big blind is
        // not the minimum bet.
        return (lastAction?.amount || this.game.bigBlind) - sumBets;
    }

    private getSumBets(playerId: string): bigint {
        let totalBet = 0n;

        const roundBets = this.game.getBets(this.game.currentRound);

        // If the player made a bet in this round, add it to the total
        if (roundBets.has(playerId)) {
            totalBet += roundBets.get(playerId) || 0n;
        }

        return totalBet;
    }
}

export default CallAction;