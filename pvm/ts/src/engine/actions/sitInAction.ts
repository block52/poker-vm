import { NonPlayerActionType, PlayerStatus } from "@block52/poker-vm-sdk";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { IAction, Range } from "../types";

class SitInAction extends BaseAction implements IAction {
    get type(): NonPlayerActionType { return NonPlayerActionType.SIT_IN }

    /**
     * Verify if a player can sit in. In poker, sitting in is allowed regardless of player status
     * or game state, as players can always choose to join the game.
     * 
     * Unlike other actions which have restrictions on when they can be performed,
     * sitting in is universally permitted so that players can join a hand at any time.
     *
     * @param player The player attempting to sit in
     * @returns A Range object with min and max amount both set to 0 (sitting in costs nothing)
     */
    verify(player: Player): Range {
        if (player.status !== PlayerStatus.SITTING_OUT) {
            throw new Error("Sit in action is not allowed if player is not sitting out.");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }

    /**
     * Execute the sit-in action, setting the player's status to ACTIVE
     *
     * @param player The player performing the sit-in action
     * @param index The sequential action index for this game
     * @param amount Amount parameter (unused for sit-in)
     */
    execute(player: Player, index: number, _amount: bigint): void {
        // First verify the action
        this.verify(player);

         // Set player status to ACTIVE (ready to play)
        player.updateStatus(PlayerStatus.ACTIVE);

        // Add the action to the game
        const round = this.game.currentRound;
        this.game.addAction({ playerId: player.address, action: NonPlayerActionType.SIT_IN, index: index }, round);
    }
}

export default SitInAction;