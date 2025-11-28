import { KEYS, NonPlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, IUpdate, Range } from "../types";
import TexasHoldemGame from "../texasHoldem";

class NewHandAction extends BaseAction implements IAction {
    get type(): NonPlayerActionType { return NonPlayerActionType.NEW_HAND }

    constructor(protected game: TexasHoldemGame, protected update: IUpdate, private readonly data: string) {
        super(game, update);
        this.data = data;
    }

    verify(_player: Player): Range {
        if (this.game.currentRound !== TexasHoldemRound.END) {
            throw new Error("Hand has not finished.");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }

    // Create new hand
    // NOTE: Deck shuffling is now handled by Cosmos blockchain
    // This action expects a pre-shuffled deck string from Cosmos
    execute(_player: Player, _index: number): void {
        // First verify the action
        this.verify(_player);

        if (!this.data || this.data.trim() === "") {
            throw new Error("Deck data is required to create a new hand.");
        }

        const urlSearchParams = new URLSearchParams(this.data);

        // Check if we have a pre-shuffled deck from Cosmos
        if (urlSearchParams.has("deck")) {
            const deckStr = urlSearchParams.get("deck") || "";
            console.log(`New hand action with pre-shuffled deck from Cosmos`);
            this.game.reInit(deckStr);
        }
        // Legacy support: Generate deck from seed (for backwards compatibility during migration)
        else if (urlSearchParams.has(KEYS.SEED)) {
            console.warn("DEPRECATED: Using seed-based shuffling. Cosmos should provide pre-shuffled deck.");
            const deckStr = urlSearchParams.get(KEYS.SEED) || "";
            // Assume the seed parameter now contains the full shuffled deck string
            this.game.reInit(deckStr);
        }
        else {
            throw new Error("Either 'deck' or 'seed' parameter is required in the data.");
        }
    }
}

export default NewHandAction;