import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { IAction, Range } from "../types";

class FoldAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.FOLD }
    
    // Override verify method to allow folding anytime
    verify(player: Player): Range {
        // Remove all status checks - allow any player to fold regardless of status
        return { minAmount: 0n, maxAmount: 0n };
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