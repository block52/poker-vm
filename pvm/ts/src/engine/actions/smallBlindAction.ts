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
     * @returns Range object with min and max amount both set to the small blind amount
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

        // Small blind can only be exactly the small blind amount
        return { minAmount: this.game.smallBlind, maxAmount: this.game.smallBlind };
    }

    /**
     * Get the amount to deduct for small blind
     * Always returns the exact small blind amount
     */
    getDeductAmount(): bigint {
        return this.game.smallBlind;
    }
}

export default SmallBlindAction;