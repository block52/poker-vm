import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range, Turn } from "../types";

class ShowAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.SHOW }

    verify(player: Player): Range {
        // Basic validation
        super.verify(player);

        const livePlayers = this.game.findLivePlayers();
        if (livePlayers.length === 1) {
            if (livePlayers[0].address.toLowerCase() !== player.address.toLowerCase()) {
                return { minAmount: 0n, maxAmount: 0n };
            }
        }

        if (this.game.currentRound !== TexasHoldemRound.SHOWDOWN) {
            throw new Error("Game is not in showdown round.");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }

    // Override execute to set player's status to SHOWING
    execute(player: Player, index: number): void {
        // First verify the action
        this.verify(player);
        
        // Set player status to SHOWING
        player.updateStatus(PlayerStatus.SHOWING);
        
        // Add the action to the game
        this.game.addAction({ playerId: player.address, action: PlayerActionType.SHOW, index: index });
    }
}

export default ShowAction;