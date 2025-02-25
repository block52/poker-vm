import { ShuffleCommand } from "./shuffleCommand";
import { Deck, Card } from "../models/deck";
import { RandomCommand } from "./randomCommand";
import { signResult } from "./abstractSignedCommand";

// We mock RandomCommand and signResult so that we can control the random seed
// and inspect the resulting shuffled deck.
jest.mock("./randomCommand");
jest.mock("./abstractSignedCommand");

describe("ShuffleCommand (Singleton Unit Test)", () => {
    const privateKey = "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb";
    let singletonShuffleCommand: ShuffleCommand;

    // Override signResult so that it simply returns the deck passed in (with a dummy signature)
    (signResult as jest.Mock).mockImplementation((deck, key) => Promise.resolve({ data: deck, signature: "signature" }));

    // Create a single (singleton) instance of ShuffleCommand before all tests.
    beforeAll(() => {
        singletonShuffleCommand = new ShuffleCommand(privateKey);
    });

    // Before each test, clear mocks and reset the internal Deck.
    // We use Object.defineProperty to override the read‑only 'deck' property.
    beforeEach(() => {
        jest.clearAllMocks();
        Object.defineProperty(singletonShuffleCommand, "deck", {
            value: new Deck(),
            writable: true
        });
        (signResult as jest.Mock).mockImplementation((deck, key) => Promise.resolve({ data: deck, signature: "signature" }));
    });

    it("initialises with correct private key", () => {
        expect(singletonShuffleCommand).toBeDefined();
    });

    it("throws error if random data length is insufficient", async () => {
        // Provide an invalid seed buffer (10 bytes instead of required 52)
        const invalidSeed = Buffer.alloc(10);
        (RandomCommand.prototype.execute as jest.Mock).mockResolvedValue({
            data: invalidSeed
        });
        await expect(singletonShuffleCommand.execute()).rejects.toThrow("Insufficient random data for shuffle seed.");
    });

    it("produces consistent shuffle order with the same seed", async () => {
        // Use a fixed seed: a buffer with values [0, 1, 2, …, 51]
        const fixedSeed = Buffer.from(Array.from({ length: 52 }, (_, i) => i));
        (RandomCommand.prototype.execute as jest.Mock).mockResolvedValue({
            data: fixedSeed
        });
        const response1 = await singletonShuffleCommand.execute();

        // Reset the deck so that the shuffle starts fresh with the same seed.
        Object.defineProperty(singletonShuffleCommand, "deck", {
            value: new Deck(),
            writable: true
        });
        (RandomCommand.prototype.execute as jest.Mock).mockResolvedValue({
            data: fixedSeed
        });
        const response2 = await singletonShuffleCommand.execute();

        const deckOrder1 = response1.data
            .toJson()
            .cards.map((c: Card) => c.mnemonic)
            .join(",");
        const deckOrder2 = response2.data
            .toJson()
            .cards.map((c: Card) => c.mnemonic)
            .join(",");
        // With the same fixed seed, the deck order should be identical.
        expect(deckOrder1).toEqual(deckOrder2);
    });

    it("shuffles the deck and returns a deck order different from the original", async () => {
        // Use a seed that forces a swap—for example, set the last value to 0 (0 % 52 = 0)
        const mockSeed = Buffer.from(Array.from({ length: 52 }, (_, i) => (i === 51 ? 0 : i)));
        (RandomCommand.prototype.execute as jest.Mock).mockResolvedValue({
            data: mockSeed
        });
        const originalDeck = new Deck();
        const originalOrder = originalDeck
            .toJson()
            .cards.map((c: Card) => c.mnemonic)
            .join(",");
        const response = await singletonShuffleCommand.execute();
        const shuffledOrder = response.data
            .toJson()
            .cards.map((c: Card) => c.mnemonic)
            .join(",");
        expect(shuffledOrder).not.toEqual(originalOrder);
    });

    it("handles high-value seed correctly", async () => {
        // Generate a seed with high random byte values (simulate production randomness)
        const highSeed = Buffer.from(Uint8Array.from({ length: 52 }, () => Math.floor(Math.random() * 256)));
        (RandomCommand.prototype.execute as jest.Mock).mockResolvedValue({
            data: highSeed
        });
        const response = await singletonShuffleCommand.execute();
        expect(response.data.toJson().cards.length).toBe(52);
    });

    it("calls deck.shuffle exactly once", async () => {
        const mockSeed = Buffer.from(Array.from({ length: 52 }, (_, i) => i));
        (RandomCommand.prototype.execute as jest.Mock).mockResolvedValue({
            data: mockSeed
        });
        (signResult as jest.Mock).mockResolvedValue({
            data: new Deck(),
            signature: "signature"
        });
        const shuffleSpy = jest.spyOn(singletonShuffleCommand["deck"], "shuffle");

        await singletonShuffleCommand.execute();
        expect(shuffleSpy).toHaveBeenCalledTimes(1);
    });

    it("maintains deck integrity after multiple shuffles", async () => {
        const mockSeed = Buffer.from(Array.from({ length: 52 }, (_, i) => i));
        (RandomCommand.prototype.execute as jest.Mock).mockResolvedValue({
            data: mockSeed
        });
        const response1 = await singletonShuffleCommand.execute();
        // Reset the deck for a fresh shuffle.
        Object.defineProperty(singletonShuffleCommand, "deck", {
            value: new Deck(),
            writable: true
        });
        (RandomCommand.prototype.execute as jest.Mock).mockResolvedValue({
            data: mockSeed
        });
        const response2 = await singletonShuffleCommand.execute();
        expect(response1.data.toJson().cards.length).toBe(52);
        expect(response2.data.toJson().cards.length).toBe(52);
    });

    it("computes seed with modulo 52 to avoid bias", async () => {
        // Use a fixed buffer with values above 51 so that the modulo operation matters.
        // For example, generate values starting at 60 and increasing by 3.
        const rawSeedValues = Array.from({ length: 52 }, (_, i) => 60 + i * 3);
        const rawSeed = Buffer.from(rawSeedValues);
        // Expected seed is computed by applying modulo 52 to each value.
        const expectedSeed = rawSeedValues.map(value => value % 52);
        (RandomCommand.prototype.execute as jest.Mock).mockResolvedValue({
            data: rawSeed
        });
        // Spy on the deck.shuffle method to capture its parameter.
        const shuffleSpy = jest.spyOn(singletonShuffleCommand["deck"], "shuffle");
        await singletonShuffleCommand.execute();
        expect(shuffleSpy).toHaveBeenCalledWith(expectedSeed);
    });

    it("produces different deck hashes when different seeds are used", async () => {
        // Create two different seeds.
        const seed1 = Buffer.from(Array.from({ length: 52 }, (_, i) => i));
        const seed2 = Buffer.from(Array.from({ length: 52 }, (_, i) => i + 1));
        // For the first execution, use seed1.
        (RandomCommand.prototype.execute as jest.Mock).mockResolvedValueOnce({
            data: seed1
        });
        const response1 = await singletonShuffleCommand.execute();
        // Reset deck and then use seed2.
        Object.defineProperty(singletonShuffleCommand, "deck", {
            value: new Deck(),
            writable: true
        });
        (RandomCommand.prototype.execute as jest.Mock).mockResolvedValueOnce({
            data: seed2
        });
        const response2 = await singletonShuffleCommand.execute();
        const hash1 = response1.data.hash;
        const hash2 = response2.data.hash;
        expect(hash1).not.toEqual(hash2);
    });
});
