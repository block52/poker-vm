import { NonPlayerActionType, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
import TexasHoldemGame from "./texasHoldem";
import { getNextTestTimestamp, ONE_HUNDRED_TOKENS, baseGameConfig, gameOptions, mnemonic } from "./testConstants";

/**
 * Tests for issue #1414: Joining table that is already in a hand
 *
 * When sitting at a table that is already in a hand:
 * - Joining players state should be 'SITTING_OUT' (waiting) when they sit at the table
 * - When current hand finishes, 'SITTING_OUT' players state should change to 'ACTIVE'
 */
describe("Tests for issue 1414", () => {
    const PLAYER_1 = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac"; // Small blind
    const PLAYER_2 = "0x980b8D8A16f5891F41871d878a479d81Da52334c"; // Big blind
    const PLAYER_3 = "0x3333333333333333333333333333333333333333"; // Joins mid-hand

    let game: TexasHoldemGame;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
    });

    describe("Player joining mid-hand scenario", () => {
        it("should set player 3 to SITTING_OUT when joining after blinds are posted", () => {
            // Step 1: Player 1 and Player 2 join
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

            expect(game.getPlayer(PLAYER_1).status).toBe(PlayerStatus.ACTIVE);
            expect(game.getPlayer(PLAYER_2).status).toBe(PlayerStatus.ACTIVE);
            expect(game.currentRound).toBe(TexasHoldemRound.ANTE);

            // Step 2: Players post blinds
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());

            expect(game.currentRound).toBe(TexasHoldemRound.ANTE);

            // Step 3: Player 3 joins mid-hand (after blinds are posted)
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 5, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());

            // EXPECTED: Player 3 should be SITTING_OUT (waiting)
            // ACTUAL: Player 3 is likely ACTIVE (bug)
            const player3 = game.getPlayer(PLAYER_3);
            expect(player3.status).toBe(PlayerStatus.SITTING_OUT); // This should fail if bug exists
        });

        it("should NOT deal cards to player who joined mid-hand", () => {
            // Setup: Player 1 and 2 join and post blinds
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());

            // Player 3 joins mid-hand
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 5, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());

            // Deal cards
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 6, undefined, undefined, getNextTestTimestamp());

            // EXPECTED: Player 3 should NOT have cards
            // Players 1 and 2 should have cards
            const player1 = game.getPlayer(PLAYER_1);
            const player2 = game.getPlayer(PLAYER_2);
            const player3 = game.getPlayer(PLAYER_3);

            expect(player1.holeCards).toBeDefined();
            expect(player1.holeCards?.length).toBe(2);
            expect(player2.holeCards).toBeDefined();
            expect(player2.holeCards?.length).toBe(2);
            expect(player3.holeCards).toBeUndefined(); // This should fail if bug exists
        });

        it("should activate waiting player when new hand starts", () => {
            // Setup: Players 1 and 2 join and complete a hand
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());

            // Player 3 joins mid-hand
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 5, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());
            const player3 = game.getPlayer(PLAYER_3);

            // Verify player 3 is sitting out
            expect(player3.status).toBe(PlayerStatus.SITTING_OUT);

            // Deal and complete the hand
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 6, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toBe(TexasHoldemRound.PREFLOP);

            // Player 1 folds to end the hand quickly
            game.performAction(PLAYER_1, PlayerActionType.FOLD, 7, undefined, undefined, getNextTestTimestamp());

            // Should now be at END or SHOWDOWN
            const roundAfterFold = game.currentRound;
            expect([TexasHoldemRound.END, TexasHoldemRound.SHOWDOWN]).toContain(roundAfterFold);

            // Start a new hand
            game.performAction(PLAYER_1, NonPlayerActionType.NEW_HAND, 8, undefined, `deck=${mnemonic}`, getNextTestTimestamp());

            // EXPECTED: Player 3 should now be ACTIVE
            expect(player3.status).toBe(PlayerStatus.ACTIVE);
            expect(game.currentRound).toBe(TexasHoldemRound.ANTE);
        });

        it("should allow player who joined during ANTE to be ACTIVE immediately", () => {
            // Player 1 joins during ANTE
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());

            expect(game.currentRound).toBe(TexasHoldemRound.ANTE);
            expect(game.getPlayer(PLAYER_1).status).toBe(PlayerStatus.ACTIVE);

            // Player 2 also joins during ANTE
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

            expect(game.getPlayer(PLAYER_2).status).toBe(PlayerStatus.ACTIVE);
        });

        it("should set player to SITTING_OUT when joining during PREFLOP", () => {
            // Setup: Get to PREFLOP with 2 players
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            expect(game.currentRound).toBe(TexasHoldemRound.PREFLOP);

            // Player 3 joins during PREFLOP
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 6, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());

            // EXPECTED: Player 3 should be SITTING_OUT
            expect(game.getPlayer(PLAYER_3).status).toBe(PlayerStatus.SITTING_OUT);
        });

        it("should set player to SITTING_OUT when joining during FLOP", () => {
            // Setup: Get to FLOP with 2 players
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // Complete PREFLOP - SB calls (1 token to match BB), then BB checks
            game.performAction(PLAYER_1, PlayerActionType.CALL, 6, 1000000000000000000n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toBe(TexasHoldemRound.FLOP);

            // Player 3 joins during FLOP
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 8, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());

            // EXPECTED: Player 3 should be SITTING_OUT
            expect(game.getPlayer(PLAYER_3).status).toBe(PlayerStatus.SITTING_OUT);
        });
    });

    describe("Multiple players joining mid-hand", () => {
        it("should set all mid-hand joiners to SITTING_OUT", () => {
            const PLAYER_4 = "0x4444444444444444444444444444444444444444";

            // Setup: 2 players in hand
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());

            // Players 3 and 4 join mid-hand
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 5, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());
            game.performAction(PLAYER_4, NonPlayerActionType.JOIN, 6, ONE_HUNDRED_TOKENS, "seat=4", getNextTestTimestamp());

            // EXPECTED: Both should be SITTING_OUT
            expect(game.getPlayer(PLAYER_3).status).toBe(PlayerStatus.SITTING_OUT);
            expect(game.getPlayer(PLAYER_4).status).toBe(PlayerStatus.SITTING_OUT);
        });

        it("should activate all waiting players on new hand", () => {
            const PLAYER_4 = "0x4444444444444444444444444444444444444444";

            // Setup: 2 players complete a hand with 2 more joining mid-hand
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 5, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());
            game.performAction(PLAYER_4, NonPlayerActionType.JOIN, 6, ONE_HUNDRED_TOKENS, "seat=4", getNextTestTimestamp());

            // Complete the hand
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 7, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.FOLD, 8, undefined, undefined, getNextTestTimestamp());

            // Start new hand
            game.performAction(PLAYER_1, NonPlayerActionType.NEW_HAND, 9, undefined, `deck=${mnemonic}`, getNextTestTimestamp());

            // EXPECTED: All players should now be ACTIVE
            expect(game.getPlayer(PLAYER_1).status).toBe(PlayerStatus.ACTIVE);
            expect(game.getPlayer(PLAYER_2).status).toBe(PlayerStatus.ACTIVE);
            expect(game.getPlayer(PLAYER_3).status).toBe(PlayerStatus.ACTIVE);
            expect(game.getPlayer(PLAYER_4).status).toBe(PlayerStatus.ACTIVE);
        });
    });

    describe("Dealer manager should skip waiting players", () => {
        it("should skip SITTING_OUT player when determining next to act", () => {
            const PLAYER_4 = "0x4444444444444444444444444444444444444444";

            // Setup: 3 active players and 1 waiting player
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_4, NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=4", getNextTestTimestamp());

            // Post blinds
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 4, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 5, undefined, undefined, getNextTestTimestamp());

            // Player 3 joins mid-hand (should be SITTING_OUT)
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 6, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());
            expect(game.getPlayer(PLAYER_3).status).toBe(PlayerStatus.SITTING_OUT);

            // Deal cards
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 7, undefined, undefined, getNextTestTimestamp());

            // EXPECTED: Next to act should skip Player 3 (SITTING_OUT)
            // Order should be: Player 4 (UTG), Player 1 (SB), Player 2 (BB)
            // In preflop with 3+ players, player to left of BB acts first
            const nextPlayer = game.getNextPlayerToAct();
            expect(nextPlayer?.address).toBe(PLAYER_4); // Player 4 acts first (UTG)
        });

        it("should not include SITTING_OUT player in active player count", () => {
            // Setup: 2 active players
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());

            // Player 3 joins mid-hand
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 5, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());

            // Deal cards
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 6, undefined, undefined, getNextTestTimestamp());

            // EXPECTED: Only 2 active players (Player 3 is sitting out)
            const activePlayers = game.findActivePlayers();
            expect(activePlayers.length).toBe(2);
            expect(activePlayers.map(p => p.address)).toEqual([PLAYER_1, PLAYER_2]);
            expect(activePlayers.map(p => p.address)).not.toContain(PLAYER_3);
        });

        it("should deal correct number of cards when some players are SITTING_OUT", () => {
            const PLAYER_4 = "0x4444444444444444444444444444444444444444";

            // Setup: 2 active players
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());

            // Players 3 and 4 join mid-hand (both should be SITTING_OUT)
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 5, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());
            game.performAction(PLAYER_4, NonPlayerActionType.JOIN, 6, ONE_HUNDRED_TOKENS, "seat=4", getNextTestTimestamp());

            // Deal cards
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 7, undefined, undefined, getNextTestTimestamp());

            // EXPECTED: Only players 1 and 2 should have cards
            expect(game.getPlayer(PLAYER_1).holeCards?.length).toBe(2);
            expect(game.getPlayer(PLAYER_2).holeCards?.length).toBe(2);
            expect(game.getPlayer(PLAYER_3).holeCards).toBeUndefined();
            expect(game.getPlayer(PLAYER_4).holeCards).toBeUndefined();

            // Total cards dealt should be 4 (2 players × 2 cards)
            const totalCardsDealt = [PLAYER_1, PLAYER_2, PLAYER_3, PLAYER_4]
                .map(addr => game.getPlayer(addr).holeCards?.length || 0)
                .reduce((sum, count) => sum + count, 0);
            expect(totalCardsDealt).toBe(4);
        });

        it("should allow betting round to complete without waiting players", () => {
            // Setup: 2 active players
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());

            // Player 3 joins mid-hand
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 5, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());

            // Deal cards
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 6, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toBe(TexasHoldemRound.PREFLOP);

            // Complete preflop betting (only between players 1 and 2)
            game.performAction(PLAYER_1, PlayerActionType.CALL, 7, 1000000000000000000n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 8, 0n, undefined, getNextTestTimestamp());

            // EXPECTED: Round should advance to FLOP (Player 3 never needed to act)
            expect(game.currentRound).toBe(TexasHoldemRound.FLOP);
        });

        it("should correctly position dealer button with SITTING_OUT players", () => {
            const PLAYER_4 = "0x4444444444444444444444444444444444444444";

            // Setup: 4 players, seats 1, 2, 3, 4
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());
            game.performAction(PLAYER_4, NonPlayerActionType.JOIN, 4, ONE_HUNDRED_TOKENS, "seat=4", getNextTestTimestamp());

            // Post blinds with all 4 players
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 5, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 6, undefined, undefined, getNextTestTimestamp());

            const initialDealer = game.dealerPosition;
            expect(initialDealer).toBeDefined();

            // Deal and complete hand
            game.performAction(PLAYER_3, NonPlayerActionType.DEAL, 7, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_3, PlayerActionType.FOLD, 8, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_4, PlayerActionType.FOLD, 9, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.FOLD, 10, undefined, undefined, getNextTestTimestamp());

            // Start new hand
            game.performAction(PLAYER_1, NonPlayerActionType.NEW_HAND, 11, undefined, `deck=${mnemonic}`, getNextTestTimestamp());

            // EXPECTED: Dealer button should move to next seat
            const newDealer = game.dealerPosition;
            expect(newDealer).toBeDefined();
            expect(newDealer).not.toBe(initialDealer);
        });
    });
});
