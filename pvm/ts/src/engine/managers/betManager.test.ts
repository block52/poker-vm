import { BetManager } from "./betManager";
import { Turn } from "../types";
import { PlayerActionType } from "@bitcoinbrisbane/block52";

describe("Bet Manager Tests", () => {
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

    // beforeEach(() => {
    //     betManager = new BetManager(turns);
    // });

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

        const betManager = new BetManager(turns);

        expect(betManager.count()).toBe(2);
        expect(betManager.current()).toBe(20n);
        expect(betManager.getLargestBet()).toBe(20n);
        expect(betManager.getLastAggressor()).toBe(20n);
    });

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
            },
            {
                playerId: "0x1234567890123456789012345678901234567890",
                action: PlayerActionType.CALL,
                amount: 10n,
                index: 3
            }
        ];

        const betManager = new BetManager(turns);

        // expect(betManager.count()).toBe(2);
        expect(betManager.current()).toBe(20n);
        expect(betManager.getLargestBet()).toBe(20n);
        expect(betManager.getLastAggressor()).toBe(0n);
    });

    it("should have correct function in ante to round", () => {
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

        const betManager = new BetManager(turns);

        expect(betManager.current()).toBe(60n);
        expect(betManager.getLargestBet()).toBe(60n);
        expect(betManager.getLastAggressor()).toBe(60n);
    });

    it.only("should have correct function in ante to round", () => {
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

        const betManager = new BetManager(turns);

        expect(betManager.current()).toBe(60n);
        expect(betManager.getLargestBet()).toBe(60n);
        // expect(betManager.getLastAggressor()).toBe(0n);
    });

    it("should have correct functions with bet, call and raise", () => {
        const betManager = new BetManager(turns);

        // Verify that the bet manager correctly counts unique players
        expect(betManager.count()).toBe(2);
        expect(betManager.getBets().size).toBe(2);
        expect(betManager.current()).toBe(300n);
        expect(betManager.getLargestBet()).toBe(300n);
        expect(betManager.getLastAggressor()).toBe(0n); // Last aggressor is the last player who bet or raised but is not the current bet

        expect(betManager.getTotalBetsForPlayer("0x1234567890123456789012345678901234567890")).toBe(300n);
        expect(betManager.getTotalBetsForPlayer("0x0987654321098765432109876543210987654321")).toBe(100n);
    });
});
