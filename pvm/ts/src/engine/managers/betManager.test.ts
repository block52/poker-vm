import { BetManager } from "./betManager";
import { Turn } from "../types";
import { PlayerActionType } from "@bitcoinbrisbane/block52";

describe("Bet Manager Tests", () => {
    const mockGame = {
        bigBlind: 20n
    };

    const turns: Turn[] = [
        {
            playerId: "0x1234567890123456789012345678901234567890",
            action: PlayerActionType.BET,
            amount: 100n,
            index: 1
        },
        {
            playerId: "0x0987654321098765432109876543210987654321",
            action: PlayerActionType.CALL,
            amount: 100n,
            index: 2
        },
        {
            playerId: "0x1234567890123456789012345678901234567890",
            action: PlayerActionType.RAISE,
            amount: 200n,
            index: 3
        }
    ];

    describe("Basic BetManager functionality", () => {
        it("should have correct function in ante round", () => {
            const turns: Turn[] = [
                {
                    playerId: "0x1234567890123456789012345678901234567890",
                    action: PlayerActionType.SMALL_BLIND,
                    amount: 10n,
                    index: 1
                },
                {
                    playerId: "0x0987654321098765432109876543210987654321",
                    action: PlayerActionType.BIG_BLIND,
                    amount: 20n,
                    index: 2
                }
            ];

            const betManager = new BetManager(turns, mockGame);

            expect(betManager.count()).toBe(2);
            expect(betManager.current()).toBe(20n);
            expect(betManager.getLargestBet()).toBe(20n);
            expect(betManager.getLastAggressor()).toBe(20n);
        });

        it("should handle call after blinds correctly", () => {
            const turns: Turn[] = [
                {
                    playerId: "0x1234567890123456789012345678901234567890",
                    action: PlayerActionType.SMALL_BLIND,
                    amount: 10n,
                    index: 1
                },
                {
                    playerId: "0x0987654321098765432109876543210987654321",
                    action: PlayerActionType.BIG_BLIND,
                    amount: 20n,
                    index: 2
                },
                {
                    playerId: "0x1234567890123456789012345678901234567890",
                    action: PlayerActionType.CALL,
                    amount: 10n,
                    index: 3
                }
            ];

            const betManager = new BetManager(turns, mockGame);

            expect(betManager.current()).toBe(20n);
            expect(betManager.getLargestBet()).toBe(20n);
            expect(betManager.getLastAggressor()).toBe(0n);
        });

        it("should handle bet after call correctly", () => {
            const turns: Turn[] = [
                {
                    playerId: "0x1234567890123456789012345678901234567890",
                    action: PlayerActionType.SMALL_BLIND,
                    amount: 10n,
                    index: 1
                },
                {
                    playerId: "0x0987654321098765432109876543210987654321",
                    action: PlayerActionType.BIG_BLIND,
                    amount: 20n,
                    index: 2
                },
                {
                    playerId: "0x1234567890123456789012345678901234567890",
                    action: PlayerActionType.CALL,
                    amount: 10n,
                    index: 3
                },
                {
                    playerId: "0x0987654321098765432109876543210987654321",
                    action: PlayerActionType.BET,
                    amount: 40n,
                    index: 4
                }
            ];

            const betManager = new BetManager(turns, mockGame);

            expect(betManager.current()).toBe(60n);
            expect(betManager.getLargestBet()).toBe(60n);
            expect(betManager.getLastAggressor()).toBe(60n);
        });

        it("should handle call after bet correctly", () => {
            const turns: Turn[] = [
                {
                    playerId: "0x1234567890123456789012345678901234567890",
                    action: PlayerActionType.SMALL_BLIND,
                    amount: 10n,
                    index: 1
                },
                {
                    playerId: "0x0987654321098765432109876543210987654321",
                    action: PlayerActionType.BIG_BLIND,
                    amount: 20n,
                    index: 2
                },
                {
                    playerId: "0x1234567890123456789012345678901234567890",
                    action: PlayerActionType.CALL,
                    amount: 10n,
                    index: 3
                },
                {
                    playerId: "0x0987654321098765432109876543210987654321",
                    action: PlayerActionType.BET,
                    amount: 40n,
                    index: 4
                },
                {
                    playerId: "0x1234567890123456789012345678901234567890",
                    action: PlayerActionType.CALL,
                    amount: 40n,
                    index: 5
                }
            ];

            const betManager = new BetManager(turns, mockGame);

            expect(betManager.current()).toBe(60n);
            expect(betManager.getLargestBet()).toBe(60n);
            expect(betManager.getLastAggressor()).toBe(0n);
        });

        it("should have correct functions with bet, call and raise", () => {
            const betManager = new BetManager(turns, mockGame);

            expect(betManager.count()).toBe(2);
            expect(betManager.getBets().size).toBe(2);
            expect(betManager.current()).toBe(300n);
            expect(betManager.getLargestBet()).toBe(300n);
            expect(betManager.getLastAggressor()).toBe(0n);

            expect(betManager.getTotalBetsForPlayer("0x1234567890123456789012345678901234567890")).toBe(300n);
            expect(betManager.getTotalBetsForPlayer("0x0987654321098765432109876543210987654321")).toBe(100n);
        });
    });

    describe("getRaisedAmount() tests", () => {
        it("should return big blind when no bets exist", () => {
            const emptyTurns: Turn[] = [];
            const betManager = new BetManager(emptyTurns, mockGame);

            expect(betManager.getRaisedAmount()).toBe(20n); // bigBlind
        });

        it("should return big blind when only one bet exists", () => {
            const singleBetTurns: Turn[] = [
                {
                    playerId: "0x1234567890123456789012345678901234567890",
                    action: PlayerActionType.BET,
                    amount: 100n,
                    index: 1
                }
            ];
            const betManager = new BetManager(singleBetTurns, mockGame);

            expect(betManager.getRaisedAmount()).toBe(20n); // bigBlind
        });

        it("should calculate raise amount correctly for basic raise scenario", () => {
            // First player bets 100, second player raises by 50 (total 150)
            const raiseTurns: Turn[] = [
                {
                    playerId: "0x1234567890123456789012345678901234567890",
                    action: PlayerActionType.BET,
                    amount: 100n,
                    index: 1
                },
                {
                    playerId: "0x0987654321098765432109876543210987654321",
                    action: PlayerActionType.RAISE,
                    amount: 150n,
                    index: 2
                }
            ];
            const betManager = new BetManager(raiseTurns, mockGame);

            expect(betManager.getRaisedAmount()).toBe(50n); // 150 - 100 = 50
        });

        it("should handle blinds scenario correctly", () => {
            const blindsTurns: Turn[] = [
                {
                    playerId: "0x1234567890123456789012345678901234567890",
                    action: PlayerActionType.SMALL_BLIND,
                    amount: 10n,
                    index: 1
                },
                {
                    playerId: "0x0987654321098765432109876543210987654321",
                    action: PlayerActionType.BIG_BLIND,
                    amount: 20n,
                    index: 2
                }
            ];
            const betManager = new BetManager(blindsTurns, mockGame);

            expect(betManager.getRaisedAmount()).toBe(20n); // bigBlind for blinds-only scenario
        });

        it("should handle preflop raise scenario", () => {
            // SB 10, BB 20, UTG raises to 60
            const preflopRaiseTurns: Turn[] = [
                {
                    playerId: "0x1111111111111111111111111111111111111111",
                    action: PlayerActionType.SMALL_BLIND,
                    amount: 10n,
                    index: 1
                },
                {
                    playerId: "0x2222222222222222222222222222222222222222",
                    action: PlayerActionType.BIG_BLIND,
                    amount: 20n,
                    index: 2
                },
                {
                    playerId: "0x3333333333333333333333333333333333333333",
                    action: PlayerActionType.RAISE,
                    amount: 60n,
                    index: 3
                }
            ];
            const betManager = new BetManager(preflopRaiseTurns, mockGame);

            expect(betManager.getRaisedAmount()).toBe(40n); // 60 - 20 = 40
        });

        it("should handle 3-bet scenario", () => {
            // BB 20, UTG raises to 60, BTN 3-bets to 180
            const threeBetTurns: Turn[] = [
                {
                    playerId: "0x1111111111111111111111111111111111111111",
                    action: PlayerActionType.BIG_BLIND,
                    amount: 20n,
                    index: 1
                },
                {
                    playerId: "0x2222222222222222222222222222222222222222",
                    action: PlayerActionType.RAISE,
                    amount: 60n,
                    index: 2
                },
                {
                    playerId: "0x3333333333333333333333333333333333333333",
                    action: PlayerActionType.RAISE,
                    amount: 180n,
                    index: 3
                }
            ];
            const betManager = new BetManager(threeBetTurns, mockGame);

            expect(betManager.getRaisedAmount()).toBe(120n); // 180 - 60 = 120
        });

        it("should handle multiple raises with same amounts", () => {
            // Equal raises should maintain the raise amount
            const equalRaiseTurns: Turn[] = [
                {
                    playerId: "0x1111111111111111111111111111111111111111",
                    action: PlayerActionType.BET,
                    amount: 100n,
                    index: 1
                },
                {
                    playerId: "0x2222222222222222222222222222222222222222",
                    action: PlayerActionType.RAISE,
                    amount: 200n,
                    index: 2
                },
                {
                    playerId: "0x3333333333333333333333333333333333333333",
                    action: PlayerActionType.RAISE,
                    amount: 300n,
                    index: 3
                }
            ];
            const betManager = new BetManager(equalRaiseTurns, mockGame);

            expect(betManager.getRaisedAmount()).toBe(100n); // 300 - 200 = 100
        });

        it("should return big blind when raise delta is less than big blind", () => {
            // Small raise that's less than big blind
            const smallRaiseTurns: Turn[] = [
                {
                    playerId: "0x1111111111111111111111111111111111111111",
                    action: PlayerActionType.BET,
                    amount: 100n,
                    index: 1
                },
                {
                    playerId: "0x2222222222222222222222222222222222222222",
                    action: PlayerActionType.RAISE,
                    amount: 105n, // Only 5 raise, which is less than bigBlind (20)
                    index: 2
                }
            ];
            const betManager = new BetManager(smallRaiseTurns, mockGame);

            expect(betManager.getRaisedAmount()).toBe(20n); // Should return bigBlind as minimum
        });
    });
});
