import { PlayerStatus, TexasHoldemRound, NonPlayerActionType, PlayerActionType } from "@block52/poker-vm-sdk";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, mnemonic, getNextTestTimestamp } from "./testConstants";
import { Player } from "../models/player";

describe("Texas Holdem - Join and Leave", () => {
    describe("Player Management", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should start in ANTE round", () => {
            expect(game.currentRound).toBe(TexasHoldemRound.ANTE);
        });

        it("should not progress rounds without minimum players", () => {
            // Create test players with sufficient chips
            const player1 = new Player("0x1111111111111111111111111111111111111111", undefined, ONE_HUNDRED_TOKENS, undefined, PlayerStatus.ACTIVE);

            game.performAction(player1.address, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp()); // Only one player

            const nextIndex = game.getActionIndex();
            expect(() => game.performAction(player1.address, NonPlayerActionType.DEAL, nextIndex, undefined, undefined, getNextTestTimestamp())).toThrow("Not enough active players");
        }); it("should not be able to join more than once", () => {
            expect(game.findNextEmptySeat()).toEqual(1);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            expect(() => {
                game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            }).toThrow("Player already exists in the game.");
        });

        it("should not allow duplicate players", () => {
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            expect(() => game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp())).toThrow();
        });

        it("should track player positions correctly", () => {
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

            expect(game.getPlayerSeatNumber("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toEqual(1);
            expect(game.getPlayerSeatNumber("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toEqual(2);
        });

        it("should track player positions correctly in other seats", () => {
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=7", getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());

            expect(game.getPlayerSeatNumber("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toEqual(7);
            expect(game.getPlayerSeatNumber("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toEqual(3);
        });
    });

    describe("Mid-Hand Join Behavior", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should set player to ACTIVE when joining during ANTE", () => {
            // Join during ANTE round (before hand starts)
            expect(game.currentRound).toBe(TexasHoldemRound.ANTE);

            game.performAction("0x1111111111111111111111111111111111111111", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());

            const player = game.getPlayer("0x1111111111111111111111111111111111111111");
            expect(player?.status).toBe(PlayerStatus.ACTIVE);
        });

        it("should set player to SITTING_OUT when joining during PREFLOP", () => {
            const PLAYER_1 = "0x1111111111111111111111111111111111111111";
            const PLAYER_2 = "0x2222222222222222222222222222222222222222";
            const PLAYER_3 = "0x3333333333333333333333333333333333333333";

            // Setup: Start a hand with 2 players
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

            // Post blinds and deal
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_HUNDRED_TOKENS / 100n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, ONE_HUNDRED_TOKENS / 50n, undefined, getNextTestTimestamp());

            const dealIndex = game.getActionIndex();
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, dealIndex, undefined, undefined, getNextTestTimestamp());

            // Verify we're past ANTE
            expect(game.currentRound).not.toBe(TexasHoldemRound.ANTE);

            // Third player joins mid-hand - JOIN doesn't require sequential index check
            const joinIndex = game.getActionIndex();
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, joinIndex, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());

            const player = game.getPlayer(PLAYER_3);
            expect(player?.status).toBe(PlayerStatus.SITTING_OUT);
        });

        it("should activate SITTING_OUT players when new hand starts", () => {
            const PLAYER_1 = "0x1111111111111111111111111111111111111111";
            const PLAYER_2 = "0x2222222222222222222222222222222222222222";
            const PLAYER_3 = "0x3333333333333333333333333333333333333333";

            // Setup: Start a hand with 2 players
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

            // Post blinds and deal
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_HUNDRED_TOKENS / 100n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, ONE_HUNDRED_TOKENS / 50n, undefined, getNextTestTimestamp());

            let dealIndex = game.getActionIndex();
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, dealIndex, undefined, undefined, getNextTestTimestamp());

            // Third player joins mid-hand
            let joinIndex = game.getActionIndex();
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, joinIndex, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());

            let player3 = game.getPlayer(PLAYER_3);
            expect(player3?.status).toBe(PlayerStatus.SITTING_OUT);

            // Complete the hand - player 1 folds, player 2 wins
            let nextIndex = game.getActionIndex();
            game.performAction(PLAYER_1, PlayerActionType.FOLD, nextIndex, undefined, undefined, getNextTestTimestamp());

            // Start new hand
            dealIndex = game.getActionIndex();
            game.performAction(PLAYER_2, NonPlayerActionType.NEW_HAND, dealIndex, undefined, `deck=${mnemonic}`, getNextTestTimestamp());

            // Verify player 3 is now ACTIVE
            player3 = game.getPlayer(PLAYER_3);
            expect(player3?.status).toBe(PlayerStatus.ACTIVE);
        });

        it("should not deal cards to SITTING_OUT players", () => {
            const PLAYER_1 = "0x1111111111111111111111111111111111111111";
            const PLAYER_2 = "0x2222222222222222222222222222222222222222";
            const PLAYER_3 = "0x3333333333333333333333333333333333333333";

            // Setup: Start a hand with 2 players
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

            // Post blinds and deal
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_HUNDRED_TOKENS / 100n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, ONE_HUNDRED_TOKENS / 50n, undefined, getNextTestTimestamp());

            const dealIndex = game.getActionIndex();
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, dealIndex, undefined, undefined, getNextTestTimestamp());

            // Third player joins mid-hand
            const joinIndex = game.getActionIndex();
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, joinIndex, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());

            const player3 = game.getPlayer(PLAYER_3);
            expect(player3).toBeDefined();
            expect(player3?.status).toBe(PlayerStatus.SITTING_OUT);

            // Verify player 3 has no cards (cards array should be empty or undefined for SITTING_OUT players)
            expect(player3?.cards || []).toHaveLength(0);
        });
    });
});
