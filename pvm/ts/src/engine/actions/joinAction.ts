import { NonPlayerActionType, PlayerStatus } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { Range } from "../types";

class JoinAction extends BaseAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.JOIN;
    }

    // Override verify method to allow joining anytime
    verify(player: Player): Range | undefined {
        // Check buy-in amount is within limits
        const minBuyIn = this.game["_gameOptions"].minBuyIn;
        const maxBuyIn = this.game["_gameOptions"].maxBuyIn;
        
        // Return valid range for buy-in
        return { minAmount: minBuyIn, maxAmount: maxBuyIn };
    }

    // Override execute to handle player joining the game
    execute(player: Player, index: number, amount: bigint): void {
        // Verify the action and buy-in amount
        this.verify(player);
        
        if (!amount) {
            throw new Error("Amount required for JOIN action");
        }
        
        // Find next empty seat
        const seat = this.game.findNextEmptySeat();
        
        // Check if the table is full
        if (seat === -1) {
            throw new Error("Table full.");
        }
        
        // Check if player is already in the game
        if (this.game.exists(player.address)) {
            throw new Error("Player already joined.");
        }
        
        // Check if buy-in amount is valid
        // const minBuyIn = this.game["_gameOptions"].minBuyIn;
        // const maxBuyIn = this.game["_gameOptions"].maxBuyIn;
        
        // if (amount < minBuyIn || amount > maxBuyIn) {
        //     throw new Error(`Buy-in must be between ${minBuyIn} and ${maxBuyIn}`);
        // }
        
        // Set player's chips to the buy-in amount
        player.chips = amount;
        
        // Set player status to active
        player.updateStatus(PlayerStatus.ACTIVE);
        
        // Add player to the game at the found seat
        this.game["_playersMap"].set(seat, player);
        
        // Record the join action
        this.game.addNonPlayerAction({
            playerId: player.address,
            action: NonPlayerActionType.JOIN,
            index: index,
            amount: amount
        });
    }
}

export default JoinAction;
