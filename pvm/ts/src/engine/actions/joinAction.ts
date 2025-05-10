import { NonPlayerActionType, PlayerStatus } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { Range } from "../types";

/**
 * JoinAction handles a player joining a table with a specific buy-in amount and seat number.
 * The seat number can be provided in two ways:
 * 1. As a separate requestedSeat parameter (legacy method)
 * 2. As a string in the data parameter (new method, from blockchain transactions)
 */
class JoinAction extends BaseAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.JOIN;
    }

    verify(_player: Player): Range {
        // Any player can join
        return {
            minAmount: this.game.minBuyIn,
            maxAmount: this.game.maxBuyIn
        };
    }

    /**
     * Execute the join action - add player to the game at a specific seat
     * @param player - Player object joining the game
     * @param index - Action index
     * @param amount - Buy-in amount
     * @param requestedSeat - Optional explicit seat number (legacy method)
     * @param data - Optional data string containing seat number (new blockchain transaction method)
     */
    execute(player: Player, index: number, amount?: bigint, requestedSeat?: number, data?: string): void {
        console.log(`[JoinAction] execute called with player=${player.address}, index=${index}, amount=${amount}, requestedSeat=${requestedSeat}, data=${data}`);
        
        // Determine the seat number to use
        let seatNumber: number | undefined = requestedSeat;
        
        // If no explicit seat requested, try to parse seat from data string
        if (seatNumber === undefined && data !== undefined && data !== "") {
            try {
                // Try to parse data as seat number
                seatNumber = parseInt(data, 10);
                console.log(`[JoinAction] Parsed seat number ${seatNumber} from data: "${data}"`);
            } catch (error) {
                console.error(`[JoinAction] Failed to parse seat number from data: "${data}"`, error);
            }
        }
        
        // Handle the case where no seat is specified
        if (seatNumber === undefined) {
            // Find next available seat
            seatNumber = this.game.findNextEmptySeat();
            console.log(`[JoinAction] No seat specified, assigned seat ${seatNumber}`);
        }
        
        // Ensure we have a valid seat number
        if (seatNumber === undefined || isNaN(seatNumber)) {
            console.error(`[JoinAction] Failed to assign a valid seat number for player ${player.address}`);
            return;
        }

        // Set player's chips based on amount provided or default min buy-in
        const chips = amount !== undefined ? amount : this.game.minBuyIn;
        
        // Create a new player with the correct PlayerStatus
        const newPlayer = new Player(
            player.address,
            undefined, // holeCards - none yet
            chips,
            undefined, // hand - none yet
            PlayerStatus.ACTIVE
        );
        
        // Add player to the game at the specified seat
        this.game.joinAtSeat(newPlayer, seatNumber);
        
        // Add the join action to the game history
        this.game.addNonPlayerAction({
            playerId: player.address,
            action: NonPlayerActionType.JOIN,
            index: index,
            amount: chips
        });
        
        console.log(`[JoinAction] Player ${player.address} joined at seat ${seatNumber} with ${chips} chips`);
    }
}

export default JoinAction;
