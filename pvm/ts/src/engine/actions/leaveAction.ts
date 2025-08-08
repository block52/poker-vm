import { NonPlayerActionType, PlayerStatus } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { Range } from "../types";

class LeaveAction extends BaseAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.LEAVE;
    }

    // Override verify method to allow leaving anytime
    verify(player: Player): Range {
        return { minAmount: player.chips, maxAmount: player.chips };
    }

    // Override execute to handle player leaving
    execute(player: Player, index: number): void {
        this.verify(player);

        // Get player seat BEFORE changing any state
        const seat = this.game.getPlayerSeatNumber(player.address);

        this.game.dealerManager.handlePlayerLeave(seat);

        const playerAddress = player.address;
        const playerChips = player.chips;

        console.log(`Player ${playerAddress} at seat ${seat} leaving with ${playerChips} chips...`);

        // Add leave action to history BEFORE removing the player
        this.game.addNonPlayerAction({ 
            playerId: playerAddress, 
            action: NonPlayerActionType.LEAVE, 
            index: index,
            amount: playerChips // Include chips amount in the action
        });
    }
}

export default LeaveAction;
