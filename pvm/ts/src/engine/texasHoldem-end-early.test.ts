import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, getNextTestTimestamp } from "./testConstants";

describe("Texas Holdem - Hand ends early tests", () => {
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

        it("should end the hand if everyone else has folded", () => {
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Add a DEAL action to advance from ANTE to PREFLOP
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // Now we're in PREFLOP round, so CALL is a valid action
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.RAISE, 6, THREE_TOKENS, undefined, getNextTestTimestamp());

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(BIG_BLIND_PLAYER);

            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.FOLD, 7, 0n, undefined, getNextTestTimestamp());

            // Check that the game in show down, player can still show or muck but still win.
            expect(game.currentRound).toEqual(TexasHoldemRound.END);
            // const legalActions = game.getLegalActions(SMALL_BLIND_PLAYER);
            // expect(legalActions).toContainEqual(expect.objectContaining({
            //     action: PlayerActionType.SHOW
            // }));

            // expect(legalActions).toContainEqual(expect.objectContaining({
            //     action: PlayerActionType.MUCK
            // }));
        });
    });
});
