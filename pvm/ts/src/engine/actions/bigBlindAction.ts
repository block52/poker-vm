import { PlayerActionType, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class BigBlindAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.BIG_BLIND;
    }

    /**
     * Verify if a player can post the big blind
     *
     * For posting a big blind to be valid:
     * 1. Player must be active (not sitting out)
     * 2. Game must be in the ANTE round
     * 3. Player must be in the big blind position
     * 4. Small blind must be posted first
     * 5. Big blind must not have been posted already
     *
     * @param player The player attempting to post the big blind
     * @returns Range object with min and max amount both set to the effective big blind amount
     * @throws Error if the player cannot post the big blind
     */
    verify(player: Player): Range {
        // Player must be active (not sitting out)
        super.verifyPlayerIsActive(player);

        // 1. Round state check: Big blind can only be posted during ANTE round
        this.validateInSpecificRound(TexasHoldemRound.ANTE);

        // 2. Player position check: Only the big blind position can post big blind
        const seat = this.game.getPlayerSeatNumber(player.address);
        if (seat !== this.game.bigBlindPosition) {
            throw new Error("Only the big blind player can post the big blind.");
        }

        // 3. Action sequence check: Small blind must be posted first
        const actions = this.game.getActionsForRound(TexasHoldemRound.ANTE);
        const smallBlindAction = actions.find(a => a.action === PlayerActionType.SMALL_BLIND);
        if (!smallBlindAction) {
            throw new Error("Small blind must be posted before big blind.");
        }

        // 4. Prevent duplicate action: Big blind should not be posted twice
        const bigBlindAction = actions.find(a => a.action === PlayerActionType.BIG_BLIND);
        if (bigBlindAction) {
            throw new Error("Big blind has already been posted.");
        }

        // Return the effective big blind amount
        const effectiveAmount = this.getEffectiveAmount(player);
        return { minAmount: effectiveAmount, maxAmount: effectiveAmount };
    }

    /**
     * Calculate the effective big blind amount for a player.
     * If player has less chips than the big blind, they go all-in with their remaining chips.
     *
     * @param player The player posting the big blind
     * @returns The effective amount to post (min of player's chips and big blind)
     */
    getEffectiveAmount(player: Player): bigint {
        return player.chips < this.game.bigBlind ? player.chips : this.game.bigBlind;
    }

    /**
     * Execute the big blind action.
     * Calculates the effective amount internally based on player's chip stack.
     *
     * @param player The player posting the big blind
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

export default BigBlindAction;
