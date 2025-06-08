import { NonPlayerActionType, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TEN_TOKENS, TWO_TOKENS } from "./testConstants";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in with 3 players.
describe("Texas Holdem - Ante - 3 Players", () => {
    describe("3 Players", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "1");
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "2");
        });

        it("should have the correct players in ante", () => {
            expect(game.getPlayerCount()).toEqual(2);

            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "3");
            expect(game.getPlayerCount()).toEqual(3);

            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
            expect(game.getPlayer("0x3333333333333333333333333333333333333333")).toBeDefined();

            expect(game.findNextEmptySeat()).toEqual(4);
        });

        it.skip("should have the correct legal options with 3 players after blinds", () => {
            expect(game.getPlayerCount()).toEqual(2);

            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "3");
            expect(game.getPlayerCount()).toEqual(3);

            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
            expect(game.getPlayer("0x3333333333333333333333333333333333333333")).toBeDefined();

            expect(game.findNextEmptySeat()).toEqual(4);

            // Perform blinds
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.SMALL_BLIND, 4, ONE_TOKEN);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.BIG_BLIND, 5, TWO_TOKENS);

            // Get round
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Get legal actions for player 0
            const actions = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            expect(actions).toBeDefined();
            expect(actions.length).toEqual(2);
            expect(actions[0].action).toEqual(NonPlayerActionType.DEAL);
            expect(actions[1].action).toEqual(PlayerActionType.FOLD);
        });
    });

    describe("3 Players in random seats", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "5"); // seat 5
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "2"); // seat 2
            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "8"); // seat 8
        });

        it("should have the correct legal options with 3 players after blinds", () => {
            expect(game.getPlayerCount()).toEqual(3);

            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
            expect(game.getPlayer("0x3333333333333333333333333333333333333333")).toBeDefined();

            // If dealer is 9, next empty seat is 1
            expect(game.findNextEmptySeat()).toEqual(1);

            // Get next to act
            const nextToAct = game.getNextPlayerToAct();

            // Get player 
            let seat2Actions = game.getLegalActions("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(seat2Actions).toBeDefined();

            // Perform blinds
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.SMALL_BLIND, 4, ONE_TOKEN);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.BIG_BLIND, 5, TWO_TOKENS);

            // Get round
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Get legal actions for player 0 seat 5
            let seat5Actions = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            expect(seat5Actions).toBeDefined();
            expect(seat5Actions.length).toEqual(1);
            expect(seat5Actions[0].action).toEqual(PlayerActionType.FOLD);

            // Get legal actions for player 1 seat 2
            seat2Actions = game.getLegalActions("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(seat2Actions).toBeDefined();

            // Get legal actions for player 2 seat 8
            const seat8Actions = game.getLegalActions("0x3333333333333333333333333333333333333333");
            expect(seat8Actions).toBeDefined();
        });
    });
});
