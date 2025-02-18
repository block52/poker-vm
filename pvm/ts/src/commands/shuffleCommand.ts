import { Deck } from "../models";
import { RandomCommand } from "./randomCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { signResult } from "./abstractSignedCommand";

export class ShuffleCommand implements ISignedCommand<Deck> {
    private readonly deck: Deck;

    constructor(private readonly privateKey: string) {
        this.deck = new Deck();
    }

    public async execute(): Promise<ISignedResponse<Deck>> {
        const randomCommand = new RandomCommand(52, Date.now().toString(), this.privateKey);
        const random: ISignedResponse<Buffer> = await randomCommand.execute();

        // Error handling: Ensure we have at least 52 bytes of random data.
        if (random.data.length < 52) {
            throw new Error("Insufficient random data for shuffle seed.");
        }

        // Generate the seed by taking each byte modulo 52.
        // This ensures that each seed value is in the range 0–51.
        const seed: number[] = [];
        for (let i = 0; i < 52; i++) {
            // Reducing each byte modulo 52 to help avoid bias in the Fisher‑Yates shuffle.
            seed.push(random.data[i] % 52);
        }

        // Pass seed to deck's shuffle method
        this.deck.shuffle(seed);

        return await signResult(this.deck, this.privateKey);
    }
}
