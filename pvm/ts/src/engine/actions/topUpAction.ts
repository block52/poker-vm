
import { NonPlayerActionType, PlayerStatus } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { IAction, Range } from "../types";

class TopUpAction extends BaseAction implements IAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.TOPUP;
    }

    // Override verify method for top-up action
    verify(player: Player): Range {
        // Player must be seated to top up
        if (player.status === PlayerStatus.SITTING_OUT) {
            throw new Error("Player must be seated to top up");
        }

        // Get game options for max buy-in validation
        const gameOptions = (this.game as any)._gameOptions;
        if (!gameOptions) {
            throw new Error("Game options not available");
        }

        // Calculate maximum top-up amount allowed
        const currentStack = player.chips;
        const maxBuyIn = gameOptions.maxBuyIn;
        const maxTopUpAmount = maxBuyIn - currentStack;

        if (maxTopUpAmount <= 0n) {
            throw new Error("Player is already at maximum buy-in limit");
        }

        // Determine minimum top-up amount
        // If available space is less than big blind, allow smaller top-ups
        const bigBlind = gameOptions.bigBlind;
        const minTopUpAmount = maxTopUpAmount < bigBlind ? 1n : bigBlind;

        // Additional validation to ensure we have a valid range
        if (minTopUpAmount > maxTopUpAmount) {
            throw new Error(`Cannot top up: available space (${maxTopUpAmount}) is less than minimum required (${bigBlind})`);
        }

        return {
            minAmount: minTopUpAmount,
            maxAmount: maxTopUpAmount
        };
    }

    // Override execute to handle player topping up
    execute(player: Player, index: number, amount?: bigint): void {
        if (!amount || amount <= 0n) {
            throw new Error("Top-up amount must be greater than 0");
        }

        // Verify the amount is within allowed range
        const range = this.verify(player);
        if (amount < range.minAmount || amount > range.maxAmount) {
            throw new Error(`Top-up amount must be between ${range.minAmount} and ${range.maxAmount}`);
        }

        // Add the amount to the player's stack
        player.chips += amount;

        console.log(`Player ${player.address} topped up ${amount} chips. New stack: ${player.chips}`);

        // Record the action in the game using the base class method
        this.game.addNonPlayerAction(
            {
                playerId: player.address,
                action: NonPlayerActionType.TOPUP,
                amount: amount,
                index: index
            }
        );
    }
}

export default TopUpAction; 