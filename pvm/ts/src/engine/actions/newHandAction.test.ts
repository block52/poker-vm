import { KEYS, NonPlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import NewHandAction from "./newHandAction";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import { IUpdate } from "../types";
import { getDefaultGame, ONE_THOUSAND_TOKENS } from "../testConstants";

describe("NewHandAction", () => {
    let action: NewHandAction;
    let game: TexasHoldemGame;
    let player: Player;
    let updateMock: IUpdate;
    let validSeedData: string;

    beforeEach(() => {
        // Mock the IUpdate interface
        updateMock = {
            addAction: jest.fn()
        };

        // Create default game
        const playerStates = new Map<number, Player | null>();
        playerStates.set(1, new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        ));
        playerStates.set(2, new Player(
            "0x123456789abcdef123456789abcdef123456789a",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        ));

        game = getDefaultGame(playerStates);

        // Setup game for end round (new hand can only be created after hand ends)
        jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.END);

        // Create valid deck data (52 card mnemonics)
        const validDeck = "AC-2C-3C-4C-5C-6C-7C-8C-9C-TC-JC-QC-KC-AD-2D-3D-4D-5D-6D-7D-8D-9D-TD-JD-QD-KD-AH-2H-3H-4H-5H-6H-7H-8H-9H-TH-JH-QH-KH-AS-2S-3S-4S-5S-6S-7S-8S-9S-TS-JS-QS-KS";
        validSeedData = `deck=${validDeck}`;

        action = new NewHandAction(game, updateMock, validSeedData);

        player = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        );

        // Mock console.log to avoid test output
        jest.spyOn(console, "log").mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("constructor", () => {
        it("should store the data parameter", () => {
            expect((action as any).data).toBe(validSeedData);
        });

        it("should call parent constructor", () => {
            expect(action.type).toBe(NonPlayerActionType.NEW_HAND);
        });
    });

    describe("type", () => {
        it("should return NEW_HAND type", () => {
            expect(action.type).toBe(NonPlayerActionType.NEW_HAND);
        });
    });

    describe("verify", () => {
        it("should return correct range when new hand is valid", () => {
            const result = action.verify(player);

            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should throw error if hand has not finished", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

            expect(() => action.verify(player)).toThrow("Hand has not finished.");
        });

        it("should throw error if in showdown round", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.SHOWDOWN);

            expect(() => action.verify(player)).toThrow("Hand has not finished.");
        });

        it("should work in END round", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.END);

            expect(() => action.verify(player)).not.toThrow();
        });
    });

    describe("execute", () => {
        beforeEach(() => {
            // Mock game methods
            jest.spyOn(game, "reInit").mockImplementation();
        });

        it("should call verify before executing", () => {
            const verifySpy = jest.spyOn(action, "verify");

            action.execute(player, 1);

            expect(verifySpy).toHaveBeenCalledWith(player);
        });

        it("should throw error if data is empty", () => {
            const emptyDataAction = new NewHandAction(game, updateMock, "");

            expect(() => emptyDataAction.execute(player, 1)).toThrow("Deck data is required to create a new hand.");
        });

        it("should throw error if data is only whitespace", () => {
            const whitespaceDataAction = new NewHandAction(game, updateMock, "   ");

            expect(() => whitespaceDataAction.execute(player, 1)).toThrow("Deck data is required to create a new hand.");
        });

        it("should throw error if seed parameter is missing", () => {
            const noSeedAction = new NewHandAction(game, updateMock, "otherParam=value");

            expect(() => noSeedAction.execute(player, 1)).toThrow("Either 'deck' or 'seed' parameter is required in the data.");
        });

        // SKIPPED: This test is for legacy seed-based validation which is deprecated
        // The newHandAction now accepts pre-shuffled deck strings from Cosmos
        it.skip("should throw error if seed has wrong number of elements", () => {
            const shortSeedData = `${KEYS.SEED}=1-2-3-4-5`;
            const shortSeedAction = new NewHandAction(game, updateMock, shortSeedData);

            expect(() => shortSeedAction.execute(player, 1)).toThrow("Seed must contain exactly 52 numbers separated by dashes");
        });

        it("should handle deck with exactly 52 cards", () => {
            action.execute(player, 1);

            expect(game.reInit).toHaveBeenCalled();
        });

        // SKIPPED: This test is for legacy seed-based behavior which is deprecated
        it.skip("should parse seed numbers correctly", () => {
            const customSeed = Array.from({ length: 52 }, (_, i) => (i + 10).toString());
            const customSeedData = `${KEYS.SEED}=${customSeed.join("-")}`;
            const customAction = new NewHandAction(game, updateMock, customSeedData);

            expect(() => customAction.execute(player, 1)).not.toThrow();
            expect(game.reInit).toHaveBeenCalled();
        });

        // SKIPPED: This test is for legacy seed-based behavior which is deprecated
        it.skip("should handle non-numeric values in seed by converting to 0", () => {
            const mixedSeed = Array.from({ length: 52 }, (_, i) => i < 5 ? "invalid" : i.toString());
            const mixedSeedData = `${KEYS.SEED}=${mixedSeed.join("-")}`;
            const mixedAction = new NewHandAction(game, updateMock, mixedSeedData);

            expect(() => mixedAction.execute(player, 1)).not.toThrow();
            expect(game.reInit).toHaveBeenCalled();
        });

        it("should log new hand action with pre-shuffled deck", () => {
            action.execute(player, 1);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining("New hand action with pre-shuffled deck from Cosmos")
            );
        });

        it("should call game.reInit with deck string", () => {
            action.execute(player, 1);

            expect(game.reInit).toHaveBeenCalledWith(expect.any(String));
        });

        it("should throw error if verification fails", () => {
            // Make verification fail by setting wrong round
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

            expect(() => action.execute(player, 1)).toThrow("Hand has not finished.");
        });

        // SKIPPED: This test is for legacy seed-based behavior which is deprecated
        it.skip("should handle empty seed parameter", () => {
            const emptySeedData = `${KEYS.SEED}=`;
            const emptySeedAction = new NewHandAction(game, updateMock, emptySeedData);

            expect(() => emptySeedAction.execute(player, 1)).toThrow("Seed must contain exactly 52 numbers separated by dashes");
        });

        it("should handle malformed URL parameters", () => {
            const malformedAction = new NewHandAction(game, updateMock, "malformed-data-without-equals");

            expect(() => malformedAction.execute(player, 1)).toThrow("Either 'deck' or 'seed' parameter is required in the data.");
        });
    });

    describe("integration scenarios", () => {
        it("should handle typical new hand scenario", () => {
            // Setup: Game in END round with valid deck
            jest.spyOn(game, "reInit").mockImplementation();

            // Execute new hand action
            const result = action.verify(player);
            action.execute(player, 5);

            // Verify results
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining("New hand action with pre-shuffled deck from Cosmos")
            );
            expect(game.reInit).toHaveBeenCalledWith(expect.any(String));
        });

        // SKIPPED: This test is for legacy seed-based behavior which is deprecated
        it.skip("should handle new hand with custom seed values", () => {
            // Test with a specific seed pattern
            const customSeed = Array.from({ length: 52 }, (_, i) => (i * 2).toString());
            const customSeedData = `${KEYS.SEED}=${customSeed.join("-")}`;
            const customAction = new NewHandAction(game, updateMock, customSeedData);

            jest.spyOn(game, "reInit").mockImplementation();

            const result = customAction.verify(player);
            customAction.execute(player, 3);

            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            expect(game.reInit).toHaveBeenCalled();
        });

        it("should handle new hand with mixed valid/invalid seed numbers", () => {
            // Test resilience with mixed data
            const mixedSeed = Array.from({ length: 52 }, (_, i) => {
                if (i % 10 === 0) return "NaN";
                if (i % 7 === 0) return "";
                return i.toString();
            });
            const mixedSeedData = `${KEYS.SEED}=${mixedSeed.join("-")}`;
            const mixedAction = new NewHandAction(game, updateMock, mixedSeedData);

            jest.spyOn(game, "reInit").mockImplementation();

            expect(() => mixedAction.verify(player)).not.toThrow();
            expect(() => mixedAction.execute(player, 7)).not.toThrow();
            expect(game.reInit).toHaveBeenCalled();
        });

        it("should handle new hand with additional URL parameters", () => {
            // Test that it works with extra parameters
            const seedNumbers = Array.from({ length: 52 }, (_, i) => i.toString());
            const dataWithExtras = `${KEYS.SEED}=${seedNumbers.join("-")}&extra=value&another=param`;
            const actionWithExtras = new NewHandAction(game, updateMock, dataWithExtras);

            jest.spyOn(game, "reInit").mockImplementation();

            expect(() => actionWithExtras.execute(player, 8)).not.toThrow();
            expect(game.reInit).toHaveBeenCalled();
        });
    });
});