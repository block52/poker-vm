import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
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