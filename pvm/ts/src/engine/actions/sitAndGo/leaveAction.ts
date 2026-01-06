import { NonPlayerActionType, PlayerStatus, PlayerActionType } from "@block52/poker-vm-sdk";
import BaseAction from "./../baseAction";
import { Player } from "../../../models/player";
import { IAction, Range } from "../../types";
import { PayoutManager } from "../../managers/payoutManager";

class LeaveAction extends BaseAction implements IAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.LEAVE;
    }

    // Override verify method - block leaving after game starts for SNG/Tournament
    verify(player: Player): Range {
        if (player.status !== PlayerStatus.ACTIVE) {
            throw new Error("Player is not active and cannot leave.");
        }

        if (player.chips <= 0n) {
            throw new Error("Player has no chips and cannot leave.");
        }

        // Block leaving after the game has started (any blind posted)
        const hasStarted = this.game.getPreviousActions().some(
            a => a.action === PlayerActionType.SMALL_BLIND || a.action === PlayerActionType.BIG_BLIND
        );
        if (hasStarted) {
            throw new Error("Cannot leave a SNG/Tournament table after the game has started.");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }

    // Override execute to handle player leaving
    execute(player: Player, index: number): void {
        this.verify(player);

        // Get player seat BEFORE changing any state
        const seat = this.game.getPlayerSeatNumber(player.address);
        this.game.dealerManager.handlePlayerLeave(seat);

        const players = this.game.findLivePlayers();
        const payoutManager = new PayoutManager(100n, players);
        const amount = payoutManager.calculateCurrentPayout();
        console.log(`Player ${player.address} at seat ${seat} leaving with ${amount} amount...`);

        this.game.removePlayer(player.address);

        // Add leave action to history BEFORE removing the player
        this.game.addNonPlayerAction({ 
            playerId: player.address, 
            action: NonPlayerActionType.LEAVE, 
            index: index,
            amount: amount // Include payout amount in the action
        }, seat.toString());
    }
}

export default LeaveAction;
