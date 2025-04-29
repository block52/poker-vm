import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range, Turn } from "../types";

class CheckAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.CHECK }

    verify(player: Player): Range {
        // Basic validation
        super.verify(player);

        // 1. Round state check: Cannot check in the ante round
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot check in the ante round.");
        }

        // 2. Bet matching check: Can only check if player has matched the largest bet
        const largestBet = this.getLargestBet();
        const sumBets = this.getSumBets(player.address);

        // 3. Special case for the big blind player in preflop
        if (this.game.currentRound === TexasHoldemRound.PREFLOP && 
            this.game.getPlayerSeatNumber(player.address) === this.game.bigBlindPosition) {
            
            // Big blind can check when no one has raised above the big blind amount
            if (largestBet <= this.game.bigBlind) {
                return { minAmount: 0n, maxAmount: 0n };
            }
        }

        // In all other cases, can only check if player has already matched the largest bet
        if (largestBet > sumBets) {
            throw new Error("Player must match the largest bet to check.");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }
}

export default CheckAction;