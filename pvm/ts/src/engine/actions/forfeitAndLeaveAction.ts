import { NonPlayerActionType, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { Range } from "../types";

/**
 * ForfeitAndLeaveAction allows a player to leave the table regardless of game state.
 * If the player is active in a hand, they will be folded first, then removed from the table.
 * This is useful for testing and for situations where a player needs to leave immediately.
 */
class ForfeitAndLeaveAction extends BaseAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.LEAVE;
    }

    // Override verify - this action is always allowed (player forfeits their hand if needed)
    verify(player: Player): Range {
        // Always allow forfeit and leave - no restrictions
        return { minAmount: player.chips, maxAmount: player.chips };
    }

    // Override execute to handle player forfeiting and leaving
    execute(player: Player, index: number): void {
        this.verify(player);

        // Get player seat BEFORE changing any state
        const seat = this.game.getPlayerSeatNumber(player.address);
        const playerAddress = player.address;
        const playerChips = player.chips;
        const currentRound = this.game.currentRound;

        console.log(`Player ${playerAddress} at seat ${seat} forfeiting and leaving with ${playerChips} chips...`);

        // If player is active in a hand (not folded, not sitting out, not in ANTE round),
        // fold them first
        const isInAnteRound = currentRound === TexasHoldemRound.ANTE;
        const isNotActiveInHand = player.status === PlayerStatus.FOLDED ||
                                  player.status === PlayerStatus.SITTING_OUT;

        if (!isInAnteRound && !isNotActiveInHand) {
            console.log(`Player ${playerAddress} is active in hand, folding first...`);
            // Set player status to FOLDED
            player.updateStatus(PlayerStatus.FOLDED);

            // Add fold action to the game history
            this.game.addAction({
                playerId: playerAddress,
                action: PlayerActionType.FOLD,
                index: index
            }, currentRound);
        }

        // Handle dealer rotation if needed
        this.game.dealerManager.handlePlayerLeave(seat);

        // Remove player from the game
        this.game.removePlayer(playerAddress);

        // Add leave action to history (using standard LEAVE type)
        this.game.addNonPlayerAction({
            playerId: playerAddress,
            action: NonPlayerActionType.LEAVE,
            index: index,
            amount: playerChips
        }, seat.toString());
    }
}

export default ForfeitAndLeaveAction;