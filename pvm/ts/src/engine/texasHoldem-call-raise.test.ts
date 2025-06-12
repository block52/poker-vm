import { PlayerActionType, TexasHoldemRound, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TEN_TOKENS, TWO_TOKENS } from "./testConstants";

describe("Texas Holdem Game", () => {

    describe("Texas Holdem - Call raise preflop", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            // Add minimum required players
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "1");
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "2");
        });

        it("should have correct call values for sb", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 3);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 4);

            // After blinds are posted, small blind acts first in preflop
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Deal cards
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.DEAL, 5);
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
            
            const legalActions = game.getLegalActions("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(legalActions).toBeDefined();
            expect(legalActions.length).toEqual(3); // Fold, Call or Raise
            
            expect(legalActions[0].action).toEqual(PlayerActionType.FOLD);
            expect(legalActions[1].action).toEqual(PlayerActionType.CALL);
            expect(legalActions[1].min).toEqual("100000000000000000");
            expect(legalActions[1].max).toEqual("100000000000000000");
            expect(legalActions[2].action).toEqual(PlayerActionType.RAISE);
        });

        it("should have correct call values for bb after sb calls", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 3);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 4);

            // After blinds are posted, small blind acts first in preflop
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Deal cards
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.DEAL, 5);
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 6);

            const legalActions = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            expect(legalActions).toBeDefined();
            expect(legalActions.length).toEqual(3); // Fold, Check or Bet
            
            expect(legalActions[0].action).toEqual(PlayerActionType.FOLD);
            expect(legalActions[1].action).toEqual(PlayerActionType.CHECK);
            expect(legalActions[2].action).toEqual(PlayerActionType.BET);
        });

        it("should have correct call values", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 3);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 4);

            // After blinds are posted, small blind acts first in preflop
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Deal cards
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.DEAL, 5);
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.RAISE, 6, TWO_TOKENS);

            const legalActions = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            expect(legalActions).toBeDefined();
        });
    });
});