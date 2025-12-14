import { NonPlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { Range } from "../types";

class LeaveAction extends BaseAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.LEAVE;
    }

    // Override verify method to check if player can leave
    verify(player: Player): Range {
        // For cash games, player must not be active in current hand
        // Can only leave if:
        // 1. Currently in ANTE round (no hand in progress), OR
        // 2. Player status is FOLDED or SITTING_OUT (not active in hand)
        const currentRound = this.game.currentRound;
        const isInAnteRound = currentRound === TexasHoldemRound.ANTE;
        const isNotActiveInHand = player.status === PlayerStatus.FOLDED ||
                                  player.status === PlayerStatus.SITTING_OUT;

        if (!isInAnteRound && !isNotActiveInHand) {
            throw new Error(
                `Cannot leave during active hand. Player status: ${player.status}, Round: ${currentRound}. ` +
                `Player must fold or wait until hand completes (ANTE round).`
            );
        }

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

        this.game.removePlayer(playerAddress);

        // Add leave action to history BEFORE removing the player
        this.game.addNonPlayerAction({ 
            playerId: playerAddress, 
            action: NonPlayerActionType.LEAVE, 
            index: index,
            amount: playerChips // Include chips amount in the action
        }, seat.toString());
    }
}

export default LeaveAction;
