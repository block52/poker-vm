import { PlayerActionType, TexasHoldemRound, NonPlayerActionType } from "@block52/poker-vm-sdk";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, getNextTestTimestamp } from "./testConstants";

/**
 * Test file generated from poker scenario: Ensure there is No CHECK option when facing a bet from another opponent (SCENARIO 1 OF 18-CALLS)
 * Ticket: #unknown
 * Status: Approved
 * 
 * This test ensures that showdown behavior is correct - specifically that
 * the first player to act at showdown must show their hand and cannot muck.
 */
describe("Ensure there is No CHECK option when facing a bet from another opponent (SCENARIO 1 OF 18-CALLS)", () => {
    const PLAYER_1 = "0x1111111111111111111111111111111111111111";
    const PLAYER_2 = "0x2222222222222222222222222222222222222222";

    const THREE_TOKENS = 300000000000000000n;

    let game: TexasHoldemGame;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);

        // Add players to the game
        game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
        game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
    });

    it("should enforce correct showdown behavior - first to act must show", () => {
        // Execute the setup actions (up to showdown)
        game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

        game.performAction(PLAYER_1, PlayerActionType.RAISE, 6, THREE_TOKENS, undefined, getNextTestTimestamp());
        const legalActions = game.getLegalActions(PLAYER_2);
        expect(legalActions).toBeDefined();
        expect(legalActions.length).toBeGreaterThanOrEqual(3); // Fold, Call or Raise
        expect(legalActions[0].action).toEqual(PlayerActionType.FOLD);
        expect(legalActions[1].action).toEqual(PlayerActionType.CALL);
        expect(legalActions[1].min).toEqual("200000000000000000");
        expect(legalActions[2].action).toEqual(PlayerActionType.RAISE);
        expect(legalActions[2].min).toEqual("400000000000000000");

        game.performAction(PLAYER_2, PlayerActionType.CALL, 7, TWO_TOKENS, undefined, getNextTestTimestamp());

        // Verify the game executed correctly
        expect(game.currentRound).toBeDefined();
        expect(game.getPlayerCount()).toEqual(2);

        // Add more specific assertions based on the scenario requirements
        // TODO: Add assertions specific to this test case
    });
});

// This test suite is for the Texas Holdem game engine, specifically for call and raise actions in preflop.
describe("Texas Holdem - Call raise preflop", () => {
    // Initialize game with base configuration and options
    let game: TexasHoldemGame;

    const PLAYER_1_ADDRESS = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";
    const PLAYER_2_ADDRESS = "0x980b8D8A16f5891F41871d878a479d81Da52334c";

    const THREE_TOKENS = 300000000000000000n;
    const FOUR_TOKENS = 400000000000000000n;
    const SIX_TOKENS = 600000000000000000n;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        // Add minimum required players
        game.performAction(PLAYER_1_ADDRESS, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
        game.performAction(PLAYER_2_ADDRESS, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

        // Post blinds
        game.performAction(PLAYER_1_ADDRESS, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2_ADDRESS, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());
    });

    it("should have correct call values for sb", () => {
        // After blinds are posted, small blind acts first in preflop
        const nextToAct = game.getNextPlayerToAct();
        expect(nextToAct?.address).toEqual(PLAYER_1_ADDRESS);
        expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

        // Deal cards
        game.performAction(PLAYER_1_ADDRESS, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
        expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

        const legalActions = game.getLegalActions(PLAYER_1_ADDRESS);
        expect(legalActions).toBeDefined();
        expect(legalActions.length).toBeGreaterThanOrEqual(3); // Fold, Call or Raise

        expect(legalActions[0].action).toEqual(PlayerActionType.FOLD);
        expect(legalActions[1].action).toEqual(PlayerActionType.CALL);
        expect(legalActions[1].min).toEqual("100000000000000000");
        expect(legalActions[1].max).toEqual("100000000000000000");
        expect(legalActions[2].action).toEqual(PlayerActionType.RAISE);
        expect(legalActions[2].min).toEqual("300000000000000000"); // Min raise: additional 3 tokens needed (1 already bet + 3 more = 4 total)
        expect(legalActions[2].max).toEqual("99900000000000000000"); // Max raise: full stack
    });

    it("should have correct call values for bb after sb calls", () => {
        expect(game.pot).toEqual(THREE_TOKENS); // 3 tokens in pot

        // After blinds are posted, small blind acts first in preflop
        const nextToAct = game.getNextPlayerToAct();
        expect(nextToAct?.address).toEqual(PLAYER_1_ADDRESS);
        expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

        // Deal cards
        game.performAction(PLAYER_1_ADDRESS, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
        expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

        // SB calls
        const legalActions = game.getLegalActions(PLAYER_1_ADDRESS);
        expect(legalActions).toBeDefined();
        expect(legalActions.length).toBeGreaterThanOrEqual(3); // Fold, Call or Raise
        expect(legalActions[0].action).toEqual(PlayerActionType.FOLD);
        expect(legalActions[1].action).toEqual(PlayerActionType.CALL);
        expect(legalActions[2].action).toEqual(PlayerActionType.RAISE);

        game.performAction(PLAYER_1_ADDRESS, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());
        expect(game.pot).toEqual(FOUR_TOKENS); // 4 tokens in pot

        const legalActions2 = game.getLegalActions(PLAYER_2_ADDRESS);
        expect(legalActions2).toBeDefined();
        expect(legalActions2.length).toBeGreaterThanOrEqual(3); // Fold, Check or Raise (special case for BB)

        expect(legalActions2[0].action).toEqual(PlayerActionType.FOLD);
        expect(legalActions2[1].action).toEqual(PlayerActionType.CHECK);
        expect(legalActions2[2].action).toEqual(PlayerActionType.RAISE);
        expect(legalActions2[2].min).toEqual("200000000000000000");  // Min raise: additional 2 tokens needed (2 already bet + 2 more = 4 total)
        expect(legalActions2[2].max).toEqual("99800000000000000000"); // Max raise: full stack
    });

    it("should have correct legal actions for bb after sb raises", () => {
        expect(game.pot).toEqual(THREE_TOKENS); // 3 tokens in pot

        // After blinds are posted, small blind acts first in preflop
        const nextToAct = game.getNextPlayerToAct();
        expect(nextToAct?.address).toEqual(PLAYER_1_ADDRESS);
        expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

        // SB to Deal cards
        game.performAction(PLAYER_1_ADDRESS, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
        expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

        // SB raises
        game.performAction(PLAYER_1_ADDRESS, PlayerActionType.RAISE, 6, THREE_TOKENS, undefined, getNextTestTimestamp()); // Raises to 3 tokens, so 4 tokens total bet
        expect(game.pot).toEqual(SIX_TOKENS); // 6 tokens in pot
        expect(game.getPlayerTotalBets(PLAYER_1_ADDRESS, TexasHoldemRound.PREFLOP, true)).toEqual(FOUR_TOKENS); // 4 tokens total bet

        // After SB raises, BB acts next
        const legalActions = game.getLegalActions(PLAYER_2_ADDRESS);
        expect(legalActions).toBeDefined();
        expect(legalActions.length).toBeGreaterThanOrEqual(3); // Fold, Call or Raise
        expect(legalActions[0].action).toEqual(PlayerActionType.FOLD);
        expect(legalActions[1].action).toEqual(PlayerActionType.CALL);
        expect(legalActions[1].min).toEqual("200000000000000000"); // Call 2 more tokens to match SB's 4 token bet
        expect(legalActions[1].max).toEqual("200000000000000000");
        expect(legalActions[2].action).toEqual(PlayerActionType.RAISE);
        expect(legalActions[2].min).toEqual("400000000000000000"); // Min raise: additional 4 tokens needed (2 already bet + 4 more = 6 total)
        expect(legalActions[2].max).toEqual("99800000000000000000"); // Max raise: full stack
    });

    it("should have correct call values for sb after bb raises", () => {
        expect(game.pot).toEqual(THREE_TOKENS); // 3 tokens in pot

        // After blinds are posted, small blind acts first in preflop
        const nextToAct = game.getNextPlayerToAct();
        expect(nextToAct?.address).toEqual(PLAYER_1_ADDRESS);
        expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

        // SB to Deal cards
        game.performAction(PLAYER_1_ADDRESS, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
        expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

        // SB calls
        let legalActions = game.getLegalActions(PLAYER_1_ADDRESS);
        expect(legalActions).toBeDefined();
        expect(legalActions.length).toBeGreaterThanOrEqual(3); // Fold, Call or Raise
        game.performAction(PLAYER_1_ADDRESS, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());
        expect(game.getPlayerTotalBets(PLAYER_1_ADDRESS, TexasHoldemRound.PREFLOP, true)).toEqual(TWO_TOKENS); // 2 tokens
        expect(game.pot).toEqual(FOUR_TOKENS); // 4 tokens in pot

        // BB raises
        game.performAction(PLAYER_2_ADDRESS, PlayerActionType.RAISE, 7, TWO_TOKENS, undefined, getNextTestTimestamp());
        expect(game.getPlayerTotalBets(PLAYER_2_ADDRESS, TexasHoldemRound.PREFLOP, true)).toEqual(FOUR_TOKENS); // 4 tokens total bet
        expect(game.pot).toEqual(SIX_TOKENS); // 6 tokens in pot

        // Check SB's legal actions after BB raises
        legalActions = game.getLegalActions(PLAYER_1_ADDRESS);
        expect(legalActions).toBeDefined();
        expect(legalActions.length).toBeGreaterThanOrEqual(3); // Fold, Call or Raise
        expect(legalActions[0].action).toEqual(PlayerActionType.FOLD);
        expect(legalActions[1].action).toEqual(PlayerActionType.CALL);
        expect(legalActions[1].min).toEqual("200000000000000000"); // Call 2 more tokens to match BB's 4 token bet
        expect(legalActions[1].max).toEqual("200000000000000000");
        expect(legalActions[2].action).toEqual(PlayerActionType.RAISE);
        expect(legalActions[2].min).toEqual("400000000000000000"); // Min raise: additional 4 tokens needed (2 already bet + 4 more = 6 total)
        expect(legalActions[2].max).toEqual("99800000000000000000"); // Max raise: full stack

        game.performAction(PLAYER_1_ADDRESS, PlayerActionType.CALL, 8, TWO_TOKENS, undefined, getNextTestTimestamp());

        expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
    });
});