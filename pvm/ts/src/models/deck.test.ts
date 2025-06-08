import { Deck } from "./deck";
import { Card, NodeRpcClient, SUIT } from "@bitcoinbrisbane/block52";

describe("Deck", () => {
    let deck: Deck;

    beforeEach(() => {
        deck = new Deck();
    });

    describe("constructor", () => {
        it("should initialize with default values", () => {
            expect(deck.hash).toBeDefined();
            expect(deck.seedHash).toBeDefined();
        });

        it("should initialize with standard 52-card deck", () => {
            const mnemonic = "AC-2C-3C-4C-5C-6C-7C-8C-9C-10C-JC-QC-KC-" +
                "AD-2D-3D-4D-5D-6D-7D-8D-9D-10D-JD-QD-KD-" +
                "AH-2H-3H-4H-5H-6H-7H-8H-9H-10H-JH-QH-KH-" +
                "AS-2S-3S-4S-5S-6S-7S-8S-9S-10S-JS-QS-KS";

            const deck = new Deck(mnemonic);
            const json = deck.toJson();
            expect(json.cards).toHaveLength(52);
        });

        it("should serialize to string", () => {
            const mnemonic = "[AC]-2C-3C-4C-5C-6C-7C-8C-9C-10C-JC-QC-KC-" +
                "AD-2D-3D-4D-5D-6D-7D-8D-9D-10D-JD-QD-KD-" +
                "AH-2H-3H-4H-5H-6H-7H-8H-9H-10H-JH-QH-KH-" +
                "AS-2S-3S-4S-5S-6S-7S-8S-9S-10S-JS-QS-KS";

            const deck = new Deck(mnemonic);
            expect(deck.toString()).toEqual(mnemonic);
        });
    });

    describe("shuffle", () => {
        it("should shuffle cards with provided seed", () => {
            // Create a seed array matching deck length (52 cards)
            const seed = Array.from({ length: 52 }, (_, i) => i);
            deck.shuffle(seed);

            // Shuffling with same seed should produce same order
            const deck2 = new Deck();
            deck2.shuffle(seed);

            expect(deck.toJson()).toEqual(deck2.toJson());
        });

        it("should shuffle cards with a random seed", () => {
            const originalCards = [...deck.toJson().cards];
            const seed = NodeRpcClient.generateRandomNumber();
            deck.shuffle(seed);

            const shuffledCards = deck.toJson().cards;            
            const hasChanged = shuffledCards.some((card: Card, index: number) => card.mnemonic !== originalCards[index].mnemonic);
            expect(hasChanged).toBeTruthy();
        });

        it("should shuffle cards with a known seed", () => {
            const seedString = "204,183,236,54,143,190,47,3,93,174,243,141,181,3,129,168,216,114,100,96,100,35,13,88,114,64,124,160,34,245,84,174,104,68,151,167,4,9,144,151,166,197,41,5,218,195,242,115,221,146,93,85";
            const seed = seedString.split(",").map(Number);
            deck.shuffle(seed);

            const shuffledCards = deck.toJson().cards;            
            expect(shuffledCards).toHaveLength(52);
            expect(deck.hash).toBeDefined();
            expect(deck.hash).toEqual("966d008669a45807ecf663de2c8e72503c1e3cd7892a33032b6eb6e2bd1f99d5")
            expect(deck.seedHash).toBeDefined();
            expect(deck.seedHash).toEqual("e0c15743a12c6a792080510757ff0103714f36700d44bd0fe0d28405aaff1c35");
        });
    });

    describe("getCardMnemonic", () => {
        it("should convert number cards correctly", () => {
            expect(deck.getCardMnemonic(SUIT.SPADES, 2)).toBe("2S");
            expect(deck.getCardMnemonic(SUIT.HEARTS, 10)).toBe("10H");
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
            const json = deck.toJson();
            expect(json).toHaveProperty("cards");
            expect(Array.isArray(json.cards)).toBeTruthy();
        });
    });

    describe("initStandard52", () => {
        it("should create a standard 52-card deck", () => {
            const json = deck.toJson();
            expect(json.cards).toHaveLength(52);

            // Check for Ace of Spades (rank 1)
            const hasAceOfSpades = json.cards.some((card: Card) => card.suit === SUIT.SPADES && card.rank === 1);
            expect(hasAceOfSpades).toBeTruthy();
        });
    });

    describe("hash generation", () => {
        it("should create different hashes for different card orders", () => {
            const originalHash = deck.hash;
            const originalOrder = deck
                .toJson()
                .cards.map((c: Card) => c.mnemonic)
                .join(",");

            // Use a seed that will definitely change the order
            deck.shuffle([
                52, 51, 50, 49, 48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17,
                16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1
            ]);

            const newOrder = deck
                .toJson()
                .cards.map((c: Card) => c.mnemonic)
                .join(",");

            expect(newOrder).not.toEqual(originalOrder); // First verify cards actually changed
            expect(deck.hash).not.toEqual(originalHash); // Then verify hash changed
        });
    });
});
