import { NonPlayerActionType } from "@block52/poker-vm-sdk";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { Range } from "../types";

class JoinAction extends BaseAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.JOIN;
    }

    // Override verify method for join action
    verify(player: Player): Range {
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
    execute(player: Player, index: number, amount?: bigint, requestedSeat?: string): void {
        // First verify the action
        const range = this.verify(player);

        // Check if the amount is within the valid range
        const buyIn = amount || 0n;
        if (buyIn < range.minAmount || buyIn > range.maxAmount) {
            throw new Error("Player does not have enough or too many chips to join.");
        }

        if (!requestedSeat) {
            throw new Error("Seat must be specified in the format 'seat=<number>'");
        }

        // Find an available seat or use the requested one
        const seat: number = this.getSeat(requestedSeat);
        this.game.joinAtSeat(player, seat);
        this.game.dealerManager.handlePlayerJoin(seat);

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
    }

    // Refactored method to handle seat assignment cleanly without legacy number support
    private getSeat(data?: string): number {
        let seat: number;

        if (data === undefined || data === "" || data === null) {
            // Get all available seats
            const availableSeats = this.game.getAvailableSeats();

            // If all seats are occupied, throw an error
            if (availableSeats.length === 0)
                throw new Error("No available seats to join.");

            // Choose randomly from the available seats
            const randomIndex = Math.floor(Math.random() * availableSeats.length);
            seat = availableSeats[randomIndex];
        } else {
            // Parse seat number from "seat=X" format
            const seatRegex = /seat=(\d+)/;
            const match = data.match(seatRegex);

            if (match && match[1]) {
                seat = parseInt(match[1], 10);
            } else {
                throw new Error(`Invalid seat data format: ${data}. Expected format: "seat=<number>"`);
            }
        }

        // Validate the seat number
        if (!seat || isNaN(seat) || seat < 1) {
            throw new Error(`Invalid seat number: ${seat}`);
        }

        return seat;
    }
}

export default JoinAction;
