import { PayoutManager } from "./payoutManager";
import { PlayerStatus } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import { ONE_HUNDRED_TOKENS } from "../testConstants";

describe("PayoutManager", () => {
    let payoutManager: PayoutManager;
    let players: Player[];

    beforeEach(() => {
        players = Array.from({ length: 9 }, (_, i) => ({
            status: PlayerStatus.ACTIVE,
            id: i.toString()
        } as Player));
        payoutManager = new PayoutManager(ONE_HUNDRED_TOKENS, players);
    });

    describe("calculatePayout", () => {
        it("should return 60% for 1st place", () => {
            const payout = payoutManager.calculatePayout(1);
            const expected = BigInt("540000000000000000000"); // 60% of 900 ETH
            expect(payout).toBe(expected);
        });

        it("should return 30% for 2nd place", () => {
            const payout = payoutManager.calculatePayout(2);
            const expected = BigInt("270000000000000000000"); // 30% of 900 ETH
            expect(payout).toBe(expected);
        });

        it("should return 10% for 3rd place", () => {
            const payout = payoutManager.calculatePayout(3);
            const expected = BigInt("90000000000000000000"); // 10% of 900 ETH
            expect(payout).toBe(expected);
        });

        it("should return 0 for places 4 and beyond", () => {
            expect(payoutManager.calculatePayout(4)).toBe(0n);
            expect(payoutManager.calculatePayout(9)).toBe(0n);
        });

        it("should return 0 for invalid places", () => {
            expect(payoutManager.calculatePayout(0)).toBe(0n);
            expect(payoutManager.calculatePayout(-1)).toBe(0n);
        });
    });

    describe("calculateCurrentPayout", () => {
        it("should return 1st place payout when 1 player remains", () => {
            players.forEach((player, index) => {
                if (index > 0) player.status = PlayerStatus.BUSTED;
            });

            const payout = payoutManager.calculateCurrentPayout();
            expect(payout).toBe(BigInt("540000000000000000000"));
        });

        it("should return 2nd place payout when 2 players remain", () => {
            players.forEach((player, index) => {
                if (index > 1) player.status = PlayerStatus.BUSTED;
            });

            const payout = payoutManager.calculateCurrentPayout();
            expect(payout).toBe(BigInt("270000000000000000000"));
        });

        it("should return 3rd place payout when 3 players remain", () => {
            players.forEach((player, index) => {
                if (index > 2) player.status = PlayerStatus.BUSTED;
            });

            const payout = payoutManager.calculateCurrentPayout();
            expect(payout).toBe(BigInt("90000000000000000000"));
        });

        it("should return 0 when more than 3 players remain", () => {
            const payout = payoutManager.calculateCurrentPayout();
            expect(payout).toBe(0n);
        });

        it("should throw error when no active players", () => {
            players.forEach(player => player.status = PlayerStatus.BUSTED);

            expect(() => payoutManager.calculateCurrentPayout()).toThrow("No active players to calculate payout");
        });
    });
});