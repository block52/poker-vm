import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class DealAction extends BaseAction implements IAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.DEAL;
    }

    verify(player: Player): Range {

        // Check minimum players: Use findLivePlayers() to include both ACTIVE and ALL_IN players
        // This is important for cases where a player goes all-in while posting blinds
        if (this.game.findLivePlayers().length < this.game.minPlayers) {
            throw new Error("Not enough active players");
        }

        // Any one can deal
        super.verify(player);

        // 6. Card state check: Make sure cards haven't been dealt already
        const anyPlayerHasCards = Array.from(this.game.players.values()).some(p => p !== null && p.holeCards !== undefined);
        if (anyPlayerHasCards) {
            throw new Error("Cards have already been dealt for this hand.");
        }

        // 1. Round state check: Can only deal when in ANTE round
        this.validateInSpecificRound(TexasHoldemRound.ANTE);

        // 2. Player count check: Need at least minimum players
        const count = this.game.getPlayerCount();
        if (count < 2) { // Using hardcoded minimum player count since gameOptions is private
            throw new Error("Not enough players to deal.");
        }

        // 3. Blind posting check: Both blinds must be posted
        const anteActions = this.game.getActionsForRound(TexasHoldemRound.ANTE);

        // Check if small blind has been posted
        const smallBlindAction = anteActions.some(a => a.action === PlayerActionType.SMALL_BLIND);
        if (!smallBlindAction) {
            throw new Error("Small blind must be posted before dealing.");
        }

        // Check if big blind has been posted
        const bigBlindAction = anteActions.some(a => a.action === PlayerActionType.BIG_BLIND);
        if (!bigBlindAction) {
            throw new Error("Big blind must be posted before dealing.");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }

    execute(player: Player, index: number): void {
        // Verify the action (this will throw if invalid)
        this.verify(player);

        // Perform the deal
        this.game.deal();

        // Record the deal action in the ANTE round
        this.game.addNonPlayerAction({
            playerId: player.address,
            action: NonPlayerActionType.DEAL,
            index: index
        });
    }
}

export default DealAction;
