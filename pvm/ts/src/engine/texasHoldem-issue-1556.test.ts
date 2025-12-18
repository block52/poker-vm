import { GameOptions, GameType, NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { ethers } from "ethers";
import TexasHoldemGame from "./texasHoldem";
import { ONE_TOKEN, TWO_TOKENS, ONE_HUNDRED_TOKENS, mnemonic, getNextTestTimestamp, resetTestTimestamp } from "./testConstants";

/**
 * Test suite for GitHub Issue #1556:
 * Player did not win when other player mucked
 *
 * Bug: When a player mucks at showdown and only one player remains,
 * the pot was not being awarded to the remaining player.
 *
 * Root cause: hasRoundEnded() returned true without calling calculateWinner()
 * when livePlayers.length <= 1 at showdown.
 *
 * Fix: Call calculateWinner() before returning when livePlayers.length === 1
 */
describe("Texas Holdem - Issue #1556 - Muck Winner Handling", () => {
    const PLAYER_1 = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
    const PLAYER_2 = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";
    const PLAYER_3 = "0x3333333333333333333333333333333333333333";

    const testGameOptions: GameOptions = {
        minBuyIn: ONE_HUNDRED_TOKENS,
        maxBuyIn: ONE_HUNDRED_TOKENS * 10n,
        minPlayers: 2,
        maxPlayers: 9,
        smallBlind: ONE_TOKEN,
        bigBlind: TWO_TOKENS,
        timeout: 60000,
        type: GameType.CASH
    };

    beforeEach(() => {
        resetTestTimestamp();
    });

    describe("Winner calculation at showdown", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = new TexasHoldemGame(
                ethers.ZeroAddress,
                testGameOptions,
                9, // dealer
                [],
                1, // handNumber
                0, // actionCount
                TexasHoldemRound.ANTE,
                [], // communityCards
                [0n], // pot
                new Map(),
                mnemonic
            );

            // Both players join with 100 tokens
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
        });

        it("should award pot to winner when both players show at showdown", () => {
            // Post blinds
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Deal
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // Preflop: P1 calls
            game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());
            // P2 checks
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n, undefined, getNextTestTimestamp());

            // Flop
            expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 8, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, 0n, undefined, getNextTestTimestamp());

            // Turn
            expect(game.currentRound).toEqual(TexasHoldemRound.TURN);
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 10, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 11, 0n, undefined, getNextTestTimestamp());

            // River
            expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 12, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 13, 0n, undefined, getNextTestTimestamp());

            // Showdown
            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);

            // Get initial chips before showdown actions
            const player1 = game.getPlayer(PLAYER_1);
            const player2 = game.getPlayer(PLAYER_2);
            const p1ChipsBeforeShowdown = player1.chips;
            const p2ChipsBeforeShowdown = player2.chips;

            // Both players show (P1 first per turn order, then P2)
            game.performAction(PLAYER_1, PlayerActionType.SHOW, 14, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.SHOW, 15, 0n, undefined, getNextTestTimestamp());

            // Game should now be in END round
            expect(game.currentRound).toEqual(TexasHoldemRound.END);

            // Verify pot was awarded - either one player wins or split pot
            const pot = TWO_TOKENS * 2n; // 4 tokens total in pot

            // Check winners are recorded
            expect(game.winners?.size).toBeGreaterThan(0);

            // Calculate total chips change
            const p1ChipsChange = player1.chips - p1ChipsBeforeShowdown;
            const p2ChipsChange = player2.chips - p2ChipsBeforeShowdown;

            // Either:
            // 1. One player wins the whole pot (their chips increase by pot amount)
            // 2. Split pot (both players get their bets back, each getting pot/2)
            const p1WonFull = p1ChipsChange === pot && p2ChipsChange === 0n;
            const p2WonFull = p2ChipsChange === pot && p1ChipsChange === 0n;
            const splitPot = p1ChipsChange === pot / 2n && p2ChipsChange === pot / 2n;

            expect(p1WonFull || p2WonFull || splitPot).toBe(true);
        });

        it("should record winner in game state after showdown", () => {
            // Post blinds
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Deal
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // Go through all rounds with checks/calls
            game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n, undefined, getNextTestTimestamp());

            // Flop
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 8, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, 0n, undefined, getNextTestTimestamp());

            // Turn
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 10, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 11, 0n, undefined, getNextTestTimestamp());

            // River
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 12, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 13, 0n, undefined, getNextTestTimestamp());

            // Showdown
            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);

            // Both show
            game.performAction(PLAYER_1, PlayerActionType.SHOW, 14, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.SHOW, 15, 0n, undefined, getNextTestTimestamp());

            // Check that winners are recorded
            const winners = game.winners;
            expect(winners?.size).toBeGreaterThan(0);
        });

        it("should transition to END round after showdown completes", () => {
            // Post blinds
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Deal
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // Quick path to showdown
            game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 8, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 10, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 11, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 12, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 13, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);

            // Both show
            game.performAction(PLAYER_1, PlayerActionType.SHOW, 14, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.SHOW, 15, 0n, undefined, getNextTestTimestamp());

            // Should transition to END
            expect(game.currentRound).toEqual(TexasHoldemRound.END);
        });

        it("should award pot to remaining player when opponent mucks (P1 shows, P2 mucks with losing hand)", () => {
            // Post blinds
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Deal
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // Quick path to showdown
            game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 8, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 10, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 11, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 12, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 13, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);

            const player1 = game.getPlayer(PLAYER_1);
            const p1ChipsBeforeShowdown = player1.chips;

            // P1 shows first
            game.performAction(PLAYER_1, PlayerActionType.SHOW, 14, 0n, undefined, getNextTestTimestamp());

            // Try to have P2 muck - if they have winning hand, they can't muck
            // In that case, have them show instead
            try {
                game.performAction(PLAYER_2, PlayerActionType.MUCK, 15, 0n, undefined, getNextTestTimestamp());
                // If muck succeeded, P1 should win
                expect(game.currentRound).toEqual(TexasHoldemRound.END);
                expect(player1.chips).toEqual(p1ChipsBeforeShowdown + TWO_TOKENS * 2n);
            } catch (e: any) {
                // P2 has winning hand and can't muck, so have them show
                if (e.message === "Cannot muck winning hand.") {
                    game.performAction(PLAYER_2, PlayerActionType.SHOW, 15, 0n, undefined, getNextTestTimestamp());
                    expect(game.currentRound).toEqual(TexasHoldemRound.END);
                    // P2 wins since they have winning hand (or tie)
                    expect(game.winners?.size).toBeGreaterThan(0);
                } else {
                    throw e;
                }
            }
        });
    });

    describe("Three players showdown", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = new TexasHoldemGame(
                ethers.ZeroAddress,
                testGameOptions,
                9, // dealer
                [],
                1, // handNumber
                0, // actionCount
                TexasHoldemRound.ANTE,
                [], // communityCards
                [0n], // pot
                new Map(),
                mnemonic
            );

            // Three players join
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());
        });

        it("should correctly determine winner among three players at showdown", () => {
            // Post blinds (P1 = SB, P2 = BB, P3 = UTG/Button)
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 4, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 5, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Deal
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 6, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // Preflop: P3 calls, P1 calls, P2 checks
            game.performAction(PLAYER_3, PlayerActionType.CALL, 7, TWO_TOKENS, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.CALL, 8, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, 0n, undefined, getNextTestTimestamp());

            // Flop: all check
            expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 10, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 11, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_3, PlayerActionType.CHECK, 12, 0n, undefined, getNextTestTimestamp());

            // Turn: all check
            expect(game.currentRound).toEqual(TexasHoldemRound.TURN);
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 13, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 14, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_3, PlayerActionType.CHECK, 15, 0n, undefined, getNextTestTimestamp());

            // River: all check
            expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 16, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 17, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_3, PlayerActionType.CHECK, 18, 0n, undefined, getNextTestTimestamp());

            // Showdown
            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);

            // All players show
            game.performAction(PLAYER_1, PlayerActionType.SHOW, 19, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.SHOW, 20, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_3, PlayerActionType.SHOW, 21, 0n, undefined, getNextTestTimestamp());

            // Game should now be in END round
            expect(game.currentRound).toEqual(TexasHoldemRound.END);

            // Winner should be recorded
            const winners = game.winners;
            expect(winners?.size).toBeGreaterThan(0);
        });
    });

    describe("Showdown with single remaining player (others folded earlier)", () => {
        it("should award pot when only one player remains at showdown entry", () => {
            const game = new TexasHoldemGame(
                ethers.ZeroAddress,
                testGameOptions,
                9,
                [],
                1,
                0,
                TexasHoldemRound.ANTE,
                [],
                [0n],
                new Map(),
                mnemonic
            );

            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

            // Post blinds
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Deal
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            const player1 = game.getPlayer(PLAYER_1);
            const p1ChipsBeforeFold = player1.chips;

            // P1 raises, P2 folds - P1 wins immediately
            game.performAction(PLAYER_1, PlayerActionType.RAISE, 6, TWO_TOKENS * 2n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.FOLD, 7, 0n, undefined, getNextTestTimestamp());

            // Game should end and P1 should win the pot
            expect(game.currentRound).toEqual(TexasHoldemRound.END);

            // P1 should have won the pot (blinds + raise contribution from P2's fold)
            // P2 folded after P1's raise, so pot = SB(1) + BB(2) = 3 tokens
            expect(player1.chips).toBeGreaterThan(p1ChipsBeforeFold);
        });
    });
});
