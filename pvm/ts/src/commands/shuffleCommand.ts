import { ethers } from "ethers";
import { Deck } from "../models";
import { DeckType } from "../models/deck";
import { RandomCommand } from "./randomCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { signResult } from "./abstractSignedCommand";

export class ShuffleCommand implements ISignedCommand<Deck> {
    private readonly deck: Deck;

    constructor(private readonly privateKey: string) {
        this.deck = new Deck(DeckType.STANDARD_52);
    }

    public async execute(): Promise<ISignedResponse<Deck>> {
        const randomCommand = new RandomCommand(52, Date.now().toString(), this.privateKey);
        const random: ISignedResponse<Buffer> = await randomCommand.execute();

        const seed: number[] = [];

        for (let i = 0; i < 52; i++) { // TODO: Fix this as sufferes modulo bias
            seed.push(random.data[i]);
        }

        this.deck.shuffle();

        return await signResult(this.deck, this.privateKey);
    }
}
