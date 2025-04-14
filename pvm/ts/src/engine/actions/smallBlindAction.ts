import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class SmallBlindAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.SMALL_BLIND }

    verify(_player: Player): Range {
        super.verify(_player);

        // Can only bet the small blind amount when preflop or ante
        if (this.game.currentRound !== TexasHoldemRound.PREFLOP && this.game.currentRound !== TexasHoldemRound.ANTE) {
            throw new Error("Can only post small blind during ante or preflop rounds.");
        }

        const seat = this.game.getPlayerSeatNumber(_player.address);
        if (seat !== this.game.smallBlindPosition) {
            throw new Error("Only the small blind player can bet the small blind amount.");
        }

        // Check if small blind has already been posted in ANTE or PREFLOP round
        const anteActions = this.game.getActionsForRound(TexasHoldemRound.ANTE);
        const preFlopActions = this.game.getActionsForRound(TexasHoldemRound.PREFLOP);
        
        const hasPostedInAnte = anteActions.some(a => a.action === PlayerActionType.SMALL_BLIND && a.playerId === _player.address);
        const hasPostedInPreflop = preFlopActions.some(a => a.action === PlayerActionType.SMALL_BLIND && a.playerId === _player.address);
        
        if (hasPostedInAnte || hasPostedInPreflop) {
            throw new Error("Small blind has already been posted.");
        }

        return { minAmount: this.game.smallBlind, maxAmount: this.game.smallBlind };
    }

    getDeductAmount(): bigint {
        return this.game.smallBlind;
    }
}

export default SmallBlindAction;