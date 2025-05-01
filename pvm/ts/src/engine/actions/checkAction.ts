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

        // 2. Bet matching check: Get the largest bet and player's current bet
        const largestBet = this.getLargestBet();
        const playerBet = this.getSumBets(player.address);

        // 3. Special case for preflop round
        if (this.game.currentRound === TexasHoldemRound.PREFLOP) {
            const playerSeat = this.game.getPlayerSeatNumber(player.address);
            const isSmallBlind = playerSeat === this.game.smallBlindPosition;
            const isBigBlind = playerSeat === this.game.bigBlindPosition;
            
            // Small blind CANNOT check in preflop (must call the difference to the big blind)
            if (isSmallBlind && playerBet < this.game.bigBlind) {
                throw new Error("Small blind must call to match the big blind.");
            }
            
            // Big blind CAN check when no one has raised above the big blind
            // In this case, the largest bet is equal to the small blind
            if (isBigBlind && largestBet === this.game.smallBlind) {
                return { minAmount: 0n, maxAmount: 0n };
            }
        }

        // 4. General case: Can only check if player has matched the largest bet
        if (playerBet < largestBet) {
            throw new Error("Player must match the largest bet to check.");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }
}

export default CheckAction;