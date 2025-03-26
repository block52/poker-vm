import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { Range } from "../types";

class FoldAction extends BaseAction {
    get type(): PlayerActionType { return PlayerActionType.FOLD }
    
    // Override verify method to allow folding anytime
    verify(player: Player): Range | undefined {
        // Only check if the game has ended
        if (this.game.currentRound === TexasHoldemRound.SHOWDOWN)
            throw new Error("Hand has ended.");
        
        // Remove all status checks - allow any player to fold regardless of status
        
        return undefined;
    }
    
    // Override execute to set player's status to FOLDED
    execute(player: Player, amount?: bigint): void {
        // First verify the action
        this.verify(player);
        
        // Set player status to FOLDED
        player.updateStatus(PlayerStatus.FOLDED);
        
        // Add the action to the game
        const round = this.game.currentRound;
        this.game.addAction({ playerId: player.address, action: PlayerActionType.FOLD }, round);
    }
}

export default FoldAction;