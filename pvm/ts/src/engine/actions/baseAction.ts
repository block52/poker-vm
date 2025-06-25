import { NonPlayerActionType, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import { IUpdate, Range } from "../types";
import { BetManager } from "../managers/betManager";

abstract class BaseAction {
    constructor(protected game: TexasHoldemGame, protected update: IUpdate) {}

    abstract get type(): PlayerActionType | NonPlayerActionType;

    verify(player: Player): Range | undefined {
        // To do: Move to deal or fold action class
        if (this.type !== NonPlayerActionType.DEAL) {
            const nextPlayerAddress = this.game.getNextPlayerToAct();
            if (nextPlayerAddress?.address !== player.address) throw new Error("Must be currently active player.");
        }

        // 3. Player status check: Player must be active (not folded/all-in)
        const playerStatus = this.game.getPlayerStatus(player.address);
        if (playerStatus !== PlayerStatus.ACTIVE && playerStatus !== PlayerStatus.NOT_ACTED) throw new Error(`Only active player can ${this.type}.`);

        return undefined;
    }

    execute(player: Player, index: number, amount: bigint): void {
        if (player.chips < amount) throw new Error(`Player has insufficient chips to ${this.type}.`);
        player.chips -= amount;

        const round = this.game.currentRound;
        this.game.addAction(
            { playerId: player.address, action: !player.chips && amount ? PlayerActionType.ALL_IN : this.type, amount: amount, index: index },
            round
        );
    }

    protected verifyPlayerIsActive(player: Player): void {
        const playerStatus = this.game.getPlayerStatus(player.address);
        if (playerStatus !== PlayerStatus.ACTIVE && playerStatus !== PlayerStatus.NOT_ACTED) throw new Error(`Only active player can ${this.type}.`);
    }

    protected getLargestBet(includeBlinds: boolean = false): bigint {
        const actions = this.game.getActionsForRound(this.game.currentRound);
        let newActions = [...actions];
        if (includeBlinds) {
            const anteActions = this.game.getActionsForRound(TexasHoldemRound.ANTE);
            newActions.push(...anteActions);
        }
        const betManager = new BetManager(newActions);
        return betManager.getLargestBet();
    }

    // Get the largest bet in the current round
    protected getLargestBet_old(includeBlinds: boolean = false): bigint {
        let largestBettor: string = "";
        let _amount = 0n;
        const roundBets = this.game.getBets(this.game.currentRound);

        for (const [playerId, amount] of roundBets.entries()) {
            // playerId is the key, amount is the value
            if (amount > _amount) {
                _amount = amount;
                largestBettor = playerId;
            }
        }

        if (includeBlinds) {
            if (_amount === 0n) {
                return this.game.bigBlind; // If no bets, return big blind as the minimum bet
            }

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
}

export default BaseAction;
