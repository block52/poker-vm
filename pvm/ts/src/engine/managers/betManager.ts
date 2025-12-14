import { NonPlayerActionType, PlayerActionType } from "@block52/poker-vm-sdk";
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
    private readonly game: { bigBlind: bigint };

    constructor(turns: Turn[] = [], game?: { bigBlind: bigint }) {
        this.game = game || { bigBlind: 0n };
        // Initialize the bet manager
        this.addTurns(turns);
    }

    add(action: Turn): void {
        // Implementation for adding an action to the bet manager
        if (action.playerId && action.amount !== undefined) {
            if (action.action === NonPlayerActionType.JOIN ||
                action.action === NonPlayerActionType.LEAVE) {
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
        const previousBet = this.previous();
        if (currentBet === 0n || previousBet === 0n) {
            return 0n;
        }
        // The last raise is the difference between the current bet and the previous bet
        return currentBet - previousBet;
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

    getLastAggressor(): bigint {
        // Check if the last action was aggressive
        if (this.turns.length === 0) {
            return 0n;
        }

        const lastTurn = this.turns[this.turns.length - 1];

        // If the last action was passive (call, check), return 0n
        if (lastTurn.action === PlayerActionType.CALL || lastTurn.action === PlayerActionType.CHECK) {
            return 0n;
        }

        // If the last action was aggressive
        if (lastTurn.action === PlayerActionType.BET ||
            lastTurn.action === PlayerActionType.RAISE ||
            lastTurn.action === PlayerActionType.BIG_BLIND ||
            lastTurn.action === PlayerActionType.SMALL_BLIND) {

            // Check if the same player had a previous non-blind aggressive action
            for (let i = this.turns.length - 2; i >= 0; i--) {
                const turn = this.turns[i];
                if (turn.action === PlayerActionType.BET || turn.action === PlayerActionType.RAISE) {

                    // If the same player had a previous bet/raise, return 0n
                    if (turn.playerId === lastTurn.playerId) {
                        return 0n;
                    }
                    // If different player had previous bet/raise, return current aggressor's amount
                    else {
                        return this.bets.get(lastTurn.playerId) || 0n;
                    }
                }
            }

            // No previous bet/raise found, return current aggressor's amount
            return this.bets.get(lastTurn.playerId) || 0n;
        }

        // For other actions, return 0n
        return 0n;
    }    /**
     * Get the last aggressor in the betting sequence
     * @returns The amount of the last aggressor's bet
     * @description The last aggressor is the player who made the last bet or raise in
     */
    getLastAggressorBet(): bigint {
        const sortedAggregatedBets = this.aggregatedBets.sort((a, b) => a.index - b.index);
        if (sortedAggregatedBets.length === 0) {
            return 0n;
        }
        const start = sortedAggregatedBets.length;
        return sortedAggregatedBets[start - 1]?.amount || 0n;
    }

    /**
     * Gets the amount of the last raise in the current betting round
     * @returns The size of the last raise, or big blind if no raises have occurred
     */
    getRaisedAmount(): bigint {
        const bets = this.getBets();
        const betsArray = Array.from(bets.entries()).map(([playerId, amount]) => ({ playerId, amount }));

        if (betsArray.length === 0) {
            // No bets at all, return big blind as minimum raise
            return this.game.bigBlind;
        }

        if (betsArray.length === 1) {
            // Only one bet exists, minimum raise is big blind
            return this.game.bigBlind;
        }

        // Check if this involves only blinds or includes bet/raise actions
        const hasNonBlindActions = this.turns.some(turn =>
            turn.action === PlayerActionType.BET || turn.action === PlayerActionType.RAISE
        );

        // If only blinds, the minimum raise amount is the big blind
        if (!hasNonBlindActions) {
            return this.game.bigBlind;
        }

        // Sort bets by amount in descending order
        const sortedBets = [...betsArray].sort((a, b) => Number(b.amount - a.amount));

        // The raise amount is the difference between the largest and second largest bet
        const largestBet = sortedBets[0].amount;
        const secondLargestBet = sortedBets[1].amount;
        const raiseDelta = largestBet - secondLargestBet;

        // If delta is less than big blind, return big blind
        if (raiseDelta < this.game.bigBlind) {
            return this.game.bigBlind;
        }

        return raiseDelta;
    }
}