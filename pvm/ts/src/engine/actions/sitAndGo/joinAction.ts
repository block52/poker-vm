import { NonPlayerActionType } from "@block52/poker-vm-sdk";
import BaseAction from "./../baseAction";
import { Player } from "../../../models/player";
import { IAction, Range } from "../../types";
import { ethers } from "ethers";

class JoinAction extends BaseAction implements IAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.JOIN;
    }

    // Override verify method for join action
    verify(player: Player): Range {

        // if (this.game.status !== "waiting-for-players") {
        //     throw new Error("Game is not in the waiting-for-players state.");
        // }

        if (this.game.exists(player.address)) {
            throw new Error("Player already exists in the game.");
        }

        // Now we can use the actual min/max buy-in values
        return {
            minAmount: this.game.minBuyIn,
            maxAmount: this.game.maxBuyIn
        };
    }

    // Override execute to handle player joining
    execute(player: Player, index: number, amount?: bigint, data?: string): void {
        // First verify the action
        const range = this.verify(player);

        // Check if the amount is within the valid range
        const buyIn = amount || 0n;
        if (buyIn < range.minAmount || buyIn > range.maxAmount) {
            throw new Error("Player does not have enough funds to cover the buy-in.");
        }

        // For testing purposes, we give the player 10,000 chips
        const chips: bigint = ethers.parseEther("10000");
        player.chips = chips;

        // Find an available seat or use the requested one
        const seat: number = this.getSeat(data);
        this.game.joinAtSeat(player, seat);
        this.game.dealerManager.handlePlayerJoin(seat);

        // Add join action to history without the seat property (it will be added automatically in texasHoldem.ts)
        this.game.addNonPlayerAction(
            {
                playerId: player.address,
                action: NonPlayerActionType.JOIN,
                index: index,
                amount: chips
            },
            seat.toString()
        );
    }

    private getSeat(data?: string): number {
        if (!data) {
            throw new Error("Invalid seat data.");
        }

        // Find an available seat or use the requested one
        let seat: number = 1;

        // Hack for old unit tests
        // Check via REGEX if data has the format "seat=1"
        // Should be anywhere in the string, so we use ^ and $ to match the whole string
        const seatRegex = /seat=(\d+)/;
        const match = data.match(seatRegex);

        if (match && match[1]) {
            return parseInt(match[1], 10);
        }

        // If it doesn't match the regex, we assume it's a seat number
        // and parse it directly.  Old unit tests used to pass the seat number directly
        // without the "seat=" prefix.
        if (!match) {
            // If it matches, parse the seat number
            seat = parseInt(data);
        }

        // Validate the seat number, ensuring it's a valid integer
        if (!seat || isNaN(seat) || seat < 1 || seat === undefined) {
            throw new Error(`Invalid seat number: ${seat}`);
        }

        return seat;
    }
}

export default JoinAction;
