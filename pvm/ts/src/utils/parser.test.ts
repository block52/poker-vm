import { NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { toOrderedTransaction } from "./parsers";

describe("Parser", () => {
    describe("toOrderedTransaction", () => {
        it("should create ordered transaction with all data", () => {
            const tx = {
                from: "0x1234",
                to: "0x5678",
                value: 1000n,
                data: "actiontype=join&index=1"
            };

            const actual = toOrderedTransaction(tx);
            expect(actual.index).toBe(1);
            expect(actual.from).toBe("0x1234");
            expect(actual.to).toBe("0x5678");
            expect(actual.value).toBe(1000n);
            expect(actual.type).toBe(NonPlayerActionType.JOIN);
        });

        it("should create ordered transaction with only action type and index", () => {
            const tx = {
                from: "0x1234",
                to: "0x5678",
                value: 1000n,
                data: "actiontype=join&index=1"
            };

            const actual = toOrderedTransaction(tx);
            expect(actual.index).toBe(1);
            expect(actual.from).toBe("0x1234");
            expect(actual.to).toBe("0x5678");
            expect(actual.value).toBe(1000n);
            expect(actual.type).toBe(NonPlayerActionType.JOIN);
        });

        it("should remove 'undefined", () => {
            const tx = {
                from: "0x1234",
                to: "0x5678",
                value: 1000n,
                data: "join,0,undefined"
            };

            const actual = toOrderedTransaction(tx);
            expect(actual.index).toBe(0);
            expect(actual.from).toBe("0x1234");
            expect(actual.to).toBe("0x5678");
            expect(actual.value).toBe(1000n);
            expect(actual.type).toBe(NonPlayerActionType.JOIN);
            expect(actual.data).toBeNull();
        });

        it("should create ordered transaction with URLSearchParams format", () => {
            const tx = {
                from: "0x1234",
                to: "0x5678",
                value: 0n,
                data: "actiontype=join&index=0&value=1000"
            };

            const actual = toOrderedTransaction(tx);
            expect(actual.index).toBe(0);
            expect(actual.from).toBe("0x1234");
            expect(actual.to).toBe("0x5678");
            expect(actual.value).toBe(1000n);
            expect(actual.type).toBe(NonPlayerActionType.JOIN);
        });
    });
});
