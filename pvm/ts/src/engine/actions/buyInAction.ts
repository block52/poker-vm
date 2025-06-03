import { NonPlayerActionType, PlayerStatus } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { Range } from "../types";

class BuyInAction extends BaseAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.JOIN;
    }

    // Override verify method for join action
    verify(_player: Player): Range {
        if (_player.status !== PlayerStatus.SITTING_OUT || _player.status === PlayerStatus.FOLDED) {
            throw new Error("Player must be sitting out to join the game.");

        }

        // Now we can use the actual min/max buy-in values
        return {
            minAmount: this.game.minBuyIn,
            maxAmount: this.game.maxBuyIn
        };
    }

    // Override execute to handle player joining
    execute(player: Player, index: number, amount?: bigint): void {
        // First verify the action
        const range = this.verify(player);

        // Check if the amount is within the valid range
        const buyIn = amount || 0n;
        if (buyIn < range.minAmount || buyIn > range.maxAmount) {
            throw new Error("Player does not have enough or too many chips to join.");
        }

    }
}

export default BuyInAction;
