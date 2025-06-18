import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range, Turn } from "../types";

class MuckAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.MUCK }

    verify(player: Player): Range {
        // Basic validation
        super.verify(player);

        if (this.game.currentRound !== TexasHoldemRound.SHOWDOWN) {
            throw new Error("Game is not in showdown round.");
        }

        if (this.game.getActionsForRound(TexasHoldemRound.SHOWDOWN).length === 0) {
            throw new Error("A player must show first.");
        }

        if (this.game.winners?.has(player.address)) {
            throw new Error("Cannot muck winning hand.");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }

    // Override execute to set player's status to FOLDED
    execute(player: Player, index: number, amount?: bigint): void {
        // First verify the action
        this.verify(player);
        
        // Set player status to FOLDED
        player.updateStatus(PlayerStatus.FOLDED);
        
        // Add the action to the game
        this.game.addAction({ playerId: player.address, action: PlayerActionType.MUCK, index: index });
    }
}

export default MuckAction;