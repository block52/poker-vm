import { NonPlayerActionType, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import { IUpdate, Range } from "../types";
import { BetManager } from "../managers/betManager";

abstract class BaseAction {
    private readonly zeroChipsAllowed = [NonPlayerActionType.SIT_OUT, PlayerActionType.FOLD, NonPlayerActionType.DEAL, PlayerActionType.ALL_IN, PlayerActionType.SHOW, PlayerActionType.MUCK];
    // Actions that are allowed for ALL_IN players (in addition to ACTIVE players)
    private readonly allInAllowed = [PlayerActionType.SHOW, PlayerActionType.MUCK];
    // Actions that skip the turn order check - SHOW/MUCK can happen in any order during showdown
    private readonly skipTurnOrderCheck: PlayerActionType[] = [PlayerActionType.SHOW, PlayerActionType.MUCK];
    constructor(protected game: TexasHoldemGame, protected update: IUpdate) { }

    abstract get type(): PlayerActionType | NonPlayerActionType;

    verify(player: Player): Range | undefined {
        // Check if this action type should skip the "next to act" validation
        const skipNextToActCheck = this.skipTurnOrderCheck.includes(this.type as PlayerActionType);

        if (this.type !== NonPlayerActionType.DEAL && !skipNextToActCheck) {
            // Use showdown-specific turn order for SHOW/MUCK during SHOWDOWN
            const isShowdownAction = [PlayerActionType.SHOW, PlayerActionType.MUCK].includes(this.type as PlayerActionType);
            const isShowdownRound = this.game.currentRound === TexasHoldemRound.SHOWDOWN;

            if (isShowdownAction && isShowdownRound) {
                const nextToShow = this.game.getNextPlayerToShow();
                // If nextToShow is undefined, any active player can show/muck
                if (nextToShow && nextToShow.address.toLowerCase() !== player.address.toLowerCase()) {
                    throw new Error("Must be currently active player.");
                }
            } else {
                // Normal betting round turn order
                const nextPlayerAddress = this.game.getNextPlayerToAct();
                if (nextPlayerAddress?.address !== player.address) {
                    throw new Error("Must be currently active player.");
                }
            }
        }

        if (player.chips <= 0n && !this.zeroChipsAllowed.includes(this.type)) {
            throw new Error("Player has no chips left and cannot perform this action.");
        }

        // 3. Player status check: Player must be active (or all-in for certain actions)
        const playerStatus = this.game.getPlayerStatus(player.address);
        const allowedStatuses = [PlayerStatus.ACTIVE];
        if (this.allInAllowed.includes(this.type as PlayerActionType)) {
            allowedStatuses.push(PlayerStatus.ALL_IN);
        }
        if (!allowedStatuses.includes(playerStatus)) {
            throw new Error(`Only active player can ${this.type}.`);
        }

        return undefined;
    }

    execute(player: Player, index: number, amount: bigint): void {
        if (player.chips < amount) throw new Error(`Player has insufficient chips to ${this.type}.`);
        player.chips -= amount;

        const round = this.game.currentRound;

        // Determine the action type to record
        // Blind actions (SMALL_BLIND, BIG_BLIND) should preserve their type even when player goes all-in
        // This is important because DealAction checks for these specific action types
        const blindActions = [PlayerActionType.SMALL_BLIND, PlayerActionType.BIG_BLIND];
        const isBlindAction = blindActions.includes(this.type as PlayerActionType);
        const actionType = (!player.chips && amount && !isBlindAction) ? PlayerActionType.ALL_IN : this.type;

        this.game.addAction(
            { playerId: player.address, action: actionType, amount: amount, index: index },
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

    protected validateAmountIsPositive(amount: bigint): void {
        if (amount <= 0n) {
            // Capitalize first letter of action type for error message
            const actionType = this.type.charAt(0).toUpperCase() + this.type.slice(1).toLowerCase();
            throw new Error(`${actionType} amount must be greater than zero.`);
        }
    }
}

export default BaseAction;
