import { NonPlayerActionType, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import { IUpdate, Range } from "../types";
import { BetManager } from "../managers/betManager";

abstract class BaseAction {
    private readonly zeroChipsAllowed = [NonPlayerActionType.SIT_OUT, PlayerActionType.FOLD, NonPlayerActionType.DEAL, PlayerActionType.ALL_IN, PlayerActionType.SHOW, PlayerActionType.MUCK];
    constructor(protected game: TexasHoldemGame, protected update: IUpdate) { }

    abstract get type(): PlayerActionType | NonPlayerActionType;

    verify(player: Player): Range | undefined {
        if (this.type !== NonPlayerActionType.DEAL) {
            const nextPlayerAddress = this.game.getNextPlayerToAct();
            if (nextPlayerAddress?.address !== player.address) throw new Error("Must be currently active player.");
        }

        if (player.chips <= 0n && !this.zeroChipsAllowed.includes(this.type)) {
            throw new Error("Player has no chips left and cannot perform this action.");
        }

        // 3. Player status check: Player must be active (not folded/all-in)
        const playerStatus = this.game.getPlayerStatus(player.address);
        if (playerStatus !== PlayerStatus.ACTIVE) throw new Error(`Only active player can ${this.type}.`);

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

    protected setAllInWhenBalanceIsZero(player: Player): void {
        if (player.chips === 0n) {
            player.updateStatus(PlayerStatus.ALL_IN);
        }
    }

    protected verifyPlayerIsActive(player: Player): void {
        const playerStatus = this.game.getPlayerStatus(player.address);
        if (playerStatus !== PlayerStatus.ACTIVE) throw new Error(`Only active player can ${this.type}.`);
    }

    protected getBetManager(includeBlinds: boolean = false): BetManager {
        const actions = this.game.getActionsForRound(this.game.currentRound);
        let newActions = [...actions];
        if (includeBlinds) {
            const anteActions = this.game.getActionsForRound(TexasHoldemRound.ANTE);
            newActions.push(...anteActions);
        }
        return new BetManager(newActions, { bigBlind: this.game.bigBlind });
    }

    protected getLargestBet(includeBlinds: boolean = false): bigint {
        const betManager = this.getBetManager(includeBlinds);
        return betManager.getLargestBet();
    }

    // Round validation utilities
    protected validateNotInAnteRound(): void {
        if (this.game.currentRound === TexasHoldemRound.ANTE) {
            throw new Error(`Cannot ${this.type.toLowerCase()} in the ante round.`);
        }
    }

    protected validateNotInShowdownRound(): void {
        if (this.game.currentRound === TexasHoldemRound.SHOWDOWN) {
            throw new Error(`Cannot ${this.type.toLowerCase()} in the showdown round.`);
        }
    }

    protected validateNotInEndRound(): void {
        if (this.game.currentRound === TexasHoldemRound.END) {
            throw new Error(`Cannot ${this.type.toLowerCase()} in the end round.`);
        }
    }

    protected validateInSpecificRound(requiredRound: TexasHoldemRound): void {
        if (this.game.currentRound !== requiredRound) {
            throw new Error(`${this.type} can only be performed during ${requiredRound} round.`);
        }
    }

    protected validateNotInSpecificRound(forbiddenRound: TexasHoldemRound): void {
        if (this.game.currentRound === forbiddenRound) {
            throw new Error(`${this.type} action is not allowed during ${forbiddenRound} round.`);
        }
    }
}

export default BaseAction;
