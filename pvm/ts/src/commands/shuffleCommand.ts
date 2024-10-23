import { Block, Deck } from "../models";
import { DeckType } from "../models/deck";
import { ICommand } from "./interfaces";
import { RandomCommand } from "./randomCommand";

export class ShuffleCommand implements ICommand<Deck> {
    private readonly deck: Deck;

    constructor() {
        this.deck = new Deck(DeckType.STANDARD_52);
    }

    public async execute(): Promise<Deck> {
        const randomCommand = new RandomCommand(52);
        const random = await randomCommand.execute();

        // this.deck.shuffle(random);
        throw new Error("Method not implemented.");
    }
}
