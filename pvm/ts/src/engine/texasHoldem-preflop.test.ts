import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS } from "./testConstants";

// This test suite is for the Texas Holdem game engine, specifically for the Preflop phase in a heads-up game.
describe("Texas Holdem - Preflop - Heads Up", () => {
    describe("Preflop game states", () => {
        const SMALL_BLIND_PLAYER = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
        const BIG_BLIND_PLAYER = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";

        const THREE_TOKENS = 300000000000000000n;

        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS);
            game.performAction(BIG_BLIND_PLAYER, NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS);
        });

        it("should have the correct players pre flop", () => {
            expect(game.getPlayerCount()).toEqual(2);

            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeTruthy();
            expect(game.exists("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeTruthy();
            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
        });

        it("should have correct legal actions after raising the small blind", () => {
            // Use dynamic indices from the game state
            const sbIndex = game.getTurnIndex();
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, sbIndex, ONE_TOKEN);
            
            const bbIndex = game.getTurnIndex();
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, bbIndex, TWO_TOKENS);
            
            // Add a DEAL action to advance from ANTE to PREFLOP
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
            
            const dealIndex = game.getTurnIndex();
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, dealIndex);
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
            
            // Now we're in PREFLOP round, so CALL is a valid action
            const raiseIndex = game.getTurnIndex();
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.RAISE, raiseIndex, THREE_TOKENS);

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(BIG_BLIND_PLAYER);

            const legalActions = game.getLegalActions(BIG_BLIND_PLAYER);
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
        });
    });
});
