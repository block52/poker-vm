import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class CheckAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.CHECK }

    verify(player: Player): Range | undefined {
        // Can never check if you havent matched the largest bet of the round
        const largestBet = this.getLargestBet();
        // const playerBet = player.

        super.verify(player);
        return undefined
    }

    // Get the largest bet in the current round
    private getLargestBet(): bigint {
        let amount = 0n;
        const roundBets = this.game.getBets(this.game.currentRound);

        roundBets.forEach((bet) => {
            if (bet > amount) {
                amount = bet;
            }
        });

        return amount;
    }
}

export default CheckAction;