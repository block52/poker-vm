import { PlayerActionType, ActionDTO, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { calculatePotBetAmount } from "./calculatePotBetAmount";

describe("calculatePotBetAmount", () => {
    // Cosmos bech32 addresses (b52 prefix for Block52 chain)
    const PLAYER_1 = "b521qypqxpq9qcrsszg2pvxq6rs0zqg3yyc5z5tpwxqer";
    const PLAYER_2 = "b521qz4sdj8gfx9w9r8h8xvnkkl0xhucqhqv39gtr7";
    const PLAYER_3 = "b521q8h9jkl3mn4op5qr6st7uv8wx9yz0abc1def2gh";

    // Helper to create mock actions
    const createAction = (
        action: PlayerActionType,
        amount: string,
        round: TexasHoldemRound,
        playerId: string = PLAYER_1
    ): ActionDTO => ({
        playerId,
        action,
        amount,
        index: 0,
        round
    });

    describe("basic pot bet calculation", () => {
        it("should return pot + call amount when no previous bets/raises in round", () => {
            const result = calculatePotBetAmount({
                currentRound: TexasHoldemRound.FLOP,
                previousActions: [],
                callAmount: 0n,
                pot: 100_000_000n // 100 USDC
            });

            // With no HB, pot bet = CALL + HB + POT = 0 + 0 + 100M = 100M
            expect(result).toBe(100_000_000n);
        });

        it("should include highest bet in calculation", () => {
            const previousActions: ActionDTO[] = [
                createAction(PlayerActionType.BET, "50000000", TexasHoldemRound.FLOP) // 50 USDC bet
            ];

            const result = calculatePotBetAmount({
                currentRound: TexasHoldemRound.FLOP,
                previousActions,
                callAmount: 50_000_000n, // 50 USDC to call
                pot: 100_000_000n // 100 USDC pot
            });

            // Pot bet = CALL + HB + POT = 50M + 50M + 100M = 200M
            expect(result).toBe(200_000_000n);
        });

        it("should use highest raise amount when multiple raises exist", () => {
            const previousActions: ActionDTO[] = [
                createAction(PlayerActionType.BET, "20000000", TexasHoldemRound.FLOP, PLAYER_1),
                createAction(PlayerActionType.RAISE, "60000000", TexasHoldemRound.FLOP, PLAYER_2),
                createAction(PlayerActionType.RAISE, "150000000", TexasHoldemRound.FLOP, PLAYER_3)
            ];

            const result = calculatePotBetAmount({
                currentRound: TexasHoldemRound.FLOP,
                previousActions,
                callAmount: 150_000_000n, // 150 USDC to call the last raise
                pot: 300_000_000n // 300 USDC pot
            });

            // HB = 150M (highest raise), Pot bet = 150M + 150M + 300M = 600M
            expect(result).toBe(600_000_000n);
        });
    });

    describe("round filtering", () => {
        it("should only consider actions from the current round", () => {
            const previousActions: ActionDTO[] = [
                // Preflop actions should be ignored
                createAction(PlayerActionType.BET, "100000000", TexasHoldemRound.PREFLOP),
                createAction(PlayerActionType.RAISE, "300000000", TexasHoldemRound.PREFLOP),
                // Only this flop action should count
                createAction(PlayerActionType.BET, "50000000", TexasHoldemRound.FLOP)
            ];

            const result = calculatePotBetAmount({
                currentRound: TexasHoldemRound.FLOP,
                previousActions,
                callAmount: 50_000_000n,
                pot: 400_000_000n
            });

            // HB should be 50M (only from flop), not 300M from preflop
            // Pot bet = 50M + 50M + 400M = 500M
            expect(result).toBe(500_000_000n);
        });

        it("should work correctly for turn round", () => {
            const previousActions: ActionDTO[] = [
                createAction(PlayerActionType.BET, "100000000", TexasHoldemRound.FLOP),
                createAction(PlayerActionType.BET, "75000000", TexasHoldemRound.TURN)
            ];

            const result = calculatePotBetAmount({
                currentRound: TexasHoldemRound.TURN,
                previousActions,
                callAmount: 75_000_000n,
                pot: 500_000_000n
            });

            // HB from turn = 75M
            // Pot bet = 75M + 75M + 500M = 650M
            expect(result).toBe(650_000_000n);
        });

        it("should work correctly for river round", () => {
            const previousActions: ActionDTO[] = [
                createAction(PlayerActionType.BET, "200000000", TexasHoldemRound.RIVER)
            ];

            const result = calculatePotBetAmount({
                currentRound: TexasHoldemRound.RIVER,
                previousActions,
                callAmount: 200_000_000n,
                pot: 1_000_000_000n
            });

            // Pot bet = 200M + 200M + 1000M = 1400M
            expect(result).toBe(1_400_000_000n);
        });
    });

    describe("action type filtering", () => {
        it("should ignore CALL actions when calculating highest bet", () => {
            const previousActions: ActionDTO[] = [
                createAction(PlayerActionType.BET, "50000000", TexasHoldemRound.FLOP),
                createAction(PlayerActionType.CALL, "50000000", TexasHoldemRound.FLOP),
                createAction(PlayerActionType.CALL, "50000000", TexasHoldemRound.FLOP)
            ];

            const result = calculatePotBetAmount({
                currentRound: TexasHoldemRound.FLOP,
                previousActions,
                callAmount: 50_000_000n,
                pot: 200_000_000n
            });

            // HB should be 50M (the bet), calls don't count
            expect(result).toBe(300_000_000n);
        });

        it("should ignore FOLD and CHECK actions", () => {
            const previousActions: ActionDTO[] = [
                createAction(PlayerActionType.BET, "30000000", TexasHoldemRound.FLOP),
                createAction(PlayerActionType.FOLD, "0", TexasHoldemRound.FLOP),
                createAction(PlayerActionType.CHECK, "0", TexasHoldemRound.FLOP)
            ];

            const result = calculatePotBetAmount({
                currentRound: TexasHoldemRound.FLOP,
                previousActions,
                callAmount: 30_000_000n,
                pot: 100_000_000n
            });

            // HB = 30M
            expect(result).toBe(160_000_000n);
        });
    });

    describe("edge cases", () => {
        it("should handle empty previousActions array", () => {
            const result = calculatePotBetAmount({
                currentRound: TexasHoldemRound.PREFLOP,
                previousActions: [],
                callAmount: 20_000_000n, // big blind
                pot: 30_000_000n // SB + BB
            });

            // No HB, pot bet = 20M + 0 + 30M = 50M
            expect(result).toBe(50_000_000n);
        });

        it("should handle zero pot", () => {
            const result = calculatePotBetAmount({
                currentRound: TexasHoldemRound.FLOP,
                previousActions: [],
                callAmount: 0n,
                pot: 0n
            });

            expect(result).toBe(0n);
        });

        it("should handle very large amounts (high stakes)", () => {
            const previousActions: ActionDTO[] = [
                createAction(PlayerActionType.RAISE, "10000000000000", TexasHoldemRound.FLOP) // 10M USDC
            ];

            const result = calculatePotBetAmount({
                currentRound: TexasHoldemRound.FLOP,
                previousActions,
                callAmount: 10_000_000_000_000n,
                pot: 20_000_000_000_000n
            });

            // Pot bet = 10T + 10T + 20T = 40T
            expect(result).toBe(40_000_000_000_000n);
        });

        it("should handle actions with undefined amount", () => {
            const previousActions: ActionDTO[] = [
                { playerId: PLAYER_1, action: PlayerActionType.CHECK, amount: undefined, index: 0, round: TexasHoldemRound.FLOP },
                createAction(PlayerActionType.BET, "25000000", TexasHoldemRound.FLOP)
            ];

            const result = calculatePotBetAmount({
                currentRound: TexasHoldemRound.FLOP,
                previousActions,
                callAmount: 25_000_000n,
                pot: 50_000_000n
            });

            expect(result).toBe(100_000_000n);
        });

        it("should handle string amounts with no issues", () => {
            const previousActions: ActionDTO[] = [
                createAction(PlayerActionType.BET, "123456789", TexasHoldemRound.FLOP)
            ];

            const result = calculatePotBetAmount({
                currentRound: TexasHoldemRound.FLOP,
                previousActions,
                callAmount: 123_456_789n,
                pot: 500_000_000n
            });

            // 123456789 + 123456789 + 500000000 = 746913578
            expect(result).toBe(746_913_578n);
        });
    });

    describe("preflop scenarios", () => {
        it("should calculate pot bet for preflop with blinds posted", () => {
            const previousActions: ActionDTO[] = [
                createAction(PlayerActionType.SMALL_BLIND, "10000000", TexasHoldemRound.PREFLOP),
                createAction(PlayerActionType.BIG_BLIND, "20000000", TexasHoldemRound.PREFLOP)
            ];

            const result = calculatePotBetAmount({
                currentRound: TexasHoldemRound.PREFLOP,
                previousActions,
                callAmount: 20_000_000n, // call the BB
                pot: 30_000_000n // SB + BB
            });

            // Blinds don't count as BET/RAISE, so HB = 0
            // Pot bet = 20M + 0 + 30M = 50M
            expect(result).toBe(50_000_000n);
        });

        it("should handle preflop raise scenario", () => {
            const previousActions: ActionDTO[] = [
                createAction(PlayerActionType.SMALL_BLIND, "10000000", TexasHoldemRound.PREFLOP),
                createAction(PlayerActionType.BIG_BLIND, "20000000", TexasHoldemRound.PREFLOP),
                createAction(PlayerActionType.RAISE, "60000000", TexasHoldemRound.PREFLOP, PLAYER_3)
            ];

            const result = calculatePotBetAmount({
                currentRound: TexasHoldemRound.PREFLOP,
                previousActions,
                callAmount: 60_000_000n,
                pot: 90_000_000n // SB + BB + raise
            });

            // HB = 60M (the raise)
            // Pot bet = 60M + 60M + 90M = 210M
            expect(result).toBe(210_000_000n);
        });
    });
});
