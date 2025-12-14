import { PlayerStatus } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";

export class PayoutManager {

    private readonly players: Player[];
    private readonly runners: number;
    private readonly totalPrizePool: bigint;
    // This class will handle the payout logic for the game
    // It will calculate payouts based on the game state and player positions

    constructor(private readonly buyIn: bigint, players: Player[]) {
        // Copy players array to avoid mutating the original
        this.players = [...players];
        this.runners = players.length;
        this.totalPrizePool = this.buyIn * BigInt(this.runners);
    }

    calculateCurrentPayout(): bigint {
        const livePlayers = this.players.filter(player => player.status !== PlayerStatus.BUSTED);

        if (livePlayers.length === 0) {
            throw new Error("No active players to calculate payout");
        }

        // Determine payout position based on remaining players
        // If only 1 player left, they get 1st place
        // If only 2 players left, next elimination gets 2nd place
        // If only 3 players left, next elimination gets 3rd place

        return this.calculatePayout(livePlayers.length);
    }

    calculatePayout(place: number): bigint {
        // Payout structure based on number of runners
        if (this.runners < 6) {
            switch (place) {
                case 1: // First place - 100%
                    return (this.totalPrizePool * 80n) / 100n;
                case 2: // Second place - 0%
                    return (this.totalPrizePool * 20n) / 100n;
                default: // Third place - 0%
                    return 0n;
            }
        }

        switch (place) {
            case 1: // First place - 60%
                return (this.totalPrizePool * 60n) / 100n;
            case 2: // Second place - 30%
                return (this.totalPrizePool * 30n) / 100n;
            case 3: // Third place - 10%
                return (this.totalPrizePool * 10n) / 100n;
            default:
                return 0n;
        }
    }
}