import { NonPlayerActionType, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { Range } from "../types";

class FoldAction extends BaseAction {
    get type(): PlayerActionType { return PlayerActionType.FOLD }
    
    // Override verify method to allow folding anytime
    verify(player: Player): Range | undefined {
        // Only basic requirement is that the player is in active status
        if (player.status !== PlayerStatus.ACTIVE) {
            throw new Error("Only active players can fold.");
        }
        
        // Check if cards have been dealt and there haven't been any bets yet
        const hasDealt = this.game.getActionsForRound(this.game.currentRound)
            .some(a => a.action === NonPlayerActionType.DEAL);
        const anyPlayerHasCards = Array.from(this.game.players.values())
            .some(p => p !== null && p.holeCards !== undefined);
            
        // If cards have been dealt and we're in PREFLOP
        if ((hasDealt || anyPlayerHasCards) && this.game.currentRound === TexasHoldemRound.PREFLOP) {
            // Check if any bets have been made after dealing
            const betsAfterDeal = this.game.getActionsForRound(TexasHoldemRound.PREFLOP)
                .filter(a => 
                    a.action === PlayerActionType.BET || 
                    a.action === PlayerActionType.RAISE);
                
            // If no bets yet, player should check not fold
            if (betsAfterDeal.length === 0) {
                throw new Error("Cannot fold when there's no bet - use check instead.");
            }
        }
        
        // No need to check if it's the player's turn - folding is always permitted
        // This bypasses the check in BaseAction.verify that requires it to be the player's turn
        
        return undefined;
    }
    
    // Override execute to set player's status to FOLDED
    execute(player: Player, index: number, amount?: bigint): void {
        // First verify the action
        this.verify(player);
        
        // Set player status to FOLDED
        player.updateStatus(PlayerStatus.FOLDED);
        
        // Add the action to the game
        const round = this.game.currentRound;
        this.game.addAction({ playerId: player.address, action: PlayerActionType.FOLD, index: index }, round);
    }
}

export default FoldAction;