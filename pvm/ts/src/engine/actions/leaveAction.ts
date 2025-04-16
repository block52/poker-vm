import { NonPlayerActionType, PlayerStatus } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { Range } from "../types";

class LeaveAction extends BaseAction {
    get type(): NonPlayerActionType { return NonPlayerActionType.LEAVE }
    
    // Override verify method to allow folding anytime
    verify(player: Player): Range | undefined {
        return { minAmount: player.chips, maxAmount: player.chips };
    }
    
    // Override execute to set player's status to FOLDED
    execute(player: Player, index: number, amount?: bigint): void {
        // First verify the action
        this.verify(player);
        
        // Set player status to FOLDED
        player.updateStatus(PlayerStatus.SITTING_OUT);

        // Get their current stack before removing them
        const seat = this.game.getPlayerSeatNumber(player.id);

        // Remove player from seat
        this.game.players.delete(seat);
        
        // Add the action to the game
        this.game.addNonPlayerAction({ playerId: player.address, action: NonPlayerActionType.LEAVE, index: index });
    }
}

export default LeaveAction;