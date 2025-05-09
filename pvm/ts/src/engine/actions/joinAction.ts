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
    execute(player: Player, index: number, amount?: bigint, requestedSeat?: number): void {
        // First verify the action
        const range = this.verify(player);
        
        // Check if the amount is within the valid range
        const buyIn = amount || 0n;
        if (buyIn < range.minAmount || buyIn > range.maxAmount) {
            throw new Error(`Invalid buy-in amount: ${buyIn}. Must be between ${range.minAmount} and ${range.maxAmount}.`);
        }
        
        // Create a new player instance with proper settings
        const newPlayer = new Player(
            player.address,
            undefined, // lastAction
            buyIn,
            undefined, // holeCards
            PlayerStatus.SITTING_OUT
        );
        
        // Find an available seat
        let seat: number;
        if (requestedSeat !== undefined) {
            console.log(`JoinAction: Using requested seat ${requestedSeat} for player ${player.address}`);
            seat = requestedSeat;
        } else {
            // Auto-assign a seat
            seat = this.game.findNextEmptySeat();
            console.log(`JoinAction: Auto-assigned seat ${seat} for player ${player.address}`);
        }
        
        if (seat === -1) {
            throw new Error("Table is full, no available seats.");
        }
        
        console.log(`JoinAction: Adding player ${player.address} to seat ${seat} with ${buyIn} chips`);
        this.game.addPlayerAtSeat(newPlayer, seat);
        
        // Add join action to history
        this.game.addNonPlayerAction({
            playerId: player.address, 
            action: NonPlayerActionType.JOIN, 
            index: index,
            amount: buyIn
        });
    }
}

export default JoinAction;
