import { KEYS, NonPlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, IUpdate, Range, Turn } from "../types";
import TexasHoldemGame from "../texasHoldem";
import { Deck } from "../../models";

class NewHandAction extends BaseAction implements IAction {
    get type(): NonPlayerActionType { return NonPlayerActionType.NEW_HAND }

    constructor(protected game: TexasHoldemGame, protected update: IUpdate, private readonly data: string) {
        super(game, update);
        this.data = data;
    }

    verify(player: Player): Range {
        if (this.game.currentRound !== TexasHoldemRound.END) {
            throw new Error("Hand has not finished.");
        }

        return { minAmount: 0n, maxAmount: 0n };
    }

    // Create new hand
    execute(player: Player, index: number): void {
        // First verify the action
        this.verify(player);
        const deck = new Deck();
        if (!this.data || this.data.trim() === "") {
            throw new Error("Seed data is required to create a new hand.");
        }

        const urlSearchParams = new URLSearchParams(this.data);
        if (!urlSearchParams.has(KEYS.SEED)) {
            throw new Error("Seed parameter is required in the data.");
        }

        const seedStr = urlSearchParams.get(KEYS.SEED) || "";
        const _seed: string[] = seedStr.split("-");

        console.log(`New hand action with seed: ${_seed}`);
        
        const seed: number[] = _seed.map(num => {
            const parsedNum = parseInt(num, 10);
            return isNaN(parsedNum) ? 0 : parsedNum;
        });

        if (seed.length !== 52) {
            throw new Error("Seed must contain exactly 52 numbers separated by dashes");
        }

        deck.shuffle(seed);
        this.game.reInit(deck.toString());
    }
}

export default NewHandAction;