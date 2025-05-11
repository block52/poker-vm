import { NonPlayerActionType, PlayerStatus } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { Range } from "../types";

class JoinAction extends BaseAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.JOIN;
    }

    // Override verify method for join action
    verify(_player: Player): Range {
        // For joining, we don't need to verify against an existing player

        // Now we can use the actual min/max buy-in values
        return {
            minAmount: this.game.minBuyIn,
            maxAmount: this.game.maxBuyIn
        };
    }

    // Override execute to handle player joining
    execute(player: Player, index: number, amount?: bigint, requestedSeat?: number): void {
        // First verify the action
        const range = this.verify(player);
        console.log(`[JoinAction DEBUG] execute called with player=${player.address}, index=${index}, amount=${amount}, requestedSeat=${requestedSeat}`);

        // Check if the amount is within the valid range
        const buyIn = amount || 0n;
        if (buyIn < range.minAmount || buyIn > range.maxAmount) {
            throw new Error("Player does not have enough or too many chips to join.");
        }

        // Find an available seat or use the requested one
        const seat = requestedSeat === undefined ? this.game.findNextEmptySeat() : requestedSeat;

        console.log(`[JoinAction DEBUG] FINAL - Adding player ${player.address} to seat ${seat} with ${buyIn} chips`);
        this.game.joinAtSeat(player, seat);

        // Add join action to history without the seat property (it will be added automatically in texasHoldem.ts)
        this.game.addNonPlayerAction(
            {
                playerId: player.address,
                action: NonPlayerActionType.JOIN,
                index: index,
                amount: buyIn
            },
            seat.toString()
        );

        console.log(`[JoinAction DEBUG] Join action completed for player ${player.address} at seat ${seat}`);
    }
}

export default JoinAction;
