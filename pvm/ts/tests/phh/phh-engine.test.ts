import { PhhRunner } from "../../src/testing/phhRunner";
import {
    PlayerActionType,
    NonPlayerActionType,
    TexasHoldemRound
} from "@block52/poker-vm-sdk";
import TexasHoldemGame from "../../src/engine/texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, getNextTestTimestamp, resetTestTimestamp } from "../../src/engine/testConstants";

describe("PHH Engine Integration", () => {
    const PLAYER_1 = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
    const PLAYER_2 = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";

    /**
     * Helper to create a simple heads-up game using the standard pattern
     */
    function createHeadsUpGame(): TexasHoldemGame {
        resetTestTimestamp();
        const game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
        game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
        return game;
    }

    describe("Simple action sequence", () => {
        it("should execute a simple preflop fold", () => {
            const game = createHeadsUpGame();

            // Post small blind
            expect(game.currentRound).toBe(TexasHoldemRound.ANTE);
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, game.getActionIndex(), ONE_TOKEN, undefined, getNextTestTimestamp());

            // Post big blind
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, game.getActionIndex(), TWO_TOKENS, undefined, getNextTestTimestamp());

            // Deal
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, game.getActionIndex(), undefined, undefined, getNextTestTimestamp());

            expect(game.currentRound).toBe(TexasHoldemRound.PREFLOP);

            // SB folds
            game.performAction(PLAYER_1, PlayerActionType.FOLD, game.getActionIndex(), undefined, undefined, getNextTestTimestamp());

            // Game should end - BB wins
            expect(game.currentRound).toBe(TexasHoldemRound.END);
        });

        it("should execute preflop call and check to flop", () => {
            const game = createHeadsUpGame();

            // Post blinds
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, game.getActionIndex(), ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, game.getActionIndex(), TWO_TOKENS, undefined, getNextTestTimestamp());

            // Deal
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, game.getActionIndex(), undefined, undefined, getNextTestTimestamp());

            expect(game.currentRound).toBe(TexasHoldemRound.PREFLOP);

            // SB calls (must match BB, so call amount is BB - SB = 1 token)
            game.performAction(PLAYER_1, PlayerActionType.CALL, game.getActionIndex(), ONE_TOKEN, undefined, getNextTestTimestamp());

            // BB checks
            game.performAction(PLAYER_2, PlayerActionType.CHECK, game.getActionIndex(), undefined, undefined, getNextTestTimestamp());

            // Should be on flop now
            expect(game.currentRound).toBe(TexasHoldemRound.FLOP);
            expect(game.communityCards.length).toBe(3);
        });

        it("should handle bet and call on flop", () => {
            const game = createHeadsUpGame();

            // Setup through to flop
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, game.getActionIndex(), ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, game.getActionIndex(), TWO_TOKENS, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, game.getActionIndex(), undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.CALL, game.getActionIndex(), ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, game.getActionIndex(), undefined, undefined, getNextTestTimestamp());

            expect(game.currentRound).toBe(TexasHoldemRound.FLOP);

            // SB bets (first to act post-flop in heads-up)
            game.performAction(PLAYER_1, PlayerActionType.BET, game.getActionIndex(), TWO_TOKENS, undefined, getNextTestTimestamp());

            // BB calls (call amount = bet amount since no prior bet in this round)
            game.performAction(PLAYER_2, PlayerActionType.CALL, game.getActionIndex(), TWO_TOKENS, undefined, getNextTestTimestamp());

            // Should be on turn
            expect(game.currentRound).toBe(TexasHoldemRound.TURN);
            expect(game.communityCards.length).toBe(4);
        });
    });

    describe("PHH format action mapping", () => {
        it("should map PHH cbr to BET when no current bet", () => {
            // After flop with no bets, cbr should be BET
            const game = createHeadsUpGame();

            // Get to flop
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, game.getActionIndex(), ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, game.getActionIndex(), TWO_TOKENS, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, game.getActionIndex(), undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.CALL, game.getActionIndex(), ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, game.getActionIndex(), undefined, undefined, getNextTestTimestamp());

            expect(game.currentRound).toBe(TexasHoldemRound.FLOP);

            // cbr on flop with no bet = BET (4 tokens = 4 * ONE_TOKEN)
            const FOUR_TOKENS = ONE_TOKEN * 4n;
            game.performAction(PLAYER_1, PlayerActionType.BET, game.getActionIndex(), FOUR_TOKENS, undefined, getNextTestTimestamp());

            // Pot should be: 2 + 2 (blinds) + 4 (bet) = 8 tokens
            expect(game.pot).toBe(ONE_TOKEN * 8n);
        });

        it("should map PHH cbr to RAISE when there is a current bet", () => {
            const game = createHeadsUpGame();

            // Get to preflop
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, game.getActionIndex(), ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, game.getActionIndex(), TWO_TOKENS, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, game.getActionIndex(), undefined, undefined, getNextTestTimestamp());

            expect(game.currentRound).toBe(TexasHoldemRound.PREFLOP);

            // cbr preflop with BB as current bet = RAISE to 6 tokens total
            // Engine expects ADDITIONAL amount, not total:
            // - SB has 1 token already in
            // - To raise TO 6, SB needs to add 5 more (6 - 1 = 5)
            const FIVE_TOKENS = ONE_TOKEN * 5n;
            game.performAction(PLAYER_1, PlayerActionType.RAISE, game.getActionIndex(), FIVE_TOKENS, undefined, getNextTestTimestamp());

            // Pot should be: 6 (SB's total: 1 + 5) + 2 (BB) = 8 tokens
            expect(game.pot).toBe(ONE_TOKEN * 8n);
        });
    });

    describe("PHH Runner", () => {
        it("should reject non-NT variants", async () => {
            const runner = new PhhRunner();
            const phhContent = `
variant = "PO"
antes = [0, 0]
blinds_or_straddles = [100, 200]
min_bet = 200
starting_stacks = [10000, 10000]
players = ["P1", "P2"]
actions = []
`;
            const result = await runner.runHand(phhContent);

            expect(result.success).toBe(false);
            expect(result.error).toContain("Unsupported variant");
        });

        it("should create game from PHH metadata", async () => {
            const runner = new PhhRunner();
            const phhContent = `
variant = "NT"
antes = [0, 0]
blinds_or_straddles = [100, 200]
min_bet = 200
starting_stacks = [10000, 10000]
players = ["P1", "P2"]
actions = [
  "d dh p1 AcKc",
  "d dh p2 2h3h",
]
`;
            const result = await runner.runHand(phhContent);

            // Should succeed (deals are skipped as engine handles them)
            expect(result.hand.variant).toBe("NT");
            expect(result.hand.players).toEqual(["P1", "P2"]);
        });
    });
});
