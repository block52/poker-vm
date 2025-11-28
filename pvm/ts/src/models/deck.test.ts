import { Deck } from "./deck";
import { Card, SUIT } from "@bitcoinbrisbane/block52";

describe("Deck", () => {
    let deck: Deck;

    beforeEach(() => {
        deck = new Deck();
    });

    describe("constructor", () => {
        it("should initialize with default values", () => {
            expect(deck.hash).toBeDefined();
        });

        it("should initialize with standard 52-card deck", () => {
            const mnemonic = "AC-2C-3C-4C-5C-6C-7C-8C-9C-TC-JC-QC-KC-" +
                "AD-2D-3D-4D-5D-6D-7D-8D-9D-TD-JD-QD-KD-" +
                "AH-2H-3H-4H-5H-6H-7H-8H-9H-TH-JH-QH-KH-" +
                "AS-2S-3S-4S-5S-6S-7S-8S-9S-TS-JS-QS-KS";

            const deck = new Deck(mnemonic);
            const json = deck.toJson() as { cards: unknown[] };
            expect(json.cards).toHaveLength(52);
        });

        it("should serialize to string", () => {
            const mnemonic = "[AC]-2C-3C-4C-5C-6C-7C-8C-9C-TC-JC-QC-KC-" +
                "AD-2D-3D-4D-5D-6D-7D-8D-9D-TD-JD-QD-KD-" +
                "AH-2H-3H-4H-5H-6H-7H-8H-9H-TH-JH-QH-KH-" +
                "AS-2S-3S-4S-5S-6S-7S-8S-9S-TS-JS-QS-KS";

            const deck = new Deck(mnemonic);
            expect(deck.toString()).toEqual(mnemonic);
        });

        it("should treat empty string as undefined (create standard deck)", () => {
            const emptyDeck = new Deck("");
            expect((emptyDeck.toJson() as { cards: unknown[] }).cards).toHaveLength(52);
        });

        it("should treat whitespace-only string as undefined (create standard deck)", () => {
            const whitespaceDeck = new Deck("   ");
            expect((whitespaceDeck.toJson() as { cards: unknown[] }).cards).toHaveLength(52);
        });

        it("should initialize standard deck if no parameter provided", () => {
            const standardDeck = new Deck();
            const json = standardDeck.toJson() as { cards: unknown[] };
            expect(json.cards).toHaveLength(52);
        });

        it("should initialize standard deck if undefined parameter provided", () => {
            const standardDeck = new Deck(undefined);
            const json = standardDeck.toJson() as { cards: unknown[] };
            expect(json.cards).toHaveLength(52);
        });
    });

    // NOTE: Shuffle tests removed - shuffling is now handled by Cosmos blockchain
    // The Deck class is now a DTO (Data Transfer Object) for deck state only

    describe("getCardMnemonic", () => {
        it("should convert number cards correctly", () => {
            expect(deck.getCardMnemonic(SUIT.SPADES, 2)).toBe("2S");
            expect(deck.getCardMnemonic(SUIT.HEARTS, 10)).toBe("TH");
        });

        it("should convert face cards correctly", () => {
            expect(deck.getCardMnemonic(SUIT.CLUBS, 11)).toBe("JC");
            expect(deck.getCardMnemonic(SUIT.DIAMONDS, 12)).toBe("QD");
            expect(deck.getCardMnemonic(SUIT.HEARTS, 13)).toBe("KH");
            expect(deck.getCardMnemonic(SUIT.SPADES, 1)).toBe("AS");
        });
    });

    describe("getNext and deal", () => {
        it("should draw next card correctly", () => {
            const card = deck.getNext();
            expect(card).toBeDefined();
            expect(card.suit).toBeDefined();
            expect(card.rank).toBeDefined();
            expect(card.value).toBeDefined();
            expect(card.mnemonic).toBeDefined();

            const nextCard = deck.getNext();
            expect(nextCard).toBeDefined();
            expect(card).not.toEqual(nextCard);
        });

        it("should deal multiple cards", () => {
            const cards = deck.deal(5);
            expect(cards).toHaveLength(5);
            cards.forEach((card: Card) => {
                expect(card).toBeDefined();
                expect(card.suit).toBeDefined();
                expect(card.rank).toBeDefined();
                expect(card.value).toBeDefined();
                expect(card.mnemonic).toBeDefined();
            });

            // Check if top index has moved
            const nextCard = deck.getNext();
            expect(nextCard).toBeDefined();
            expect(cards[0]).not.toEqual(nextCard);
        });
    });

    describe("toJson", () => {
        it("should serialize deck state", () => {
            const json = deck.toJson() as { cards: unknown[] };
            expect(json).toHaveProperty("cards");
            expect(Array.isArray(json.cards)).toBeTruthy();
        });
    });

    describe("initStandard52", () => {
        it("should create a standard 52-card deck", () => {
            const json = deck.toJson() as { cards: unknown[] };
            expect(json.cards).toHaveLength(52);

            // Check for Ace of Spades (rank 1)
            const hasAceOfSpades = (json.cards as Card[]).some((card: Card) => card.suit === SUIT.SPADES && card.rank === 1);
            expect(hasAceOfSpades).toBeTruthy();
        });
    });

    describe("hash generation", () => {
        it("should create different hashes for different card orders", () => {
            const standardDeck = new Deck();
            const standardHash = standardDeck.hash;

            // Create a deck with a different order (reversed)
            const reversedDeckStr = "KS-QS-JS-TS-9S-8S-7S-6S-5S-4S-3S-2S-AS-" +
                "KH-QH-JH-TH-9H-8H-7H-6H-5H-4H-3H-2H-AH-" +
                "KD-QD-JD-TD-9D-8D-7D-6D-5D-4D-3D-2D-AD-" +
                "KC-QC-JC-TC-9C-8C-7C-6C-5C-4C-3C-2C-AC";

            const reversedDeck = new Deck(reversedDeckStr);
            const reversedHash = reversedDeck.hash;

            // Different card orders should produce different hashes
            expect(reversedHash).not.toEqual(standardHash);
        });
    });
});
