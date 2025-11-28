import { PlayerStatus, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS } from "./testConstants";
import { Player } from "../models/player";

describe("Texas Holdem Game - Dealer Position", () => {

    describe("findDealer", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should find the first seat when table is empty", () => {
            // When the table is empty, seat 1 should be available
            expect(game.findNextEmptySeat()).toBe(1);
        });

        it("should find the next available seat in sequential order", () => {
            // Add players to seats 1 and 2
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1");
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2");

            // Next available seat should be 3
            expect(game.findNextEmptySeat()).toBe(3);
        });

        it("should find seat 1 when only higher-numbered seats are filled", () => {
            // Create a game with custom player setup where seats 2-6 are filled
            const _customGameConfig = { ...baseGameConfig };

            // Manually set up the players map to fill specific seats
            const players = new Map<number, Player | null>();
            for (let seat = 2; seat <= 6; seat++) {
                const addr = `0x${seat}00000000000000000000000000000000000000`;
                players.set(seat, new Player(addr, undefined, ONE_HUNDRED_TOKENS, undefined, PlayerStatus.ACTIVE));
            }

            // Use reflection to access private field
            const gameWithPrivates = game as unknown as { _playersMap: Map<number, Player | null> };
            gameWithPrivates._playersMap = players;

            // Should find seat 1 as available
            expect(game.findNextEmptySeat()).toBe(1);
        });
    });
});