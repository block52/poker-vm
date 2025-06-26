import { BetManager } from "./betManager";
import { Turn } from "../types";
import { PlayerActionType } from "@bitcoinbrisbane/block52";

describe("Bet Manager Tests", () => {

    let betManager: BetManager;

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

    beforeEach(() => {
        betManager = new BetManager(turns);
    });

    it("should have correct functions with bet, call and raise", () => {
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