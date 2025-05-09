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

        // Return min/max buy-in options - we can't access these directly yet
        // TODO: Add getters for minBuyIn and maxBuyIn to TexasHoldemGame
        return { 
            minAmount: this.game.smallBlind * 100n, // Typical minimum buy-in is 100 big blinds 
            maxAmount: this.game.smallBlind * 2000n // Typical maximum is 200 big blinds
        };
    }

    // Override execute to handle player joining
    execute(player: Player, index: number, amount: bigint): void {
        // For reference, this is what should be done but we can't do it directly:
        // 1. Validate the amount is between min/max buy-in
        // 2. Check if player already exists
        // 3. Find an available seat (or use the provided seat)
        // 4. Add player to the game
        // 5. Set player status to active
        // 6. Record the join action in the action history
        
        // Add join action to history
        // Note: The actual join logic will be handled by TexasHoldemGame's join() method
        this.game.addNonPlayerAction({
            playerId: player.address, 
            action: NonPlayerActionType.JOIN, 
            index: index,
            amount: amount
        });
        
        // TODO: Add a comment in performAction mentioning that:
        // The RPC could accept an optional 'seat' parameter in data to allow players to choose seats:
        // RPC params: [address, gameAddress, "join", amount, nonce, seatNumber]
    }
}

export default JoinAction;
