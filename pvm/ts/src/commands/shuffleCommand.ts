import { ethers } from "ethers";
import { Deck } from "../models";
import { DeckType } from "../models/deck";
import { ICommand } from "./interfaces";
import { RandomCommand } from "./randomCommand";

export class ShuffleCommand implements ICommand<Deck> {
    private readonly deck: Deck;

    constructor(private readonly privateKey: string | undefined) {
        this.deck = new Deck(DeckType.STANDARD_52);
    }

    public async execute(): Promise<Deck> {
        const randomCommand = new RandomCommand(52);
        const random = await randomCommand.execute();

        const deck = new Deck(DeckType.STANDARD_52);
        const seed: number[] = [];

        for (let i = 0; i < 52; i++) {
            seed.push(random[i]);
        }

        deck.shuffle(seed);
        const json = deck.toJSON();

        if (this.privateKey) {
            const signer = new ethers.Wallet(this.privateKey);
            const signature = await signer.signMessage(random.toString("hex"));
        }

        // this.deck.shuffle(random);
        throw new Error("Method not implemented.");
    }
}
