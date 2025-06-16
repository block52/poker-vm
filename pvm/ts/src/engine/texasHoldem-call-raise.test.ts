import { PlayerActionType, TexasHoldemRound, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TEN_TOKENS, TWO_TOKENS } from "./testConstants";

describe("Texas Holdem Game", () => {

    describe("Texas Holdem - Call raise preflop", () => {
        let game: TexasHoldemGame;

        const PLAYER_1_ADDRESS = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";
        const PLAYER_2_ADDRESS = "0x980b8D8A16f5891F41871d878a479d81Da52334c";

        const THREE_TOKENS = 300000000000000000n;
        const FOUR_TOKENS =  400000000000000000n;
        const SIX_TOKENS =   600000000000000000n;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            // Add minimum required players
            game.performAction(PLAYER_1_ADDRESS, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "1");
            game.performAction(PLAYER_2_ADDRESS, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "2");
        });

        it("should have correct call values for sb", () => {
            // Post blinds
            game.performAction(PLAYER_1_ADDRESS, PlayerActionType.SMALL_BLIND, 3);
            game.performAction(PLAYER_2_ADDRESS, PlayerActionType.BIG_BLIND, 4);

            // After blinds are posted, small blind acts first in preflop
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual(PLAYER_1_ADDRESS);
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Deal cards
            game.performAction(PLAYER_1_ADDRESS, NonPlayerActionType.DEAL, 5);
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
            
            const legalActions = game.getLegalActions(PLAYER_1_ADDRESS);
            expect(legalActions).toBeDefined();
            expect(legalActions.length).toEqual(3); // Fold, Call or Raise
            
            expect(legalActions[0].action).toEqual(PlayerActionType.FOLD);
            expect(legalActions[1].action).toEqual(PlayerActionType.CALL);
            expect(legalActions[1].min).toEqual("100000000000000000");
            expect(legalActions[1].max).toEqual("100000000000000000");
            expect(legalActions[2].action).toEqual(PlayerActionType.RAISE);
            expect(legalActions[2].min).toEqual("300000000000000000");
        });

        it("should have correct call values for bb after sb calls", () => {
            // Post blinds
            game.performAction(PLAYER_1_ADDRESS, PlayerActionType.SMALL_BLIND, 3);
            game.performAction(PLAYER_2_ADDRESS, PlayerActionType.BIG_BLIND, 4);

            expect(game.pot).toEqual(THREE_TOKENS); // 3 tokens in pot

            // After blinds are posted, small blind acts first in preflop
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual(PLAYER_1_ADDRESS);
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Deal cards
            game.performAction(PLAYER_1_ADDRESS, NonPlayerActionType.DEAL, 5);
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // SB calls
            game.performAction(PLAYER_1_ADDRESS, PlayerActionType.CALL, 6, ONE_TOKEN);
            expect(game.pot).toEqual(FOUR_TOKENS); // 4 tokens in pot

            const legalActions = game.getLegalActions(PLAYER_2_ADDRESS);
            expect(legalActions).toBeDefined();
            expect(legalActions.length).toEqual(3); // Fold, Check or Raise (special case for BB)

            expect(legalActions[0].action).toEqual(PlayerActionType.FOLD);
            expect(legalActions[1].action).toEqual(PlayerActionType.CHECK);
            expect(legalActions[2].action).toEqual(PlayerActionType.RAISE);
            expect(legalActions[2].min).toEqual("200000000000000000");
        });

        it("should have correct legal actions for bb after sb raises", () => {
            // Post blinds
            game.performAction(PLAYER_1_ADDRESS, PlayerActionType.SMALL_BLIND, 3); // Has 1 token in pot
            game.performAction(PLAYER_2_ADDRESS, PlayerActionType.BIG_BLIND, 4); // Has 2 tokens in pot

            expect(game.pot).toEqual(THREE_TOKENS); // 3 tokens in pot

            // After blinds are posted, small blind acts first in preflop
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual(PLAYER_1_ADDRESS);
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // SB to Deal cards
            game.performAction(PLAYER_1_ADDRESS, NonPlayerActionType.DEAL, 5);
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // SB raises
            game.performAction(PLAYER_1_ADDRESS, PlayerActionType.RAISE, 6, THREE_TOKENS); // Raises to 3 tokens, so 4 tokens in pot
            expect(game.getPlayerTotalBets(PLAYER_1_ADDRESS, TexasHoldemRound.PREFLOP, true)).toEqual(FOUR_TOKENS); // 4 tokens in pot

            // After SB raises, BB acts next
            const legalActions = game.getLegalActions(PLAYER_2_ADDRESS);
            expect(legalActions).toBeDefined();
            expect(legalActions.length).toEqual(3); // Fold, Call or Raise
            expect(legalActions[0].action).toEqual(PlayerActionType.FOLD);
            expect(legalActions[1].action).toEqual(PlayerActionType.CALL);
            expect(legalActions[1].min).toEqual("200000000000000000");
            expect(legalActions[1].max).toEqual("200000000000000000");
            expect(legalActions[2].action).toEqual(PlayerActionType.RAISE);
            expect(legalActions[2].min).toEqual("400000000000000000");
        });

        it.only("should have correct call values for sb after bb raises", () => {
            // Post blinds
            game.performAction(PLAYER_1_ADDRESS, PlayerActionType.SMALL_BLIND, 3);
            game.performAction(PLAYER_2_ADDRESS, PlayerActionType.BIG_BLIND, 4);

            expect(game.pot).toEqual(THREE_TOKENS); // 3 tokens in pot

            // After blinds are posted, small blind acts first in preflop
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual(PLAYER_1_ADDRESS);
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // SB to Deal cards
            game.performAction(PLAYER_1_ADDRESS, NonPlayerActionType.DEAL, 5);
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // SB calls
            const legalActionsSB = game.getLegalActions(PLAYER_1_ADDRESS);
            game.performAction(PLAYER_1_ADDRESS, PlayerActionType.CALL, 6, ONE_TOKEN);
            expect(game.pot).toEqual(FOUR_TOKENS); // 4 tokens in pot

            // BB raises
            game.performAction(PLAYER_2_ADDRESS, PlayerActionType.RAISE, 7, TWO_TOKENS);
            expect(game.getPlayerTotalBets(PLAYER_2_ADDRESS, TexasHoldemRound.PREFLOP, true)).toEqual(FOUR_TOKENS); // 4 tokens in pot
            expect(game.pot).toEqual(SIX_TOKENS); // 6 tokens in pot

            const legalActions = game.getLegalActions(PLAYER_1_ADDRESS);
            expect(legalActions).toBeDefined();

            game.performAction(PLAYER_1_ADDRESS, PlayerActionType.CALL, 8, TWO_TOKENS);

            // expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
        });
    });
});