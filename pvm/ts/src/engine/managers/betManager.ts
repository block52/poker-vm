import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Turn } from "../types";
import { IBetManager } from "../../types/interfaces";

type AggregatedBet = {
    index: number;
    playerId: string;
    amount: bigint;
};

export class BetManager implements IBetManager {

    private readonly bets: Map<string, bigint> = new Map();
    private readonly turns: Turn[] = [];
    private readonly aggregatedBets: AggregatedBet[] = [];

    constructor(turns: Turn[] = []) {
        // Initialize the bet manager
        this.addTurns(turns);
    }

    add(action: Turn): void {
        // Implementation for adding an action to the bet manager
        if (action.playerId && action.amount !== undefined) {
            if (action.action === NonPlayerActionType.JOIN) {
                return;
            }

            const currentBet = this.bets.get(action.playerId) || 0n;
            this.bets.set(action.playerId, currentBet + action.amount);
            this.turns.push(action);

            const aggregatedBet = this.aggregatedBets.find(b => b.playerId === action.playerId);
            if (aggregatedBet) {
                aggregatedBet.amount += action.amount;
            } else {
                this.aggregatedBets.push({
                    index: this.aggregatedBets.length,
                    playerId: action.playerId,
                    amount: action.amount
                });
            }
        }
    }

    addTurns(turns: Turn[]): void {
        const sortedTurns = turns.sort((a, b) => a.index - b.index);
        for (const turn of sortedTurns) {
            this.add(turn);
        }
    }

    count(): number {
        // Count unique players who have placed bets
        return this.aggregatedBets.length;
    }

    current(): bigint {
        if (this.aggregatedBets.length === 0 || this.turns.length === 0) {
            return 0n;
        }
        // Return the last aggregated bet amount
        const lastPlayer = this.turns[this.turns.length - 1].playerId;
        return this.bets.get(lastPlayer) || 0n;
    }

    previous(): bigint {
        if (this.aggregatedBets.length < 2 || this.turns.length < 2) {
            return 0n;
        }
        // Return the second last aggregated bet amount
        const secondLastPlayer = this.turns[this.turns.length - 2].playerId;
        return this.bets.get(secondLastPlayer) || 0n;
    }

    delta(): bigint {
        const currentBet = this.current();
        const biggestBet = this.getLargestBet();
        if (currentBet === 0n || biggestBet === 0n) {
            return 0n;
        }
        // The last raise is the difference between the current bet and the largest bet
        return currentBet - biggestBet;
    }

    getTotalBetsForPlayer(playerId: string): bigint {
        return this.bets.get(playerId) || 0n;
    }

    getBets(): Map<string, bigint> {
        return this.bets;
    }

    getLargestBet(): bigint {
        let largestBet: { playerId: string, amount: bigint } | null = null;

        for (const [playerId, amount] of this.bets.entries()) {
            if (!largestBet || amount > largestBet.amount) {
                largestBet = { playerId, amount };
            }
        }

        return largestBet?.amount || 0n;
    }

    /**
     * Get the last aggressor in the betting sequence
     * @returns The playerId of the last aggressor or null if no aggressor found
     */
    getLastAggressor(): bigint {
        const sortedAggregatedBets = this.aggregatedBets.sort((a, b) => a.index - b.index);
        if (sortedAggregatedBets.length === 0) {
            return 0n;
        }
        const start = sortedAggregatedBets.length;
        return sortedAggregatedBets[start - 1]?.amount || 0n;
    }

    // /**
    //  * Get the last aggressor in the betting sequence
    //  * @param start - The index to start searching from (default is the end of the turns array)
    //  * @returns The playerId of the last aggressor or null if no aggressor found
    //  */
    // getLastAggressor(start: number = this.turns.length): string | null {
    //     const sortedTurns = this.turns.sort((a, b) => a.index - b.index);

    //     // Find the last action that was a bet or raise
    //     for (let i = start - 1; i >= 0; i--) {
    //         const turn = sortedTurns[i];
    //         if (turn.action === PlayerActionType.BET || turn.action === PlayerActionType.RAISE) {
    //             return turn.playerId || null;
    //         }
    //     }

    //     return null;
    // }
}