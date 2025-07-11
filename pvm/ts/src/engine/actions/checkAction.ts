import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range, Turn } from "../types";
import { BetManager } from "../managers/betManager";

class CheckAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.CHECK;
    }

    verify(player: Player): Range {
        // Basic validation
        super.verify(player);

        const currentRound = this.game.currentRound;
        // 1. Round state check: Cannot check in the ante round
        if (currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot check in the ante round.");
        }

        if (currentRound === TexasHoldemRound.SHOWDOWN) {
            throw new Error("Cannot check in the showdown round.");
        }

        // 2. Get the bets for the current round
        const includeBlinds = currentRound === TexasHoldemRound.PREFLOP;
        const actions = this.game.getActionsForRound(currentRound);
        const newActions = [...actions];
        if (includeBlinds) {
            const anteActions = this.game.getActionsForRound(TexasHoldemRound.ANTE);
            newActions.push(...anteActions);
        }

        // if (!newActions || newActions.length === 0) {
        //     throw new Error("No previous actions to check.");
        // }

        const betManager = new BetManager(newActions);
        const currentBetAmount: bigint = betManager.current();

        if (currentBetAmount === 0n) {
            return { minAmount: 0n, maxAmount: 0n };
        }

        const playersBet: bigint = betManager.getTotalBetsForPlayer(player.address);
        if (playersBet === currentBetAmount) {
            // Player has already matched the current bet, can check
            return { minAmount: 0n, maxAmount: 0n };
        }

        throw new Error("Player must match the largest bet to check.");
    }

    verify_old(player: Player): Range {
        // Basic validation
        super.verify(player);

        const currentRound = this.game.currentRound;
        // 1. Round state check: Cannot check in the ante round
        if (currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot check in the ante round.");
        }

        if (currentRound === TexasHoldemRound.SHOWDOWN) {
            throw new Error("Cannot check in the showdown round.");
        }

        // 2. Bet matching check: Get the largest bet and player's current bet
        const includeBlinds = currentRound === TexasHoldemRound.PREFLOP;
        const largestBet = this.getLargestBet(includeBlinds);
        const playerBet = this.game.getPlayerTotalBets(player.address, currentRound, includeBlinds);

        // 2.1 If no bets have been made, player can check
        if (largestBet === 0n) {
            return { minAmount: 0n, maxAmount: 0n };
        }

        // // 2.2 If player has already matched the largest bet, they can check
        // if (playerBet === largestBet) {
        //     return { minAmount: 0n, maxAmount: 0n };
        // }
        
        // I think all of this is  unnecessary, but leaving it here for now
        // 3. Special case for preflop round
        if (currentRound === TexasHoldemRound.PREFLOP) {
            const playerSeat = this.game.getPlayerSeatNumber(player.address);
            const isSmallBlind = playerSeat === this.game.smallBlindPosition;
            const isBigBlind = playerSeat === this.game.bigBlindPosition;

            // Small blind CANNOT check in preflop (must call the difference to the big blind)
            if (isSmallBlind && playerBet < this.game.bigBlind) {
                throw new Error("Small blind must call to match the big blind.");
            }

            // Special cast for after blinds and UTG.
            const lastActions = this.game.getActionsForRound(this.game.currentRound);

            // Big blind CAN check when no one has raised above the big blind
            // In this case, the largest bet is equal to the small blind
            if (isBigBlind && largestBet === this.game.smallBlind) {
                return { minAmount: 0n, maxAmount: 0n };
            }

            // Only do bets, calls or raises
            const lastBettingActions = lastActions.filter((action: Turn) => {
                return action.action === PlayerActionType.BET || action.action === PlayerActionType.CALL || action.action === PlayerActionType.RAISE;
            });

            if (!lastBettingActions || lastBettingActions.length === 0) {
                throw new Error("No previous action to check.");
            }

            if (isBigBlind && playerBet < largestBet) {
                throw new Error("Big blind must call to match the big blind.");
            }
        }

        // 4. General case: Can only check if player has matched the largest bet
        if (playerBet < largestBet) {
            throw new Error("Player must match the largest bet to check.");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }

    execute(player: Player, index: number, amount: bigint): void {
        // Verify the player can perform the check action
        if (amount !== 0n) {
            throw new Error("Check amount must be zero.");
        }

        super.execute(player, index, amount);
    }
}

export default CheckAction;
