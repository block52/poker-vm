import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range, Turn } from "../types";

type AggregatedBet = {
    index: number;
    playerId: string;
    amount: bigint;
};

class BetManager {

    private readonly bets: Map<string, bigint> = new Map();
    private readonly turns: Turn[] = [];
    private readonly aggregatedBets: AggregatedBet[] = [];

    constructor(round: TexasHoldemRound, turns: Turn[] = []) {
        // Initialize the bet manager
        this.addTurns(turns);
        this.turns.push(...turns);
    }

    add(action: Turn): void {
        // Implementation for adding an action to the bet manager
        if (action.playerId && action.amount) {
            if (action.amount === undefined || action.action === NonPlayerActionType.JOIN) {
                return;
            }

            const currentBet = this.bets.get(action.playerId) || 0n;
            this.bets.set(action.playerId, currentBet + action.amount);

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

    currentBet(): bigint {
        if (this.aggregatedBets.length === 0) {
            return 0n;
        }
        // Return the last aggregated bet amount
        return this.aggregatedBets[this.aggregatedBets.length - 1].amount || 0n;
    }

    lastRaise(): bigint {
        const currentBet = this.currentBet();
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
     * @param start - The index to start searching from (default is the end of the turns array)
     * @returns The playerId of the last aggressor or null if no aggressor found
     */
    getLastAggressor(start: number = this.turns.length): bigint {
        const sortedTurns = this.turns.sort((a, b) => a.index - b.index);

        // Find the last action that was a bet or raise
        for (let i = start - 1; i >= 0; i--) {
            const turn = sortedTurns[i];
            if (turn.action === PlayerActionType.BET || turn.action === PlayerActionType.RAISE) {
                return turn.amount || 0n;
            }
        }

        return 0n;
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


class RaiseAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.RAISE;
    }

    /**
     * Verify if a player can raise and determine the valid raise range
     *
     * For a raise to be valid:
     * 1. Player must be active and it must be their turn (checked in base verify)
     * 2. Game must not be in the ANTE or SHOWDOWN round
     * 3. Player cannot have the largest bet (can't raise yourself)
     * 4. Must raise by at least the big blind amount above the largest bet
     *
     * @param player The player attempting to raise
     * @returns Range object with minimum and maximum raise amounts
     * @throws Error if raising conditions are not met
     */
    verify(player: Player): Range {
        // 1. Perform basic validation (player active, player's turn, etc.)
        super.verify(player);

        // 2. Cannot raise in the ANTE round
        const currentRound = this.game.currentRound;
        if (currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot raise in the ante round. Only small and big blinds are allowed.");
        }

        if (currentRound === TexasHoldemRound.SHOWDOWN) {
            throw new Error("Cannot raise in the showdown round.");
        }

        // 3. Find who has the largest bet for this round
        const includeBlinds = currentRound === TexasHoldemRound.PREFLOP;

        // let largestBet = 0n;
        // let largestBetPlayer = "";

        // const activePlayers = this.game.findActivePlayers();
        // for (const activePlayer of activePlayers) {
        //     const playerBet = this.game.getPlayerTotalBets(activePlayer.address, currentRound, includeBlinds);
        //     if (playerBet > largestBet) {
        //         largestBet = playerBet;
        //         largestBetPlayer = activePlayer.address;
        //     }
        // }
        
        const actions = this.game.getActionsForRound(currentRound);
        let newActions = [...actions];
        if (includeBlinds) {
            const anteActions = this.game.getActionsForRound(TexasHoldemRound.ANTE);
            newActions.push(...anteActions);
        }

        if (newActions.length < 2) {
            throw new Error("Cannot raise - no bets have been placed yet.");
        }

        const betManager = new BetManager(this.game.currentRound, newActions);
        const currentBet2 = betManager.currentBet();

        if (currentBet2 === 0n) {
            throw new Error("Cannot raise - no bets have been placed yet.");
        }


        // let currentBet = 0n;
        // let lastAggressorActionIndex = newActions.length - 1;
        // newActions = newActions.sort((a, b) => {
        //     return a.index - b.index; // Sort by action index to maintain order
        // });

        // for (let i = newActions.length - 1; i >= 0; i--) {
        //     const action = newActions[i];
        //     if (action.action === PlayerActionType.BET || action.action === PlayerActionType.RAISE || action.action === PlayerActionType.SMALL_BLIND || action.action === PlayerActionType.BIG_BLIND) {
        //         currentBet = action.amount || 0n;
        //         lastAggressorActionIndex = i;
        //         break;
        //     }
        // }

        // if (currentBet === 0n) {
        //     throw new Error("Cannot raise - no bets have been placed yet.");
        // }

        // let previousBet = 0n;
        // for (let i = lastAggressorActionIndex - 1; i >= 0; i--) {
        //     const action = newActions[i];
        //     if (action.action === PlayerActionType.BET || action.action === PlayerActionType.RAISE || action.action === PlayerActionType.SMALL_BLIND || action.action === PlayerActionType.BIG_BLIND) {
        //         previousBet = action.amount || 0n;
        //         break;
        //     }
        // }

        // const lastRaiseAmount = currentBet - previousBet;
        // const minRaiseTo = currentBet + lastRaiseAmount;

        const lastAggressor = betManager.getLastAggressor();
        const minRaiseTo2 = currentBet2 + lastAggressor;

        if (player.chips < minRaiseTo2) {
            // Player can only go all-in
            return {
                minAmount: player.chips, // Total amount if going all-in
                maxAmount: player.chips
            };
        }

        return {
            minAmount: minRaiseTo2, // deltaToCall > this.game.bigBlind ? deltaToCall : this.game.bigBlind, // Minimum raise amount
            maxAmount: player.chips // Total possible if going all-in
        };
    }
}

export default RaiseAction;