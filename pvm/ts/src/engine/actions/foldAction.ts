import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { IAction, Range } from "../types";

class FoldAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.FOLD }

    /**
     * Verify if a player can fold. In poker, folding is always allowed regardless of player status
     * or game state, as players can always choose to forfeit their hand.
     * 
     * Unlike other actions which have restrictions on when they can be performed,
     * folding is universally permitted so that players can exit a hand that they 
     * don't wish to continue playing.
     * 
     * @param player The player attempting to fold
     * @returns A Range object with min and max amount both set to 0 (folding costs nothing)
     */
    verify(player: Player): Range {

        super.verify(player);

        if (player.status === PlayerStatus.FOLDED) {
            // Player has already folded, no need to fold again
            throw new Error("Player has already folded.");
        }

        this.validateNotInSpecificRound(TexasHoldemRound.SHOWDOWN);

        if (this.isLastLivePlayer(player)) {
            // If the player is the last live player, they cannot fold
            throw new Error("Cannot fold when you are the last live player.");
        }

        // No status checks needed - allow any player to fold regardless of status
        // This overrides the base verify method which otherwise requires the player to be active
        // and for it to be their turn to act
        return { minAmount: 0n, maxAmount: 0n };
    }

    /**
     * Execute the fold action, setting the player's status to FOLDED
     * 
     * @param player The player performing the fold action
     * @param index The sequential action index for this game
     * @param amount Optional amount parameter (unused for fold)
     */
    execute(player: Player, index: number, _amount?: bigint): void {
        // First verify the action
        this.verify(player);

        // Set player status to FOLDED
        player.updateStatus(PlayerStatus.FOLDED);

        // Add the action to the game
        const round = this.game.currentRound;
        this.game.addAction({ playerId: player.address, action: PlayerActionType.FOLD, index: index }, round);
    }

    private isLastLivePlayer(player: Player): boolean {
        // Check if the player is the last active player in the game
        const findLivePlayers = this.game.findLivePlayers();
        return findLivePlayers.length === 1 && findLivePlayers[0].address === player.address;
    }
}

export default FoldAction;