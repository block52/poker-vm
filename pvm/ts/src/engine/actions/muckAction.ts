import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class MuckAction extends BaseAction implements IAction {
    get type(): PlayerActionType { return PlayerActionType.MUCK }

    verify(player: Player): Range {
        // Basic validation
        super.verify(player);

        this.validateInSpecificRound(TexasHoldemRound.SHOWDOWN);

        if (this.game.getActionsForRound(TexasHoldemRound.SHOWDOWN).length === 0) {
            throw new Error("A player must show first.");
        }

        if (player.holeCards) {
            const cards: string[] = player.holeCards.map(card => card.mnemonic);
            if (this.game.findWinners(cards)) {
                throw new Error("Cannot muck winning hand.");
            }
        }

        return { minAmount: 0n, maxAmount: 0n };
    }

    // Override execute to set player's status to FOLDED
    execute(player: Player, index: number, _amount?: bigint): void {
        // First verify the action
        this.verify(player);

        // Set player status to FOLDED
        player.updateStatus(PlayerStatus.FOLDED);

        // Add the action to the game
        this.game.addAction({ playerId: player.address, action: PlayerActionType.MUCK, index: index });
    }
}

export default MuckAction;