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
        
        console.log(`[JoinAction DEBUG] execute called with player=${player.address}, index=${index}, amount=${amount}, requestedSeat=${requestedSeat}`);
        
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
        
        // Find an available seat or use the requested one
        let seat: number;
        if (requestedSeat !== undefined) {
            // Check if requested seat is available
            console.log(`[JoinAction DEBUG] Requested specific seat ${requestedSeat} is being processed for player ${player.address}`);
            
            // Validate the seat is within the allowed range (1 to maxPlayers)
            const maxSeat = 9; // Default to 9 if we can't access maxPlayers
            if (requestedSeat < 1 || requestedSeat > maxSeat) {
                console.log(`[JoinAction DEBUG] Requested seat ${requestedSeat} is out of valid range (1-${maxSeat}), will auto-assign`);
                seat = this.game.findNextEmptySeat();
            } else {
                // Check if seat is already taken
                const existingPlayer = this.game.getPlayerAtSeat(requestedSeat);
                if (existingPlayer) {
                    console.log(`[JoinAction DEBUG] Requested seat ${requestedSeat} is already taken, will auto-assign`);
                    seat = this.game.findNextEmptySeat();
                } else {
                    console.log(`[JoinAction DEBUG] Using requested seat ${requestedSeat} for player ${player.address}`);
                    seat = requestedSeat;
                }
            }
        } else {
            // Auto-assign a seat only when no specific seat is requested
            seat = this.game.findNextEmptySeat();
            console.log(`[JoinAction DEBUG] Auto-assigned seat ${seat} for player ${player.address}`);
        }
        
        if (seat === -1) {
            throw new Error("Table is full, no available seats.");
        }
        
        console.log(`[JoinAction DEBUG] FINAL - Adding player ${player.address} to seat ${seat} with ${buyIn} chips`);
        this.game.addPlayerAtSeat(newPlayer, seat);
        
        // Add join action to history without the seat property (it will be added automatically in texasHoldem.ts)
        this.game.addNonPlayerAction({
            playerId: player.address, 
            action: NonPlayerActionType.JOIN, 
            index: index,
            amount: buyIn
        });
        
        console.log(`[JoinAction DEBUG] Join action completed for player ${player.address} at seat ${seat}`);
    }
}

export default JoinAction;
