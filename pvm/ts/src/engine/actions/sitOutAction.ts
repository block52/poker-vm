import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { IAction, Range } from "../types";

class SitOutAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.SIT_OUT }

    /**
     * Verify if a player can sit out. In poker, sitting out is allowed regardless of player status
     * or game state, as players can always choose to forfeit their hand.
     * 
     * Unlike other actions which have restrictions on when they can be performed,
     * sitting out is universally permitted so that players can exit a hand that they
     * don't wish to continue playing.
     *
     * @param player The player attempting to sit out
     * @returns A Range object with min and max amount both set to 0 (sitting out costs nothing)
     */
    verify(player: Player): Range {
        if (player.status === PlayerStatus.FOLDED) {
            return { minAmount: 0n, maxAmount: 0n };
        }

        this.validateInSpecificRound(TexasHoldemRound.ANTE);

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

        // Set player status to SITTING_OUT
        player.updateStatus(PlayerStatus.SITTING_OUT);

        // Add the action to the game
        const round = this.game.currentRound;
        this.game.addAction({ playerId: player.address, action: PlayerActionType.SIT_OUT, index: index }, round);
    }
}

export default SitOutAction;