import { GameOptions, PlayerStatus } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";

export class PayoutManager {

    // This class will handle the payout logic for the game
    // It will calculate payouts based on the game state and player positions

    constructor(private readonly gameOptions: GameOptions, private readonly players: Player[], private readonly runners?: number) {
        // Initialize any necessary properties or dependencies
    }

    calculateCurrentPayout(): BigInt {
        const livePlayers = this.players.filter(player => player.status === PlayerStatus.ACTIVE);

        if (livePlayers.length === 0) {
            throw new Error("No active players to calculate payout");
        }

        // Determine payout position based on remaining players
        // If only 1 player left, they get 1st place
        // If only 2 players left, next elimination gets 2nd place
        // If only 3 players left, next elimination gets 3rd place
        const payoutPosition = livePlayers.length;

        return this.calculatePayout(payoutPosition);
    }

    calculatePayout(place: number): BigInt {
        if (place < 1 || place > 3) {
            return 0n; // Only top 3 places get paid
        }

        const totalPrizePool = BigInt(this.gameOptions.minBuyIn) * BigInt(9); // 9 players total

        switch (place) {
            case 1: // First place - 60%
                return (totalPrizePool * 60n) / 100n;
            case 2: // Second place - 30%
                return (totalPrizePool * 30n) / 100n;
            case 3: // Third place - 10%
                return (totalPrizePool * 10n) / 100n;
            default:
                return 0n;
        }
    }
}