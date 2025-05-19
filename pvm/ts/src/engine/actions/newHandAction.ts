import { NonPlayerActionType, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, IUpdate, Range, Turn } from "../types";
import TexasHoldemGame from "../texasHoldem";

class NewHandAction extends BaseAction implements IAction {
    get type(): NonPlayerActionType { return NonPlayerActionType.NEW_HAND }

    constructor(protected game: TexasHoldemGame, protected update: IUpdate, private readonly data: string) {
        super(game, update);
        this.data = data;
    }

    verify(player: Player): Range {
        if (this.game.currentRound !== TexasHoldemRound.END) {
            throw new Error("Hand has not finished.");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }

    // Create new hand
    execute(player: Player, index: number): void {
        // First verify the action
        this.verify(player);
        this.game.reInit(this.data);
    }
}

export default NewHandAction;