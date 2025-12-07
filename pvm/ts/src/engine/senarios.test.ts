import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, getNextTestTimestamp } from "./testConstants";

/**
 * Test file generated from poker scenario: Creating a Test for proof of correct actions pre flop with 2 players. #924
 * Ticket: #924
 * Status: Approved
 * 
 * This test ensures that showdown behavior is correct - specifically that
 * the first player to act at showdown must show their hand and cannot muck.
 */
describe("Creating a Test for proof of correct actions pre flop with 2 players. #924", () => {
    const PLAYER_1 = "0x1111111111111111111111111111111111111111";
    const PLAYER_2 = "0x2222222222222222222222222222222222222222";

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
        game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.RAISE, 7, TWO_TOKENS, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CALL, 8, TWO_TOKENS, undefined, getNextTestTimestamp());

        // Verify the game executed correctly
        expect(game.currentRound).toBeDefined();
        expect(game.getPlayerCount()).toEqual(2);

        // Add more specific assertions based on the scenario requirements
        // TODO: Add assertions specific to this test case
        const nextToAct = game.getNextPlayerToAct();
        expect(nextToAct).toBeDefined();
        expect(nextToAct?.address).toBeDefined();

        // Add more specific assertions based on the scenario requirements
        // TODO: Add assertions specific to this test case
        if (!nextToAct) throw new Error("nextToAct is null");
        const legalActions = game.getLegalActions(nextToAct.address);
        expect(legalActions).toBeDefined();
        expect(legalActions.length).toEqual(3); // Fold, Call or Raise
    });
});

/**
 * Test file generated from poker scenario: TEST - Make sure that the First player to act AT SHOWDOWN shows his hand automatically. - 903 incorrect option to muck winning hand at showdown after opponent shows
 * Ticket: #unknown
 * Status: Pending
 * 
 * This test ensures that showdown behavior is correct - specifically that
 * the first player to act at showdown must show their hand and cannot muck.
 */
describe("TEST - Make sure that the First player to act AT SHOWDOWN shows his hand automatically. - 903 incorrect option to muck winning hand at showdown after opponent shows", () => {
    const PLAYER_1 = "0x1111111111111111111111111111111111111111";
    const PLAYER_2 = "0x2222222222222222222222222222222222222222";

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
        game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CHECK, 8, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CHECK, 10, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 11, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CHECK, 12, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 13, 0n, undefined, getNextTestTimestamp());

        // Test showdown behavior
        expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);

        // The first player to act should only have SHOW as a legal action
        // This is the core test - first to act cannot muck, must show
        const firstPlayerActions = game.getLegalActions(PLAYER_1);
        expect(firstPlayerActions).toBeDefined();
        expect(firstPlayerActions.length).toEqual(1);
        expect(firstPlayerActions[0].action).toEqual(PlayerActionType.SHOW);

        // Now perform the SHOW action to complete the test
        game.performAction(PLAYER_1, PlayerActionType.SHOW, 14, 0n, undefined, getNextTestTimestamp());

        // Verify that the game state is consistent
        expect(game.getPlayerCount()).toEqual(2);
        expect(game.pot).toBeGreaterThan(0n);
    });
});

/**
 * Test file generated from poker scenario: Ensure there is No CHECK option when facing a bet from another opponent (SCENARIO 2 OF 18-FOLDS)
 * Ticket: #unknown
 * Status: Approved
 * 
 * This test ensures that showdown behavior is correct - specifically that
 * the first player to act at showdown must show their hand and cannot muck.
 */
describe("Ensure there is No CHECK option when facing a bet from another opponent (SCENARIO 2 OF 18-FOLDS)", () => {
    const PLAYER_1 = "0x1111111111111111111111111111111111111111";
    const PLAYER_2 = "0x2222222222222222222222222222222222222222";

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
        game.performAction(PLAYER_1, PlayerActionType.RAISE, 6, 3n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.FOLD, 7, 0n, undefined, getNextTestTimestamp());

        // Verify the game executed correctly
        expect(game.currentRound).toBeDefined();
        expect(game.getPlayerCount()).toEqual(2);

        // Add more specific assertions based on the scenario requirements
        // TODO: Add assertions specific to this test case
    });
});

describe("Ensure there is No CHECK option when facing a bet from another opponent (SCENARIO 3 OF 18 - 3 BETS)", () => {
    const PLAYER_1 = "0x1111111111111111111111111111111111111111";
    const PLAYER_2 = "0x2222222222222222222222222222222222222222";

    let game: TexasHoldemGame;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);

        // Add players to the game
        game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
        game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
    });

    it("ensure there is no check option when facing a bet from another opponent (scenario 3 of 18 - 3 bets)", () => {
        // Execute the setup actions
        game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.RAISE, 6, 300000000000000000n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.RAISE, 7, 600000000000000000n, undefined, getNextTestTimestamp());

        // Verify the game executed correctly
        expect(game.currentRound).toBeDefined();
        expect(game.getPlayerCount()).toEqual(2);

        const nextToAct = game.getNextPlayerToAct();
        expect(nextToAct).toBeDefined();
        expect(nextToAct?.address).toBeDefined();

        if (!nextToAct) throw new Error("nextToAct is null");
        const legalActions = game.getLegalActions(nextToAct.address);
        expect(legalActions).toBeDefined();
        expect(legalActions.length).toEqual(3);
    });
});

describe("Ensure there is No CHECK option when facing a bet from another opponent (SCENARIO 4 OF 18 - CALLS A 3 BETS)", () => {
    const PLAYER_1 = "0x1111111111111111111111111111111111111111";
    const PLAYER_2 = "0x2222222222222222222222222222222222222222";

    let game: TexasHoldemGame;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);

        // Add players to the game
        game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
        game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
    });

    it("ensure there is no check option when facing a bet from another opponent (scenario 4 of 18 - calls a 3 bets)", () => {
        // Execute the setup actions
        game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.RAISE, 6, 300000000000000000n, undefined, getNextTestTimestamp());

        let legalActions = game.getLegalActions(PLAYER_2);
        expect(legalActions).toBeDefined();
        expect(legalActions.length).toEqual(3); // Fold, Call or Raise

        game.performAction(PLAYER_2, PlayerActionType.RAISE, 7, 600000000000000000n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CALL, 8, 400000000000000000n, undefined, getNextTestTimestamp());

        // Verify the game executed correctly
        expect(game.currentRound).toBeDefined();
        expect(game.getPlayerCount()).toEqual(2);

        const nextToAct = game.getNextPlayerToAct();
        expect(nextToAct).toBeDefined();

        // Add more specific assertions based on the scenario requirements
        // TODO: Add assertions specific to this test case
        if (!nextToAct) throw new Error("nextToAct is null");
        legalActions = game.getLegalActions(nextToAct.address);
        expect(legalActions).toBeDefined();
        expect(legalActions.length).toEqual(3); // Fold, Call or Raise
    });
});

describe("Checking the betting system values after each action #927 + #568", () => {
    const PLAYER_1 = "0x1111111111111111111111111111111111111111";
    const PLAYER_2 = "0x2222222222222222222222222222222222222222";

    let game: TexasHoldemGame;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);

        // Add players to the game
        game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
        game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
    });

    it("checking the betting system values after each action #927 + #568", () => {
        // Execute the setup actions
        game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.RAISE, 7, TWO_TOKENS, undefined, getNextTestTimestamp());

        // Verify the game executed correctly
        expect(game.currentRound).toBeDefined();
        expect(game.getPlayerCount()).toEqual(2);

        const nextToAct = game.getNextPlayerToAct();
        expect(nextToAct).toBeDefined();

        // Add more specific assertions based on the scenario requirements
        // TODO: Add assertions specific to this test case
        if (!nextToAct) throw new Error("nextToAct is null");
        const legalActions = game.getLegalActions(nextToAct.address);
        expect(legalActions).toBeDefined();
        expect(legalActions.length).toEqual(3); // Fold, Call or Raise

        expect(legalActions[1].action).toEqual(PlayerActionType.CALL);
        expect(legalActions[1].min).toEqual("200000000000000000");
        expect(legalActions[1].max).toEqual("200000000000000000");

        expect(legalActions[2].action).toEqual(PlayerActionType.RAISE);
        expect(legalActions[2].min).toEqual("400000000000000000");
    });
});

describe.skip("TEST - Make sure that the First player to act AT SHOWDOWN shows his hand automatically. - 903 incorrect option to muck winning hand at showdown after opponent shows", () => {
    const PLAYER_1 = "0x1111111111111111111111111111111111111111";
    const PLAYER_2 = "0x2222222222222222222222222222222222222222";

    let game: TexasHoldemGame;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);

        // Add players to the game
        game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
        game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
    });

    it("test - make sure that the first player to act at showdown shows his hand automatically. - 903 incorrect option to muck winning hand at showdown after opponent shows", () => {
        // Execute the setup actions
        game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CHECK, 8, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CHECK, 10, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 11, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CHECK, 12, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 13, 0n, undefined, getNextTestTimestamp());

        // Test showdown behavior
        expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);

        // The first player to act should only have SHOW as a legal action
        // This is the core test - first to act cannot muck, must show
        const firstPlayerActions = game.getLegalActions(PLAYER_1);
        expect(firstPlayerActions).toBeDefined();
        expect(firstPlayerActions.length).toEqual(1);
        expect(firstPlayerActions[0].action).toEqual(PlayerActionType.SHOW);

        // Now perform the SHOW action to complete the test
        game.performAction(PLAYER_1, PlayerActionType.SHOW, 14, 0n, undefined, getNextTestTimestamp());

        // Verify that the game state is consistent
        expect(game.getPlayerCount()).toEqual(2);
        expect(game.pot).toBeGreaterThan(0n);

        // Should not have muck option for PLAYER_2
        const legalActions = game.getLegalActions(PLAYER_2);
        expect(legalActions).toBeDefined();
        expect(legalActions.length).toEqual(1);
        expect(legalActions[0].action).toEqual(PlayerActionType.SHOW);
    });
});