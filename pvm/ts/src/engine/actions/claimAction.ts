import { NonPlayerActionType, GameType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import BaseAction from "./baseAction";
import { Player } from "../../models/player";
import { Range } from "../types";

class ClaimAction extends BaseAction {
    get type(): NonPlayerActionType {
        // TODO: Replace with NonPlayerActionType.CLAIM after SDK update
        return "claim" as NonPlayerActionType;
    }

    verify(player: Player): Range {
        // Only available for SIT_AND_GO games
        if (this.game.type !== GameType.SIT_AND_GO) {
            throw new Error("Claim only available for SIT_AND_GO games");
        }

        // Only available in END round
        if (this.game.currentRound !== TexasHoldemRound.END) {
            throw new Error("Can only claim after game ends");
        }

        // Check if THIS specific player has winnings
        // Access results through public getter if available, or directly
        const results = (this.game as any)._results;
        const result = results.find((r: any) => r.playerId === player.address);
        if (!result || result.payout === 0n) {
            throw new Error("No winnings to claim for this player");
        }

        // Check not already claimed
        if (result.claimed) {
            throw new Error("Winnings already claimed");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }

    execute(player: Player, index: number): void {
        const results = (this.game as any)._results;
        const result = results.find((r: any) => r.playerId === player.address);
        if (!result) throw new Error("No result found for player");

        // Mark as claimed
        result.claimed = true;

        // Record the action
        this.game.addNonPlayerAction({
            playerId: player.address,
            action: "claim" as NonPlayerActionType, // TODO: Replace with NonPlayerActionType.CLAIM after SDK update
            index: index,
            amount: result.payout
        });

        console.log(`Player ${player.address} claimed ${result.payout} for place ${result.place}`);
    }
}

export default ClaimAction;