import { Block, Deck } from "../models";
import { DeckType } from "../models/deck";
import { ICommand } from "./interfaces";

export class ShuffleCommand implements ICommand<Deck> {
    private readonly deck: Deck;

    constructor() {
        this.deck = new Deck(DeckType.STANDARD_52);
    }

    public async execute(): Promise<Block> {
        this.deck.shuffle();
        return new Block();
    }
}
