import { NonPlayerActionType, PlayerActionType, TexasHoldemRound, PlayerStatus } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import { IUpdate, Range } from "../types";

abstract class BaseAction {
    constructor(protected game: TexasHoldemGame, protected update: IUpdate) {}

    abstract get type(): PlayerActionType | NonPlayerActionType;

    verify(player: Player): Range | undefined {
        // 1. Game state check: Hand must be active (not in showdown)
        if (this.game.currentRound === TexasHoldemRound.SHOWDOWN) 
            throw new Error("Hand has ended.");

        // 2. Turn order check: Must be player's turn (except for fold which can be done anytime)
        if (this.type !== PlayerActionType.FOLD) {
            const nextPlayerAddress = this.game.getNextPlayerToAct()?.address;
            if (nextPlayerAddress !== player.address) 
                throw new Error("Must be currently active player.");
        }

        // 3. Player status check: Player must be active (not folded/all-in)
        const playerStatus = this.game.getPlayerStatus(player.address);
        if (playerStatus !== PlayerStatus.ACTIVE && playerStatus !== PlayerStatus.NOT_ACTED)
            throw new Error(`Only active player can ${this.type}.`);

        return undefined;
    }

    execute(player: Player, index: number, amount: bigint): void {
        // const range = this.verify(player);

        // if (range) {
        //     if (!amount) throw new Error(`Amount needs to be specified for ${this.type}`);
        //     if (amount < range.minAmount) throw new Error("Amount is less than minimum allowed.");
        //     if (amount > range.maxAmount) throw new Error("Amount is greater than maximum allowed.");
        // }

        // in some cases, the amount field is not used so need to calculate to match maximum bet; in the case of a raise,
        // the amount only specifies that over the existing maximum which the player may not yet have covered
        const deductAmount = this.getDeductAmount(player, amount);
        if (deductAmount) {
            if (player.chips < deductAmount) throw new Error(`Player has insufficient chips to ${this.type}.`);

            player.chips -= deductAmount;
        }

        amount = deductAmount;

        const round = this.game.currentRound;
        this.game.addAction(
            { playerId: player.address, action: !player.chips && amount ? PlayerActionType.ALL_IN : this.type, amount: amount, index: index },
            round
        );
    }

    protected getDeductAmount(_player: Player, amount?: bigint): bigint {
        return amount ? amount : 0n;
    }

    // Get the largest bet in the current round
    protected getLargestBet(): bigint {
        let amount = 0n;
        const roundBets = this.game.getBets(this.game.currentRound);

        roundBets.forEach(bet => {
            if (bet > amount) {
                amount = bet;
            }
        });

        return amount;
    }

    protected getSumBets(playerId: string): bigint {
        let amount = 0n;
        const roundBets = this.game.getBets(this.game.currentRound);

        // If the player made a bet in this round, add it to the total
        if (roundBets.has(playerId)) {
            amount += roundBets.get(playerId) || 0n;
        }

        return amount;
    }
}

export default BaseAction;