import { NonPlayerActionType, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { getNextTestTimestamp, ONE_HUNDRED_TOKENS, baseGameConfig, gameOptions, mnemonic } from "./testConstants";

/**
 * Tests for issue #1381: Auto-runout remaining streets in heads-up all-in scenarios
 *
 * When a player goes all-in and the other player calls in heads-up:
 * - Game should automatically deal remaining community cards (turn, river)
 * - Game should proceed to SHOWDOWN without requiring manual CHECK actions
 * - Players should then be able to SHOW or MUCK their cards
 *
 * This also applies to multi-way all-in scenarios where all players are all-in.
 */
describe("Tests for issue 1381", () => {
    const PLAYER_1 = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";
    const PLAYER_2 = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
    const PLAYER_3 = "0x3333333333333333333333333333333333333333";

    let game: TexasHoldemGame;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
    });

    describe("Heads-up all-in scenarios", () => {
        it("should auto-runout all streets when all-in occurs on preflop", () => {
            // Setup: 2 players join and post blinds
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());

            // Deal cards
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toBe(TexasHoldemRound.PREFLOP);

            // Player 1 goes all-in
            const player1Chips = game.getPlayer(PLAYER_1).chips;
            game.performAction(PLAYER_1, PlayerActionType.ALL_IN, 6, player1Chips, undefined, getNextTestTimestamp());
            expect(game.getPlayer(PLAYER_1).status).toBe(PlayerStatus.ALL_IN);

            // Player 2 calls the all-in
            game.performAction(PLAYER_2, PlayerActionType.CALL, 7, player1Chips, undefined, getNextTestTimestamp());

            // EXPECTED: Game should auto-runout to SHOWDOWN
            // - Flop, turn, and river should be dealt automatically
            // - Game should be at SHOWDOWN round
            // - Community cards should have 5 cards (flop + turn + river)
            expect(game.currentRound).toBe(TexasHoldemRound.SHOWDOWN);
            expect(game.communityCards.length).toBe(5);
        });

        it("should auto-runout turn and river when all-in occurs on flop", () => {
            // Setup: 2 players join, post blinds, and deal to flop
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // Get to flop
            game.performAction(PLAYER_1, PlayerActionType.CALL, 6, 1000000000000000000n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toBe(TexasHoldemRound.FLOP);
            expect(game.communityCards.length).toBe(3);

            // Player 1 goes all-in on flop
            const player1Chips = game.getPlayer(PLAYER_1).chips;
            game.performAction(PLAYER_1, PlayerActionType.ALL_IN, 8, player1Chips, undefined, getNextTestTimestamp());

            // Player 2 calls
            game.performAction(PLAYER_2, PlayerActionType.CALL, 9, player1Chips, undefined, getNextTestTimestamp());

            // EXPECTED: Game should auto-runout turn and river
            expect(game.currentRound).toBe(TexasHoldemRound.SHOWDOWN);
            expect(game.communityCards.length).toBe(5); // Flop (3) + Turn (1) + River (1)
        });

        it("should auto-runout river only when all-in occurs on turn", () => {
            // Setup: Get to turn
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // Preflop
            game.performAction(PLAYER_1, PlayerActionType.CALL, 6, 1000000000000000000n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toBe(TexasHoldemRound.FLOP);

            // Flop
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 8, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toBe(TexasHoldemRound.TURN);
            expect(game.communityCards.length).toBe(4);

            // All-in on turn
            const player1Chips = game.getPlayer(PLAYER_1).chips;
            game.performAction(PLAYER_1, PlayerActionType.ALL_IN, 10, player1Chips, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CALL, 11, player1Chips, undefined, getNextTestTimestamp());

            // EXPECTED: Auto-runout river only
            expect(game.currentRound).toBe(TexasHoldemRound.SHOWDOWN);
            expect(game.communityCards.length).toBe(5); // Turn (4) + River (1)
        });

        it("should proceed to showdown immediately when all-in occurs on river", () => {
            // Setup: Get to river
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // Preflop
            game.performAction(PLAYER_1, PlayerActionType.CALL, 6, 1000000000000000000n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, undefined, undefined, getNextTestTimestamp());

            // Flop
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 8, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, undefined, undefined, getNextTestTimestamp());

            // Turn
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 10, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 11, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toBe(TexasHoldemRound.RIVER);
            expect(game.communityCards.length).toBe(5);

            // All-in on river
            const player1Chips = game.getPlayer(PLAYER_1).chips;
            game.performAction(PLAYER_1, PlayerActionType.ALL_IN, 12, player1Chips, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CALL, 13, player1Chips, undefined, getNextTestTimestamp());

            // EXPECTED: Proceed to showdown (no more cards to deal)
            expect(game.currentRound).toBe(TexasHoldemRound.SHOWDOWN);
            expect(game.communityCards.length).toBe(5); // All 5 already dealt
        });

        it("should allow players to SHOW or MUCK after auto-runout", () => {
            // Setup: All-in on flop scenario
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.CALL, 6, 1000000000000000000n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, undefined, undefined, getNextTestTimestamp());

            // All-in on flop
            const player1Chips = game.getPlayer(PLAYER_1).chips;
            game.performAction(PLAYER_1, PlayerActionType.ALL_IN, 8, player1Chips, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CALL, 9, player1Chips, undefined, getNextTestTimestamp());
            expect(game.currentRound).toBe(TexasHoldemRound.SHOWDOWN);

            // EXPECTED: Players should be able to SHOW their cards
            const player1 = game.getPlayer(PLAYER_1);
            const player2 = game.getPlayer(PLAYER_2);

            // Verify players have hole cards
            expect(player1.holeCards).toBeDefined();
            expect(player1.holeCards?.length).toBe(2);
            expect(player2.holeCards).toBeDefined();
            expect(player2.holeCards?.length).toBe(2);

            // Verify players are in correct status for showdown
            expect([PlayerStatus.ALL_IN, PlayerStatus.ACTIVE]).toContain(player1.status);
            expect([PlayerStatus.ALL_IN, PlayerStatus.ACTIVE]).toContain(player2.status);

            // Players should be able to perform SHOW action
            game.performAction(PLAYER_1, PlayerActionType.SHOW, 10, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.SHOW, 11, undefined, undefined, getNextTestTimestamp());

            // After both show, game should advance to END
            expect(game.currentRound).toBe(TexasHoldemRound.END);
        });

        it("should NOT auto-runout when player folds instead of calling all-in", () => {
            // Setup
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.CALL, 6, 1000000000000000000n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toBe(TexasHoldemRound.FLOP);

            // Player 1 goes all-in
            const player1Chips = game.getPlayer(PLAYER_1).chips;
            game.performAction(PLAYER_1, PlayerActionType.ALL_IN, 8, player1Chips, undefined, getNextTestTimestamp());

            // Player 2 folds
            game.performAction(PLAYER_2, PlayerActionType.FOLD, 9, undefined, undefined, getNextTestTimestamp());

            // EXPECTED: Game should end with Player 1 winning, no auto-runout
            // When one player folds, the other wins immediately
            expect([TexasHoldemRound.END, TexasHoldemRound.SHOWDOWN]).toContain(game.currentRound);
        });
    });

    describe("Multi-way (3+ players) all-in scenarios", () => {
        it("should auto-runout when all 3 players go all-in on flop", () => {
            // Setup: 3 players join
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());

            // Blinds
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 5, undefined, undefined, getNextTestTimestamp());

            // Deal
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 6, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toBe(TexasHoldemRound.PREFLOP);

            // Get to flop
            game.performAction(PLAYER_3, PlayerActionType.CALL, 7, 2000000000000000000n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.CALL, 8, 1000000000000000000n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toBe(TexasHoldemRound.FLOP);
            expect(game.communityCards.length).toBe(3);

            // All 3 players go all-in on flop
            const player1Chips = game.getPlayer(PLAYER_1).chips;
            game.performAction(PLAYER_1, PlayerActionType.ALL_IN, 10, player1Chips, undefined, getNextTestTimestamp());

            const player2Chips = game.getPlayer(PLAYER_2).chips;
            game.performAction(PLAYER_2, PlayerActionType.ALL_IN, 11, player2Chips, undefined, getNextTestTimestamp());

            const player3Chips = game.getPlayer(PLAYER_3).chips;
            game.performAction(PLAYER_3, PlayerActionType.CALL, 12, player3Chips, undefined, getNextTestTimestamp());

            // EXPECTED: All players all-in, should auto-runout turn and river
            expect(game.currentRound).toBe(TexasHoldemRound.SHOWDOWN);
            expect(game.communityCards.length).toBe(5);

            // Verify all 3 players are all-in
            expect(game.getPlayer(PLAYER_1).status).toBe(PlayerStatus.ALL_IN);
            expect(game.getPlayer(PLAYER_2).status).toBe(PlayerStatus.ALL_IN);
            expect(game.getPlayer(PLAYER_3).status).toBe(PlayerStatus.ALL_IN);
        });

        it("should auto-runout when 2 players all-in and 1 folds", () => {
            // Setup: 3 players
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());

            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 5, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 6, undefined, undefined, getNextTestTimestamp());

            // Get to flop
            game.performAction(PLAYER_3, PlayerActionType.CALL, 7, 2000000000000000000n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.CALL, 8, 1000000000000000000n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toBe(TexasHoldemRound.FLOP);

            // Player 1 all-in, Player 2 calls, Player 3 folds
            const player1Chips = game.getPlayer(PLAYER_1).chips;
            game.performAction(PLAYER_1, PlayerActionType.ALL_IN, 10, player1Chips, undefined, getNextTestTimestamp());

            game.performAction(PLAYER_2, PlayerActionType.CALL, 11, player1Chips, undefined, getNextTestTimestamp());

            game.performAction(PLAYER_3, PlayerActionType.FOLD, 12, undefined, undefined, getNextTestTimestamp());

            // EXPECTED: Heads-up between P1 (all-in) and P2, should auto-runout
            expect(game.currentRound).toBe(TexasHoldemRound.SHOWDOWN);
            expect(game.communityCards.length).toBe(5);
        });

        it("should handle 3 players with different stack sizes going all-in", () => {
            // This tests side pot scenarios with auto-runout
            // Player 1: 50 tokens (smallest stack)
            // Player 2: 75 tokens (medium stack)
            // Player 3: 100 tokens (largest stack)

            const FIFTY_TOKENS = 50000000000000000000n;
            const SEVENTY_FIVE_TOKENS = 75000000000000000000n;

            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, FIFTY_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, SEVENTY_FIVE_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());

            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 5, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 6, undefined, undefined, getNextTestTimestamp());

            // All players go all-in preflop
            const p1Chips = game.getPlayer(PLAYER_1).chips;
            game.performAction(PLAYER_1, PlayerActionType.ALL_IN, 7, p1Chips, undefined, getNextTestTimestamp());

            const p2Chips = game.getPlayer(PLAYER_2).chips;
            game.performAction(PLAYER_2, PlayerActionType.ALL_IN, 8, p2Chips, undefined, getNextTestTimestamp());

            const p3Chips = game.getPlayer(PLAYER_3).chips;
            game.performAction(PLAYER_3, PlayerActionType.CALL, 9, p3Chips, undefined, getNextTestTimestamp());

            // EXPECTED: All-in with side pots, should auto-runout all streets
            expect(game.currentRound).toBe(TexasHoldemRound.SHOWDOWN);
            expect(game.communityCards.length).toBe(5);

            // Verify all players are all-in
            expect(game.getPlayer(PLAYER_1).status).toBe(PlayerStatus.ALL_IN);
            expect(game.getPlayer(PLAYER_2).status).toBe(PlayerStatus.ALL_IN);
            expect(game.getPlayer(PLAYER_3).status).toBe(PlayerStatus.ALL_IN);
        });
    });

    describe("Edge cases and safeguards", () => {
        it("should not enter infinite loop with safety counter", () => {
            // This test ensures the while loop has proper exit conditions
            // Even if there's a bug, it shouldn't hang forever

            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // All-in preflop
            const p1Chips = game.getPlayer(PLAYER_1).chips;
            game.performAction(PLAYER_1, PlayerActionType.ALL_IN, 6, p1Chips, undefined, getNextTestTimestamp());

            // This test should complete without hanging
            // The while loop should exit after dealing all streets
            const startTime = Date.now();
            game.performAction(PLAYER_2, PlayerActionType.CALL, 7, p1Chips, undefined, getNextTestTimestamp());
            const endTime = Date.now();

            // EXPECTED: Should complete quickly (< 100ms)
            expect(endTime - startTime).toBeLessThan(100);
            expect(game.currentRound).toBe(TexasHoldemRound.SHOWDOWN);
        });

        it("should handle normal betting without triggering auto-runout", () => {
            // Verify auto-runout only happens in all-in scenarios
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // Normal betting (not all-in)
            game.performAction(PLAYER_1, PlayerActionType.CALL, 6, 1000000000000000000n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toBe(TexasHoldemRound.FLOP);

            // Bet and call on flop (not all-in)
            game.performAction(PLAYER_1, PlayerActionType.BET, 8, 5000000000000000000n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CALL, 9, 5000000000000000000n, undefined, getNextTestTimestamp());

            // EXPECTED: Should advance to TURN normally, not skip to SHOWDOWN
            expect(game.currentRound).toBe(TexasHoldemRound.TURN);
            expect(game.communityCards.length).toBe(4); // Flop (3) + Turn (1)

            // Continue normal betting on turn
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 10, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 11, undefined, undefined, getNextTestTimestamp());

            // Should advance to RIVER
            expect(game.currentRound).toBe(TexasHoldemRound.RIVER);
            expect(game.communityCards.length).toBe(5);
        });
    });
});
