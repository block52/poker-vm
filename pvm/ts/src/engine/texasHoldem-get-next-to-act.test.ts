import { PlayerStatus, NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@block52/poker-vm-sdk";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, getNextTestTimestamp } from "./testConstants";
import { Player } from "../models/player";
import { Turn } from "./types";

describe("Texas Holdem Game - Next seat", () => {
    describe("getNextPlayerToAct", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should return small blind position player when no blinds have been posted yet", () => {
            // Add two players
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

            // Verify small blind position
            const smallBlindPosition = game.smallBlindPosition;
            const smallBlindPlayer = game.getPlayerAtSeat(smallBlindPosition);

            // Next player to act should be the small blind
            const nextPlayer = game.getNextPlayerToAct();
            expect(nextPlayer?.address).toEqual(smallBlindPlayer?.address);
        });

        it("should return big blind position player after small blind has been posted", () => {
            // Add two players
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

            // Post small blind
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());

            // Verify big blind position
            const bigBlindPosition = game.bigBlindPosition;
            const bigBlindPlayer = game.getPlayerAtSeat(bigBlindPosition);

            // Next player to act should be the big blind
            const nextPlayer = game.getNextPlayerToAct();
            expect(nextPlayer?.address).toEqual(bigBlindPlayer?.address);
        });

        it("should find next player in clockwise order after last acted player", () => {
            // Add three players at seats 1, 2, and 3
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp()); // seat 1
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp()); // seat 2
            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp()); // seat 3

            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 5, undefined, undefined, getNextTestTimestamp());

            // Last acted player is at seat 2 (big blind)
            // Next player should be at seat 3
            const nextPlayer = game.getNextPlayerToAct();
            expect(nextPlayer?.address).toEqual("0x3333333333333333333333333333333333333333");
        });

        it.skip("should wrap around to the first seat when reaching the end of the table", () => {
            // Set up a game with players at seats 1, 4, and 6
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp()); // seat 1

            // Manually create players at specific seats
            const customPlayers = new Map(game.players);
            customPlayers.set(4, new Player("0x4000000000000000000000000000000000000000", undefined, ONE_HUNDRED_TOKENS, undefined, PlayerStatus.ACTIVE));
            customPlayers.set(6, new Player("0x6000000000000000000000000000000000000000", undefined, ONE_HUNDRED_TOKENS, undefined, PlayerStatus.ACTIVE));

            // Use reflection to access private field
            const gameAsAny = game as unknown as { _playersMap: Map<number, Player | null>; _smallBlindPosition: number; _bigBlindPosition: number };
            gameAsAny._playersMap = customPlayers;

            // Set up blinds positions
            gameAsAny._smallBlindPosition = 6;
            gameAsAny._bigBlindPosition = 1;

            // Post blinds
            game.performAction("0x6000000000000000000000000000000000000000", PlayerActionType.SMALL_BLIND, 2, undefined, undefined, getNextTestTimestamp());
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.BIG_BLIND, 3, undefined, undefined, getNextTestTimestamp());

            // Set last acted seat to 6 (max seat number)
            (gameAsAny as unknown as { _lastActedSeat: number })._lastActedSeat = 6;

            // Next player should wrap around to seat 1
            const nextPlayer = game.getNextPlayerToAct();
            expect(nextPlayer?.address).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
        });

        it("should skip folded players when finding next player", () => {
            // Add three players
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp()); // seat 1
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp()); // seat 2
            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp()); // seat 3

            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 5, undefined, undefined, getNextTestTimestamp());

            // Set player 2 (seat 2) as folded
            const player2 = game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            player2.updateStatus(PlayerStatus.FOLDED);

            // Set last acted player to seat 1
            const gameAsAny = game as unknown as { _playersMap: Map<number, Player | null>; _smallBlindPosition: number; _bigBlindPosition: number; _lastActedSeat: number };
            gameAsAny._lastActedSeat = 1;

            // Next player should be seat 3, skipping the folded player at seat 2
            const nextPlayer = game.getNextPlayerToAct();
            expect(nextPlayer?.address).toEqual("0x3333333333333333333333333333333333333333");
        });

        it.skip("should skip sitting out players when finding next player", () => {
            // Add three players
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp()); // seat 1
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp()); // seat 2
            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp()); // seat 3

            // Set player 2 (seat 2) as sitting out
            const player2 = game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            player2.updateStatus(PlayerStatus.SITTING_OUT);

            // Post small blind
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 4, undefined, undefined, getNextTestTimestamp());

            // Next player should skip seat 2 (sitting out) and go to seat 3
            const nextPlayer = game.getNextPlayerToAct();
            expect(nextPlayer?.address).toEqual("0x3333333333333333333333333333333333333333");
        });

        it.skip("should recognize players with ACTIVE status", () => {
            // Add three players
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp()); // seat 1
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp()); // seat 2
            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp()); // seat 3

            // Set player 2 (seat 2) as ACTIVE
            const player2 = game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            player2.updateStatus(PlayerStatus.ACTIVE);

            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction("0x3333333333333333333333333333333333333333", PlayerActionType.BIG_BLIND, 5, undefined, undefined, getNextTestTimestamp());

            // Set last acted player to seat 3
            const gameAsAny = game as unknown as { _playersMap: Map<number, Player | null>; _smallBlindPosition: number; _bigBlindPosition: number; _lastActedSeat: number };
            gameAsAny._lastActedSeat = 3;

            // Next player should be seat 2 (ACTIVE) even though we've passed it
            const nextPlayer = game.getNextPlayerToAct();
            expect(nextPlayer?.address).toEqual("0x980b8D8A16f5891F41871d878a479d81Da52334c");
        });

        it("should return undefined if no active players are found", () => {
            // Add three players but all are folded or sitting out
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

            // Set all players as folded or sitting out
            const player1 = game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            const player2 = game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c");

            player1.updateStatus(PlayerStatus.FOLDED);
            player2.updateStatus(PlayerStatus.SITTING_OUT);

            // Post blinds (this is a bit artificial but necessary for the test)
            const turn1: Turn = {
                playerId: "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac",
                action: PlayerActionType.SMALL_BLIND,
                amount: game.smallBlind,
                index: 3
            };
            const turn2: Turn = {
                playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                action: PlayerActionType.BIG_BLIND,
                amount: game.bigBlind,
                index: 4
            };
            game.addAction(turn1, TexasHoldemRound.ANTE);
            game.addAction(turn2, TexasHoldemRound.ANTE);

            // Should return undefined as no eligible players
            const nextPlayer = game.getNextPlayerToAct();
            expect(nextPlayer).toBeUndefined();
        });
    });
});
