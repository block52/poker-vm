import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class DealAction extends BaseAction implements IAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.DEAL;
    }

    verify(player: Player): Range {
        // Can only bet the big blind amount when preflop
        if (this.game.currentRound !== TexasHoldemRound.PREFLOP) {
            throw new Error("Can only deal when preflop.");
        }

        const count = this.game.getPlayerCount();
        if (count < 2) {
            throw new Error("Not enough players to deal.");
        }

        const actions = this.game.getActionsForRound(TexasHoldemRound.PREFLOP);
        if (actions.length !== 2) {
            throw new Error("Not all players have posted their blinds or action has already started.");
        }

        // Check if small blind has been posted first
        const smallBlindAction = actions.find(a => a.action === PlayerActionType.SMALL_BLIND);
        if (!smallBlindAction) {
            throw new Error("Small blind must be posted before we can deal.");
        }

        // Check if big blind has already been posted
        const bigBlindAction = actions.find(a => a.action === PlayerActionType.BIG_BLIND);
        if (!bigBlindAction) {
            throw new Error("Big blind must be posted before we can deal.");
        }

        // Verify it's the small blind player's turn to act (in 2-player games, action begins with the SB player)
        const playerSeat = this.game.getPlayerSeatNumber(player.address);
        if (playerSeat !== this.game.smallBlindPosition) {
            throw new Error("Only the player in the small blind position can deal after blinds are posted.");
        }

        // Also verify this player is the next to act
        const nextToAct = this.game.getNextPlayerToAct();
        if (!nextToAct || nextToAct.address !== player.address) {
            throw new Error("It's not your turn to act.");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }

    execute(player: Player, index: number): void {

        this.game.deal();

        // The verification should have already been done
        // The actual dealing of cards happens in the game class
        // Record the deal action
        this.update.addAction({
            playerId: player.address,
            action: NonPlayerActionType.DEAL,
            index: index
        });
    }
}

export default DealAction;
