import { NonPlayerActionType, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TEN_TOKENS, TWO_TOKENS } from "./testConstants";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in with 3 players.
describe("Texas Holdem - Ante - 3 Players", () => {
    describe("3 Players in Ante to Preflop", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction("0x1111111111111111111111111111111111111111", NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS);
            game.performAction("0x2222222222222222222222222222222222222222", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS);
            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS);
            game.performAction("0x4444444444444444444444444444444444444444", NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS);

            expect(game.getPlayerCount()).toEqual(3);
            // Expect player 3 to have the correct legal actions
            expect(game.getPlayer("0x1111111111111111111111111111111111111111")).toBeDefined();
            expect(game.getPlayer("0x2222222222222222222222222222222222222222")).toBeDefined();
            expect(game.getPlayer("0x3333333333333333333333333333333333333333")).toBeDefined();

            // Get next seat
            expect(game.findNextEmptySeat()).toEqual(4);

            // Post blinds
            game.performAction("0x1111111111111111111111111111111111111111", PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
            game.performAction("0x2222222222222222222222222222222222222222", PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);

            // Still be in ante
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
        });

        it("should have correct properties after the deal", () => {
            // Deal cards
            game.performAction("0x1111111111111111111111111111111111111111", NonPlayerActionType.DEAL, 5);
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // Expect player 3 to be next to act
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual("0x3333333333333333333333333333333333333333");
        });
    });
});
