import { Deck, SUIT } from "./deck";

describe("Card Tests", () => {
    it("should get card mnemonic ", async () => {
        const deck = new Deck();
        const card = deck.getCardMnemonic(SUIT.CLUBS, 1);

        expect(card).toBe("AC");
    });
});
