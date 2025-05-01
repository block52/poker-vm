import { NonPlayerActionType, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TEN_TOKENS, TWO_TOKENS } from "./testConstants";
import { Player } from "../models/player";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in a heads-up scenario.
describe("Texas Holdem - Ante - Heads Up", () => {
    describe("Preflop game states", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should find next seat", () => {
            expect(game.findNextSeat()).toEqual(1);
        });

        it("should not have player", () => {
            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeFalsy();
        });

        it("should not allow player to join with insufficient funds", () => {
            expect(() => game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 0, 10n)).toThrow(
                "Player does not have enough or too many chips to join."
            );
        });

        it("should allow a player to join", () => {
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS);
            expect(game.getPlayerCount()).toEqual(1);
            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeTruthy();
            expect(game.findNextSeat()).toEqual(2);
        });
    });

    describe("Heads up", () => {

        const SMALL_BLIND_PLAYER = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
        const BIG_BLIND_PLAYER = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";

        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS);
            game.performAction(BIG_BLIND_PLAYER, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS);
        });

        it("should have the correct players pre flop", () => {
            expect(game.getPlayerCount()).toEqual(2);

            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeTruthy();
            expect(game.exists("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeTruthy();
            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
        });

        it("should have correct legal actions after posting the small blind", () => {
            // Get legal actions for the next player
            let actual = game.getLegalActions(SMALL_BLIND_PLAYER);
            expect(actual.length).toEqual(2);
            expect(actual[0].action).toEqual(PlayerActionType.SMALL_BLIND);
            expect(actual[1].action).toEqual(PlayerActionType.FOLD);

            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 2, ONE_TOKEN);
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Get legal actions for the next player
            actual = game.getLegalActions(BIG_BLIND_PLAYER);

            expect(actual.length).toEqual(2);
            expect(actual[0].action).toEqual(PlayerActionType.BIG_BLIND);
            expect(actual[1].action).toEqual(PlayerActionType.FOLD);

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(BIG_BLIND_PLAYER);
        });

        it.skip("should have correct legal actions after posting the big blind", () => {
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.SMALL_BLIND, 2, ONE_TOKEN);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.BIG_BLIND, 3, TWO_TOKENS);

            // Get legal actions for the next player
            const actual = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");

            expect(actual.length).toEqual(4);
            expect(actual[0].action).toEqual(NonPlayerActionType.DEAL);
            expect(actual[1].action).toEqual(PlayerActionType.FOLD);
            expect(actual[2].action).toEqual(PlayerActionType.CALL);
            expect(actual[3].action).toEqual(PlayerActionType.RAISE);
        });

        it("should have correct legal actions after posting blinds", () => {
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 2, ONE_TOKEN);
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 3, TWO_TOKENS);
            
            // Add a DEAL action to advance from ANTE to PREFLOP
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 4);
            
            // Now we're in PREFLOP round, so CALL is a valid action
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CALL, 5, ONE_TOKEN);

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(BIG_BLIND_PLAYER);
        });

        it("should advance to next round after ante round", () => {
            let round = game.currentRound;
            expect(round).toEqual(TexasHoldemRound.ANTE);

            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 2, ONE_TOKEN);
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 3, TWO_TOKENS);
            
            // Add a DEAL action to advance from ANTE to PREFLOP
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 4);

            round = game.currentRound;
            expect(round).toEqual(TexasHoldemRound.PREFLOP);
        });
    });

    describe("Heads up end to end", () => {

        const SMALL_BLIND_PLAYER = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
        const BIG_BLIND_PLAYER = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";

        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS);
            game.performAction(BIG_BLIND_PLAYER, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS);
        });

        it("should have the correct players pre flop", () => {
            expect(game.getPlayerCount()).toEqual(2);

            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeTruthy();
            expect(game.exists("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeTruthy();
            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
        });

        it("should do end to end", () => {
            // Get legal actions for the next player
            // let actual = game.getLegalActions(SMALL_BLIND_PLAYER);
            // expect(actual.length).toEqual(2);
            // expect(actual[0].action).toEqual(PlayerActionType.SMALL_BLIND);
            // expect(actual[1].action).toEqual(PlayerActionType.FOLD);

            // Do the small blind
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 2, ONE_TOKEN);
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(BIG_BLIND_PLAYER);

            // Do the big blind
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 3, TWO_TOKENS);
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Add a DEAL action to advance from ANTE to PREFLOP
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 4);
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // Both check
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CHECK, 5, 0n);
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CHECK, 6, 0n);

            expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);

            // Both check
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CHECK, 7, 0n);
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CHECK, 8, 0n);

            expect(game.currentRound).toEqual(TexasHoldemRound.TURN);

            // Both check
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CHECK, 9, 0n);
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CHECK, 10, 0n);

            expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);

            // Both check
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CHECK, 11, 0n);
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CHECK, 12, 0n);

            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);

            // Both reveal cards
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SHOW, 13, 0n);
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.SHOW, 14, 0n);

            // Check the winner
            const gameState = game.toJson();
        });
    });
});
