import { NonPlayerActionType, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import { IUpdate, Range } from "../types";

abstract class BaseAction {
    constructor(protected game: TexasHoldemGame, protected update: IUpdate) {}

    abstract get type(): PlayerActionType | NonPlayerActionType;

    verify(player: Player): Range | undefined {
        // To do: Move to deal or fold action class
        if (this.type !== NonPlayerActionType.DEAL) {
            const nextPlayerAddress = this.game.getNextPlayerToAct();
            if (nextPlayerAddress?.address !== player.address) 
                throw new Error("Must be currently active player.");
        }

        // 3. Player status check: Player must be active (not folded/all-in)
        const playerStatus = this.game.getPlayerStatus(player.address);
        if (playerStatus !== PlayerStatus.ACTIVE && playerStatus !== PlayerStatus.NOT_ACTED)
            throw new Error(`Only active player can ${this.type}.`);

        return undefined;
    }

    protected verifyPlayerIsActive(player: Player): void {
        const playerStatus = this.game.getPlayerStatus(player.address);
        if (playerStatus !== PlayerStatus.ACTIVE && playerStatus !== PlayerStatus.NOT_ACTED)
            throw new Error(`Only active player can ${this.type}.`);
    }

    execute(player: Player, index: number, amount: bigint): void {
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
    protected getLargestBet(includeBlinds: boolean = false): bigint {
        let largestBettor: string = "";
        let _amount = 0n;
        const roundBets = this.game.getBets(this.game.currentRound);

        // roundBets.forEach(bet => {
        //     if (bet > amount) {
        //         amount = bet;
        //     }
        // });

        for (const [playerId, amount] of roundBets.entries()) {
            console.log(`Player: ${playerId}, Bet: ${amount}`);
            // playerId is the key, amount is the value
            if (amount > _amount) {
                _amount = amount;
                largestBettor = playerId;
            }
        }

        if (includeBlinds && this.game.currentRound === TexasHoldemRound.PREFLOP) {

            const smallBlindPosition = this.game.smallBlindPosition;
            const smallBlindPlayer = this.game.getPlayerAtSeat(smallBlindPosition);

            // if the bet map is the small blind, we need to add the small blind amount
            if (largestBettor === smallBlindPlayer?.address) {
                _amount += this.game.smallBlind;
            }

            const bigBlindPosition = this.game.bigBlindPosition;
            const bigBlindPlayer = this.game.getPlayerAtSeat(bigBlindPosition);

            // if the bet map is the big blind, we need to add the big blind amount
            if (largestBettor === bigBlindPlayer?.address) {
                _amount += this.game.bigBlind;
            }
        }

        return _amount;
    }

    protected getSumBets(playerId: string, includeBlinds: boolean = false): bigint {
        let amount = 0n;
        const roundBets = this.game.getBets(this.game.currentRound);

        // If the player made a bet in this round, add it to the total
        if (roundBets.has(playerId)) {
            amount += roundBets.get(playerId) || 0n;
        }

        if (includeBlinds && this.game.currentRound === TexasHoldemRound.PREFLOP) {
            const anteBets = this.game.getBets(TexasHoldemRound.ANTE);

            // If the player made an ante bet, add it to the total
            if (anteBets.has(playerId)) {
                amount += anteBets.get(playerId) || 0n;
            }
        }

        return amount;
    }
}

export default BaseAction;