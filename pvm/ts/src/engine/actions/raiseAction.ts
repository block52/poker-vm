import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

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
        if (includeBlinds) {
            const anteActions = this.game.getActionsForRound(TexasHoldemRound.ANTE);
            actions.push(...anteActions);
        }

        if (actions.length < 2) {
            throw new Error("Cannot raise - no bets have been placed yet.");
        }

        let currentBet = 0n;
        let lastAggressorActionIndex = actions.length - 1;
        for (let i = actions.length - 1; i >= 0; i--) {
            const action = actions[i];
            if (action.action === PlayerActionType.BET || action.action === PlayerActionType.RAISE || action.action === PlayerActionType.SMALL_BLIND || action.action === PlayerActionType.BIG_BLIND) {
                currentBet = action.amount || 0n;
                lastAggressorActionIndex = i;
                break;
            }
        }

        if (currentBet === 0n) {
            throw new Error("Cannot raise - no bets have been placed yet.");
        }

        let previousBet = 0n;
        for (let i = lastAggressorActionIndex - 1; i >= 0; i--) {
            const action = actions[i];
            if (action.action === PlayerActionType.BET || action.action === PlayerActionType.RAISE || action.action === PlayerActionType.SMALL_BLIND || action.action === PlayerActionType.BIG_BLIND) {
                previousBet = action.amount || 0n;
                break;
            }
        }

        const lastRaiseAmount = currentBet - previousBet;
        const minRaiseTo = currentBet + lastRaiseAmount;

        if (player.chips < minRaiseTo) {
            // Player can only go all-in
            return {
                minAmount: player.chips, // Total amount if going all-in
                maxAmount: player.chips
            };
        }

        return {
            minAmount: minRaiseTo, // deltaToCall > this.game.bigBlind ? deltaToCall : this.game.bigBlind, // Minimum raise amount
            maxAmount: player.chips // Total possible if going all-in
        };


        // // 4. Cannot raise if I have the largest bet (can't raise myself)
        // if (largestBetPlayer === player.address) {
        //     // Special case for PREFLOP round, and the player is the big blind
        //     if (currentRound === TexasHoldemRound.PREFLOP && this.game.getPlayerSeatNumber(player.address) === this.game.bigBlindPosition) {
        //         return {
        //             minAmount: this.game.bigBlind, // Must raise by at least big blind
        //             maxAmount: player.chips // Can go all-in
        //         };
        //     }

        //     throw new Error("Cannot raise - you already have the largest bet.");
        // }

        // // 5. Calculate minimum raise amount
        // const playerBets = this.game.getPlayerTotalBets(player.address, currentRound, includeBlinds);

        // if (largestBet === 0n) {
        //     throw new Error("Cannot raise - no bets have been placed yet.");
        // }

        // let minimumRaiseAmount = largestBet > 0n ? largestBet + this.game.bigBlind : this.game.bigBlind;
        // const deltaToCall = minimumRaiseAmount - playerBets;

        // Find the last raise size in this round
        // const lastRaiseSize = this.getLastRaiseSize(currentRound, includeBlinds); // two tokens
        // let minimumRaiseAmount = lastRaiseSize > 0n ? lastRaiseSize + this.game.bigBlind : this.game.bigBlind;  // four tokens

        // const deltaToCall = minimumRaiseAmount - playerBets;

        // if (player.chips < minimumRaiseAmount) {
        //     // Player can only go all-in
        //     return {
        //         minAmount: playerBets + player.chips, // Total amount if going all-in
        //         maxAmount: playerBets + player.chips
        //     };
        // }

        // return {
        //     minAmount: deltaToCall > this.game.bigBlind ? deltaToCall : this.game.bigBlind, // Minimum raise amount
        //     maxAmount: player.chips // Total possible if going all-in
        // };
    }

    // private getMinRaiseTo(lastBet: bigint, previousBet: bigint): bigint {
    //     const raiseAmount = lastBet - previousBet;
    //     return lastBet + raiseAmount;
    // }

    // private getLastRaiseSize(round: TexasHoldemRound, includeBlinds: boolean): bigint {
    //     const actions = this.game.getActionsForRound(round);
    //     const betActions = actions.filter(a =>
    //         a.action === PlayerActionType.BET ||
    //         a.action === PlayerActionType.RAISE
    //     );

    //     if (includeBlinds) {
    //         const smallBlindAction = actions.find(a => a.action === PlayerActionType.SMALL_BLIND);
    //         const bigBlindAction = actions.find(a => a.action === PlayerActionType.BIG_BLIND);
    //         if (smallBlindAction) betActions.push(smallBlindAction);
    //         if (bigBlindAction) betActions.push(bigBlindAction);
    //     }

    //     if (betActions.length === 0) return 0n;
    //     if (betActions.length === 1) return betActions[0].amount || 0n;

    //     // Return the difference between last two betting actions
    //     const lastAction = betActions[betActions.length - 1];
    //     const prevAction = betActions[betActions.length - 2];

    //     return (lastAction.amount || 0n) - (prevAction.amount || 0n);
    // }
}

export default RaiseAction;