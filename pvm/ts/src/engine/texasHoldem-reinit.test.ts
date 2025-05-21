import { NonPlayerActionType, PlayerActionType, TexasHoldemRound, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, mnemonic, seed } from "./testConstants";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in a heads-up scenario.
describe("Texas Holdem - Reinit", () => {
    describe("Reinit", () => {

        const SMALL_BLIND_PLAYER = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
        const BIG_BLIND_PLAYER = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";

        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            expect(game.handNumber).toEqual(1);
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS);
            game.performAction(BIG_BLIND_PLAYER, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS);

            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 5);

            // Both check
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CHECK, 6, 0n);
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CHECK, 7, 0n);

            // Both check
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CHECK, 8, 0n);
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CHECK, 9, 0n);

            // Both check
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CHECK, 10, 0n);
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CHECK, 11, 0n);

            // Both check
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CHECK, 12, 0n);
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CHECK, 13, 0n);

            // Both reveal cards
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SHOW, 14, 0n);
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.SHOW, 15, 0n);
        });

        it("should reinit after end", () => {
            // check positions and hand number
            expect(game.getPlayerCount()).toEqual(2);
            expect(game.dealerPosition).toEqual(9);
            expect(game.smallBlindPosition).toEqual(1);
            expect(game.bigBlindPosition).toEqual(2);
            expect(game.handNumber).toEqual(1);
            expect(game.getActionIndex()).toEqual(16); // 15 actions performed (1-15)

            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.NEW_HAND, 16, undefined, seed); // 16th action
            expect(game.handNumber).toEqual(2);
            expect(game.getActionIndex()).toEqual(17); // 0 actions performed (16 + 1 for next action index) New hand counts as an action
            
            const json = game.toJson();
            expect(json).toBeDefined();
            expect(json.actionCount).toEqual(16);

            expect(game.getPlayerCount()).toEqual(2);
            expect(game.exists(SMALL_BLIND_PLAYER)).toBeTruthy();
            expect(game.exists(BIG_BLIND_PLAYER)).toBeTruthy();
            expect(game.getPlayer(SMALL_BLIND_PLAYER)).toBeDefined();
            expect(game.getPlayer(BIG_BLIND_PLAYER)).toBeDefined();
            expect(game.dealerPosition).toEqual(1);
            expect(game.smallBlindPosition).toEqual(2);
            expect(game.bigBlindPosition).toEqual(1);
            expect(game.communityCards.length).toEqual(0);

            const player0 = game.getPlayer(SMALL_BLIND_PLAYER);
            expect(player0).toBeDefined();
            expect(player0?.holeCards).toBeUndefined();

            const player1 = game.getPlayer(BIG_BLIND_PLAYER);
            expect(player1).toBeDefined();
            expect(player1?.holeCards).toBeUndefined();
        });
    });
});
