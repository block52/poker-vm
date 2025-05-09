import { NonPlayerActionType, PlayerStatus } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { Range } from "../types";

class JoinAction extends BaseAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.JOIN;
    }

    // Override verify method for join action
    verify(_player: Player): Range {
        // For joining, we don't need to verify against an existing player
        
        // Now we can use the actual min/max buy-in values
        return { 
            minAmount: this.game.minBuyIn,
            maxAmount: this.game.maxBuyIn
        };
    }

    // Override execute to handle player joining
    execute(player: Player, index: number, amount: bigint, seatNumber?: number): void {
        // Validate amount against min/max buy-in
        if (amount < this.game.minBuyIn || amount > this.game.maxBuyIn) {
            throw new Error(`Buy-in amount must be between ${this.game.minBuyIn} and ${this.game.maxBuyIn}`);
        }
        
        // Create new player with the proper chips
        const newPlayer = new Player(player.address, undefined, amount, undefined, PlayerStatus.SITTING_OUT);
        
        // Find a seat or use the specified one
        const seat = seatNumber !== undefined ? seatNumber : this.game.findNextEmptySeat();
        
        // Add the player at the determined seat
        this.game.addPlayerAtSeat(newPlayer, seat);
        
        // Add join action to history
        this.game.addNonPlayerAction({
            playerId: player.address, 
            action: NonPlayerActionType.JOIN, 
            index: index,
            amount: amount
        });
    }
}

export default JoinAction;
