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
            index: 0
        },
        {
            playerId: "0x0987654321098765432109876543210987654321",
            action: PlayerActionType.CALL,
            amount: 100n,
            index: 1
        },
        {
            playerId: "0x1234567890123456789012345678901234567890",
            action: PlayerActionType.RAISE,
            amount: 200n,
            index: 2
        }
    ];

    beforeEach(() => {
        betManager = new BetManager(turns);
    });

    it("should count unique players who have placed bets", () => {
        // Verify that the bet manager correctly counts unique players
        expect(betManager.count()).toBe(2);
    });
}); 