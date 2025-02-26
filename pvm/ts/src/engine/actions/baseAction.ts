import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/game";
import TexasHoldemGame from "../texasHoldem";
import { IUpdate, Range } from "../types";

abstract class BaseAction {
    constructor(protected game: TexasHoldemGame, protected update: IUpdate) { }

    abstract get type(): PlayerActionType;

    verify(player: Player): Range | undefined {
        if (this.game.currentRound === TexasHoldemRound.SHOWDOWN)
            throw new Error("Hand has ended.");

        const nextPlayerAddress = this.game.getNextPlayerToAct()?.address;
        if (nextPlayerAddress !== player.address)
            throw new Error("Must be currently active player.");

        if (this.game.getPlayerStatus(player.address) !== PlayerStatus.ACTIVE)
            throw new Error(`Only active player can ${this.type}.`);

        return undefined;
    }

    execute(player: Player, amount?: bigint): void {
        const range = this.verify(player);

        if (range) {
            if (!amount)
                throw new Error(`Amount needs to be specified for ${this.type}`);
            if (amount < range.minAmount)
                throw new Error("Amount is less than minimum allowed.");
            if (amount > range.maxAmount)
                throw new Error("Amount is greater than maximum allowed.");
        } else if (amount) {
            throw new Error(`Amount should not be specified for ${this.type}`);
        }

        // in some cases, the amount field is not used so need to calculate to match maximum bet; in the case of a raise,
        // the amount only specifies that over the existing maximum which the player may not yet have covered
        const deductAmount = this.getDeductAmount(player, amount);
        if (deductAmount) {
            if (player.chips < deductAmount)
                throw new Error(`Player has insufficient chips to ${this.type}.`);

            player.chips -= deductAmount;
        }

        this.update.addAction({ playerId: player.id, action: !player.chips && deductAmount ? PlayerActionType.ALL_IN : this.type, amount: deductAmount });
    }

    protected getDeductAmount(_player: Player, amount?: bigint): bigint {
        return amount ? amount : 0n;
    }
}

export default BaseAction;