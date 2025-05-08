import { NonPlayerActionType, PlayerStatus } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { Range } from "../types";

class LeaveAction extends BaseAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.LEAVE;
    }

    // Override verify method to allow leaving anytime
    verify(player: Player): Range | undefined {
        return { minAmount: player.chips, maxAmount: player.chips };
    }

    // Override execute to handle player leaving
    execute(player: Player, index: number, amount?: bigint): void {
        // First verify the action
        this.verify(player);

        // Get player seat BEFORE changing any state
        const seat = this.game.getPlayerSeatNumber(player.address);
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

        // Now remove player completely from the game
        // console.log(`Removing player ${playerAddress} from seat ${seat}`);
        // Player removal now happens in addNonPlayerAction
    }
}

export default LeaveAction;
