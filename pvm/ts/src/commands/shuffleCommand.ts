import { Deck } from "../models";
import { DeckType } from "../models/deck";
import { AbstractCommand } from "./abstractSignedCommand";
import { RandomCommand } from "./randomCommand";

export class ShuffleCommand extends AbstractCommand<Deck> {
    private readonly deck: Deck;

    constructor(privateKey: string) {
        super(privateKey);
        this.deck = new Deck(DeckType.STANDARD_52);
    }

    public async executeCommand(): Promise<Deck> {
        const randomCommand = new RandomCommand(52, Date.now().toString(), this.privateKey);
        const random = await randomCommand.executeCommand();

        const seed: number[] = [];

        for (let i = 0; i < 52; i++) {
            seed.push(random[i]);
        }

        this.deck.shuffle(seed);

        // this.deck.shuffle(random);
        throw new Error("Method not implemented.");
    }
}
