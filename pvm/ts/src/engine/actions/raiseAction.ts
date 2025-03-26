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
        if (largestBet === sumBets) throw new Error("Player must bet not raise.");

        const minAmount = (lastBet?.amount || 0n) + this.game.bigBlind;
        if (player.chips < minAmount) throw new Error("Player has insufficient chips to raise.");

        return { minAmount: minAmount, maxAmount: player.chips };
    }

    execute(player: Player, amount: bigint): void {
        // First verify the action
        const range = this.verify(player);
        
        // Check if the amount is valid
        if (!range) throw new Error("Invalid raise action.");
        if (amount < range.minAmount) throw new Error(`Raise amount ${amount} is less than minimum ${range.minAmount}.`);
        if (amount > range.maxAmount) throw new Error(`Raise amount ${amount} is more than maximum ${range.maxAmount}.`);
        
        // Calculate how much more the player needs to add to the pot
        const currentBet = this.getSumBets(player.address);
        const toAdd = amount - currentBet;
        
        // Ensure player has enough chips
        if (toAdd > player.chips) {
            throw new Error(`Player only has ${player.chips} chips, cannot deduct ${toAdd}.`);
        }
        
        // Deduct from player's stack directly
        player.chips -= toAdd;
        
        // Add the action to the game
        const round = this.game.currentRound;
        this.game.addAction({ playerId: player.address, action: PlayerActionType.RAISE, amount }, round);
    }

    protected getDeductAmount(player: Player, amount: bigint): bigint {
        return player.chips < amount ? player.chips : amount;
    }
}

export default RaiseAction;
