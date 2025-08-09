import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { IAction, Range } from "../types";

class SitInAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.SIT_IN }

    /**
     * Verify if a player can sit in. In poker, sitting in is allowed regardless of player status
     * or game state, as players can always choose to join a hand.
     * 
     * Unlike other actions which have restrictions on when they can be performed,
     * sitting in is universally permitted so that players can enter a hand that they
     * wish to participate in.
     *
     * @param player The player attempting to sit in
     * @returns A Range object with min and max amount both set to 0 (sitting in costs nothing)
     */
    verify(player: Player): Range {
        if (player.status === PlayerStatus.FOLDED) {
            return { minAmount: 0n, maxAmount: 0n };
        }

        if (this.game.currentRound !== TexasHoldemRound.ANTE) {
            throw new Error("Sit out action is not allowed during showdown round.");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }

    /**
     * Execute the fold action, setting the player's status to FOLDED
     * 
     * @param player The player performing the fold action
     * @param index The sequential action index for this game
     * @param amount Optional amount parameter (unused for fold)
     */
    execute(player: Player, index: number, amount?: bigint): void {
        // First verify the action
        this.verify(player);

        // Set player status to SITTING_OUT
        player.updateStatus(PlayerStatus.SITTING_OUT);

        // Add the action to the game
        const round = this.game.currentRound;
        this.game.addAction({ playerId: player.address, action: PlayerActionType.SIT_OUT, index: index }, round);
    }
}

export default SitOutAction;