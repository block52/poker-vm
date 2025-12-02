import { NonPlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { IAction, Range } from "../types";

class SitOutAction extends BaseAction implements IAction {
    get type(): NonPlayerActionType { return NonPlayerActionType.SIT_OUT }

    /**
     * Verify if a player can sit out. Players can always sit out regardless of game state.
     * This is a non-player action that allows players to leave the active game at any time.
     *
     * @param player The player attempting to sit out
     * @returns A Range object with min and max amount both set to 0 (sitting out costs nothing)
     */
    verify(player: Player): Range {
        // Players can always sit out
        return { minAmount: 0n, maxAmount: 0n };
    }

    /**
     * Execute the sit out action.
     * If the player is in an active hand, they are folded first (internal state change).
     *
     * @param player The player performing the sit out action
     * @param index The sequential action index for this game
     * @param amount Optional amount parameter (unused for sit out)
     */
    execute(player: Player, index: number, _amount?: bigint): void {
        this.verify(player);

        // If player is in an active hand, fold them first (internal state change only)
        if (player.status === PlayerStatus.ACTIVE &&
            this.game.currentRound !== TexasHoldemRound.ANTE &&
            this.game.currentRound !== TexasHoldemRound.END) {
            player.updateStatus(PlayerStatus.FOLDED);
            player.holeCards = undefined;  // Muck their cards
        }

        // Set player status to SITTING_OUT
        player.updateStatus(PlayerStatus.SITTING_OUT);

        // Record as non-player action
        this.game.addNonPlayerAction({
            playerId: player.address,
            action: NonPlayerActionType.SIT_OUT,
            index
        });
    }
}

export default SitOutAction;
