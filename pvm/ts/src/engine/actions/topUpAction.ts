import { NonPlayerActionType, PlayerStatus } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { Range } from "../types";

/**
 * TopUpAction allows players to add chips to their stack when not in an active hand.
 *
 * Players can top up when:
 * - They are BUSTED (0 chips)
 * - They are SITTING_OUT
 * - They are between hands (not ACTIVE or ALL_IN)
 *
 * The total chips after top-up cannot exceed the table's maximum buy-in.
 */
class TopUpAction extends BaseAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.TOP_UP;
    }

    /**
     * Verify if a player can top up with the specified amount
     * @param player The player attempting to top up
     * @param amount The amount to add to the player's stack
     * @returns Range with min and max allowed top-up amounts
     */
    verify(player: Player, amount?: bigint): Range {
        // Player must not be in an active hand
        if (player.status === PlayerStatus.ACTIVE || player.status === PlayerStatus.ALL_IN || player.status === PlayerStatus.SHOWING) {
            throw new Error("Cannot top up while in an active hand");
        }

        const currentChips = player.chips;
        const maxBuyIn = this.game.maxBuyIn;

        // Calculate maximum allowed top-up
        // Total chips after top-up cannot exceed table max buy-in
        const maxTopUp = maxBuyIn - currentChips;

        if (maxTopUp <= 0n) {
            throw new Error("Already at maximum buy-in");
        }

        // Validate the amount if provided
        if (amount !== undefined) {
            if (amount <= 0n) {
                throw new Error("Top-up amount must be positive");
            }

            if (amount > maxTopUp) {
                throw new Error(`Top-up amount exceeds table maximum. Max allowed: ${maxTopUp}`);
            }
        }

        return { minAmount: 1n, maxAmount: maxTopUp };
    }

    /**
     * Execute the top-up action
     * @param player The player performing the top-up
     * @param index The sequential action index for this game
     * @param amount The amount to add to the player's stack
     */
    execute(player: Player, index: number, amount?: bigint): void {
        if (!amount || amount <= 0n) {
            throw new Error("Top-up amount is required and must be positive");
        }

        // Verify the action is valid
        this.verify(player, amount);

        // Add chips to player's stack
        player.chips += amount;

        // If player was BUSTED, set them to SITTING_OUT so they join next hand
        if (player.status === PlayerStatus.BUSTED) {
            player.updateStatus(PlayerStatus.SITTING_OUT);
        }

        // Record the action
        this.game.addNonPlayerAction(
            {
                playerId: player.address,
                action: NonPlayerActionType.TOP_UP,
                amount: amount,
                index: index
            },
            "" // No additional data needed
        );
    }
}

export default TopUpAction;
