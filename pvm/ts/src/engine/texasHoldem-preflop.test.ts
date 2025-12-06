import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, getNextTestTimestamp } from "./testConstants";

// This test suite is for the Texas Holdem game engine, specifically for the Preflop phase in a heads-up game.
describe("Texas Holdem - Preflop - Heads Up", () => {
    describe("Preflop game states", () => {
        const SMALL_BLIND_PLAYER = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
        const BIG_BLIND_PLAYER = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";

        const THREE_TOKENS = 300000000000000000n;

        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
        });

        it("should have the correct players pre flop", () => {
            expect(game.getPlayerCount()).toEqual(2);

            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeTruthy();
            expect(game.exists("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeTruthy();
            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
        });

        it("should have correct legal actions after calling the small blind", () => {
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
            
            // Add a DEAL action to advance from ANTE to PREFLOP
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // Now we're in PREFLOP round, so CALL is a valid action
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(BIG_BLIND_PLAYER);

            const legalActions = game.getLegalActions(BIG_BLIND_PLAYER);
            expect(legalActions.length).toEqual(3);
            expect(legalActions).toContainEqual(expect.objectContaining({
                action: PlayerActionType.FOLD
            }));

            expect(legalActions).toContainEqual(expect.objectContaining({
                action: PlayerActionType.CHECK
            }));

            expect(legalActions).toContainEqual(expect.objectContaining({
                action: PlayerActionType.RAISE
            }));
        });

        it("should have correct legal actions after raising the small blind", () => {
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
            
            // Add a DEAL action to advance from ANTE to PREFLOP
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            let legalActions = game.getLegalActions(SMALL_BLIND_PLAYER);
            expect(legalActions.length).toEqual(3); // Fold, Call, Raise
            
            // Now we're in PREFLOP round, so CALL is a valid action
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.RAISE, 6, THREE_TOKENS, undefined, getNextTestTimestamp());

            let nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(BIG_BLIND_PLAYER);

            legalActions = game.getLegalActions(BIG_BLIND_PLAYER);
            expect(legalActions.length).toEqual(3);
            expect(legalActions).toContainEqual(expect.objectContaining({
                action: PlayerActionType.CALL
            }));

            expect(legalActions).toContainEqual(expect.objectContaining({
                action: PlayerActionType.RAISE
            }));

            expect(legalActions).toContainEqual(expect.objectContaining({
                action: PlayerActionType.FOLD
            }));

            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CALL, 7, TWO_TOKENS, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);

            legalActions = game.getLegalActions(BIG_BLIND_PLAYER);
            nextToAct = game.getNextPlayerToAct();
        });
    });
});
