import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";
import { BetManager } from "../managers/betManager";

class BetAction extends BaseAction implements IAction {
    get type(): PlayerActionType {
        return PlayerActionType.BET;
    }

    verify(player: Player): Range {
        // Check base conditions (hand active, player's turn, player active)
        super.verify(player);
        
        // 1. Round state check: Cannot bet during ANTE round
        const currentRound = this.game.currentRound;
        if (currentRound === TexasHoldemRound.ANTE) {
            throw new Error("Cannot bet in the ante round.");
        }

        if (currentRound === TexasHoldemRound.SHOWDOWN) {
            throw new Error("Cannot bet in the showdown round.");
        }

        // 2. Bet matching check: Player must match existing bets before betting
        const includeBlinds = currentRound === TexasHoldemRound.PREFLOP;

        const actions = this.game.getActionsForRound(currentRound);
        let newActions = [...actions];
        if (includeBlinds) {
            const anteActions = this.game.getActionsForRound(TexasHoldemRound.ANTE);
            newActions.push(...anteActions);
        }

        const betManager = new BetManager(newActions);
        // const playersBet: bigint = betManager.getTotalBetsForPlayer(player.address);
        const currentBet: bigint = betManager.current();

        // if (playersBet === currentBet) {
        //     throw new Error("Cannot bet - player must call or raise.");
        // }

        if (currentBet > 0n) {
            throw new Error("Cannot bet - player must call or raise.");
        }

        return { minAmount: this.game.bigBlind, maxAmount: player.chips }
    }

    execute(player: Player, index: number, amount: bigint): void {
        // Verify the player can perform the call action
        if (amount <= 0n) {
            throw new Error("Bet amount must be greater than zero.");
        }

        super.execute(player, index, amount);
    }
}

export default BetAction;