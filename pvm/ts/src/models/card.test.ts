import { Deck, DeckType, SUIT } from "./deck";

describe.only("Card Tests", () => {
    it("should get card mnemonic ", async () => {
        const deck = new Deck(DeckType.STANDARD_52);
        const card = deck.getCardMnemonic(SUIT.CLUBS, 1);

        expect(card).toBe("AC");
    });
});
