import { PlayerActionType, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class SmallBlindAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.SMALL_BLIND }

    /**
     * Verify if a player can post the small blind
     *
     * For posting a small blind to be valid:
     * 1. Player must be active and it must be their turn (checked in base verify)
     * 2. Game must be in the ANTE round (blinds are only posted before dealing)
     * 3. Player must be in the small blind position
     * 4. Small blind must not have been posted already
     *
     * @param player The player attempting to post the small blind
     * @returns Range object with min and max amount both set to the effective small blind amount
     * @throws Error if the player cannot post the small blind
     */
    verify(player: Player): Range {
        // Player must be active (not sitting out)
        super.verifyPlayerIsActive(player);

        // Game must be in the ANTE round
        this.validateInSpecificRound(TexasHoldemRound.ANTE);

        if (this.game.getActivePlayerCount() < this.game.minPlayers) {
            throw new Error(`Cannot post small blind with less than ${this.game.minPlayers} players.`);
        }

        // Player must be in the small blind position
        const seat = this.game.getPlayerSeatNumber(player.address);
        if (seat !== this.game.smallBlindPosition) {
            throw new Error("Only the small blind player can bet the small blind amount.");
        }

        const actions = this.game.getActionsForRound(TexasHoldemRound.ANTE);

        // Check if small blind has already been posted
        const smallBlindAction = actions.find(a => a.action === PlayerActionType.SMALL_BLIND);
        if (smallBlindAction) {
            throw new Error("Small blind has already been posted.");
        }

        // Return the effective small blind amount
        const effectiveAmount = this.getEffectiveAmount(player);
        return { minAmount: effectiveAmount, maxAmount: effectiveAmount };
    }

    /**
     * Calculate the effective small blind amount for a player.
     * If player has less chips than the small blind, they go all-in with their remaining chips.
     *
     * @param player The player posting the small blind
     * @returns The effective amount to post (min of player's chips and small blind)
     */
    getEffectiveAmount(player: Player): bigint {
        return player.chips < this.game.smallBlind ? player.chips : this.game.smallBlind;
    }

    /**
     * Execute the small blind action.
     * Calculates the effective amount internally based on player's chip stack.
     *
     * @param player The player posting the small blind
     * @param index The action index
     * @param _amount Optional amount parameter (ignored - amount is calculated internally)
     */
    execute(player: Player, index: number, _amount?: bigint): void {
        const effectiveAmount = this.getEffectiveAmount(player);
        super.execute(player, index, effectiveAmount);

        // Set player state to ALL_IN if they have no chips left after posting the blind
        this.setAllInWhenBalanceIsZero(player);
    }
}

export default SmallBlindAction;
