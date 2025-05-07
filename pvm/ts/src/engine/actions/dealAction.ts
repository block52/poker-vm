import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class DealAction extends BaseAction implements IAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.DEAL;
    }

    verify(player: Player): Range {
        // Check base conditions (hand active, player's turn, player active)
        super.verify(player);

        // 6. Card state check: Make sure cards haven't been dealt already
        const anyPlayerHasCards = Array.from(this.game.players.values()).some(p => p !== null && p.holeCards !== undefined);
        if (anyPlayerHasCards) {
            throw new Error("Cards have already been dealt for this hand.");
        }

        // 1. Round state check: Can only deal when in ANTE round
        if (this.game.currentRound !== TexasHoldemRound.ANTE) {
            throw new Error("Dealing can only occur after blinds are posted in the ANTE round.");
        }

        // 2. Player count check: Need at least minimum players
        const count = this.game.getPlayerCount();
        if (count < 2) { // Using hardcoded minimum player count since gameOptions is private
            throw new Error("Not enough players to deal.");
        }

        // 3. Blind posting check: Both blinds must be posted
        const anteActions = this.game.getActionsForRound(TexasHoldemRound.ANTE);
        
        // Check if small blind has been posted
        const smallBlindAction = anteActions.some(a => a.action === PlayerActionType.SMALL_BLIND);
        if (!smallBlindAction) {
            throw new Error("Small blind must be posted before dealing.");
        }

        // Check if big blind has been posted
        const bigBlindAction = anteActions.some(a => a.action === PlayerActionType.BIG_BLIND);
        if (!bigBlindAction) {
            throw new Error("Big blind must be posted before dealing.");
        }

        // 4. Dealer position check: In traditional poker, the dealer initiates the deal
        // However, the small blind also commonly does this in online poker
        const playerSeat = this.game.getPlayerSeatNumber(player.address);
        const isDealer = playerSeat === this.game.dealerPosition;
        const isSmallBlind = playerSeat === this.game.smallBlindPosition;
        
        if (!isDealer && !isSmallBlind) {
            throw new Error("Only the dealer or small blind can initiate the deal.");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }

    execute(player: Player, index: number): void {
        // Verify the action (this will throw if invalid)
        this.verify(player);

        // Perform the deal
        this.game.deal();

        // Record the deal action in the ANTE round
        this.game.addNonPlayerAction({
            playerId: player.address,
            action: NonPlayerActionType.DEAL,
            index: index
        });
    }
}

export default DealAction;
