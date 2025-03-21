import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/game";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class CheckAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.CHECK }

    verify(player: Player): Range | undefined {
        const lastAction = this.game.getLastAction();
        const seat = this.game.getPlayerSeatNumber(player.address);

        if (this.game.smallBlindPosition === seat) {
            if (lastAction?.amount === this.game.smallBlind)
                throw new Error("Cannot check");
        }

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