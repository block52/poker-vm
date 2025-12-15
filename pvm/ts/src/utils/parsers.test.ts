import { KEYS, PlayerActionType, NonPlayerActionType } from "@block52/poker-vm-sdk";
import { toGameOptions, toKeys, toOrderedTransaction } from "./parsers";
import { ITransaction } from "../models/interfaces";

describe("Parsers", () => {
    describe("toGameOptions", () => {
        it("should throw not implemented error", () => {
            expect(() => toGameOptions("test")).toThrow("Not implemented");
        });
    });

    describe("toKeys", () => {
        it("should parse empty string to empty object", () => {
            const result = toKeys("");
            expect(result).toEqual({});
        });

        it("should parse single key-value pair", () => {
            const result = toKeys("key=value");
            expect(result).toEqual({ key: "value" });
        });

        it("should parse multiple key-value pairs", () => {
            const result = toKeys("key1=value1&key2=value2&key3=value3");
            expect(result).toEqual({
                key1: "value1",
                key2: "value2",
                key3: "value3"
            });
        });

        it("should handle URL encoded values", () => {
            const result = toKeys("name=John%20Doe&city=New%20York");
            expect(result).toEqual({
                name: "John Doe",
                city: "New York"
            });
        });

        it("should handle empty values", () => {
            const result = toKeys("key1=&key2=value2");
            expect(result).toEqual({
                key1: "",
                key2: "value2"
            });
        });

        it("should parse transaction-like data format", () => {
            const data = `${KEYS.ACTION_TYPE}=bet&${KEYS.INDEX}=5&${KEYS.VALUE}=100`;
            const result = toKeys(data);
            expect(result[KEYS.ACTION_TYPE]).toBe("bet");
            expect(result[KEYS.INDEX]).toBe("5");
            expect(result[KEYS.VALUE]).toBe("100");
        });
    });

    describe("toOrderedTransaction", () => {
        const baseTx: ITransaction = {
            from: "0x1234567890123456789012345678901234567890",
            to: "0x0987654321098765432109876543210987654321",
            value: 0n,
            data: ""
        };

        it("should throw error when transaction data is undefined", () => {
            const tx: ITransaction = {
                from: baseTx.from,
                to: baseTx.to,
                value: 0n,
                data: undefined as unknown as string
            };
            expect(() => toOrderedTransaction(tx)).toThrow("Transaction data is undefined");
        });

        it("should throw error when action_type is missing", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.INDEX}=1&${KEYS.VALUE}=100`
            };
            expect(() => toOrderedTransaction(tx)).toThrow(`missing ${KEYS.ACTION_TYPE}`);
        });

        it("should throw error when index is missing", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}=bet&${KEYS.VALUE}=100`
            };
            expect(() => toOrderedTransaction(tx)).toThrow(`missing ${KEYS.INDEX}`);
        });

        it("should throw error when index is not a valid number", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}=bet&${KEYS.INDEX}=abc&${KEYS.VALUE}=100`
            };
            expect(() => toOrderedTransaction(tx)).toThrow("Invalid index");
        });

        it("should parse valid BET transaction", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}=${PlayerActionType.BET}&${KEYS.INDEX}=5&${KEYS.VALUE}=1000`
            };
            const result = toOrderedTransaction(tx);

            expect(result.from).toBe(baseTx.from);
            expect(result.to).toBe(baseTx.to);
            expect(result.type).toBe(PlayerActionType.BET);
            expect(result.index).toBe(5);
            expect(result.value).toBe(1000n);
            expect(result.data).toBe(tx.data);
        });

        it("should parse valid CALL transaction", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}=${PlayerActionType.CALL}&${KEYS.INDEX}=10&${KEYS.VALUE}=500`
            };
            const result = toOrderedTransaction(tx);

            expect(result.type).toBe(PlayerActionType.CALL);
            expect(result.index).toBe(10);
            expect(result.value).toBe(500n);
        });

        it("should parse valid FOLD transaction", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}=${PlayerActionType.FOLD}&${KEYS.INDEX}=7&${KEYS.VALUE}=0`
            };
            const result = toOrderedTransaction(tx);

            expect(result.type).toBe(PlayerActionType.FOLD);
            expect(result.index).toBe(7);
            expect(result.value).toBe(0n);
        });

        it("should parse valid CHECK transaction", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}=${PlayerActionType.CHECK}&${KEYS.INDEX}=12&${KEYS.VALUE}=0`
            };
            const result = toOrderedTransaction(tx);

            expect(result.type).toBe(PlayerActionType.CHECK);
            expect(result.index).toBe(12);
            expect(result.value).toBe(0n);
        });

        it("should parse valid RAISE transaction", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}=${PlayerActionType.RAISE}&${KEYS.INDEX}=15&${KEYS.VALUE}=2000`
            };
            const result = toOrderedTransaction(tx);

            expect(result.type).toBe(PlayerActionType.RAISE);
            expect(result.index).toBe(15);
            expect(result.value).toBe(2000n);
        });

        it("should parse valid SMALL_BLIND transaction", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}=${PlayerActionType.SMALL_BLIND}&${KEYS.INDEX}=1&${KEYS.VALUE}=10`
            };
            const result = toOrderedTransaction(tx);

            expect(result.type).toBe(PlayerActionType.SMALL_BLIND);
            expect(result.index).toBe(1);
            expect(result.value).toBe(10n);
        });

        it("should parse valid BIG_BLIND transaction", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}=${PlayerActionType.BIG_BLIND}&${KEYS.INDEX}=2&${KEYS.VALUE}=20`
            };
            const result = toOrderedTransaction(tx);

            expect(result.type).toBe(PlayerActionType.BIG_BLIND);
            expect(result.index).toBe(2);
            expect(result.value).toBe(20n);
        });

        it("should parse valid JOIN non-player action", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}=${NonPlayerActionType.JOIN}&${KEYS.INDEX}=1&${KEYS.VALUE}=1000000`
            };
            const result = toOrderedTransaction(tx);

            expect(result.type).toBe(NonPlayerActionType.JOIN);
            expect(result.index).toBe(1);
            expect(result.value).toBe(1000000n);
        });

        it("should parse valid LEAVE non-player action", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}=${NonPlayerActionType.LEAVE}&${KEYS.INDEX}=20&${KEYS.VALUE}=500000`
            };
            const result = toOrderedTransaction(tx);

            expect(result.type).toBe(NonPlayerActionType.LEAVE);
            expect(result.index).toBe(20);
            expect(result.value).toBe(500000n);
        });

        it("should parse valid DEAL non-player action", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}=${NonPlayerActionType.DEAL}&${KEYS.INDEX}=3&${KEYS.VALUE}=0`
            };
            const result = toOrderedTransaction(tx);

            expect(result.type).toBe(NonPlayerActionType.DEAL);
            expect(result.index).toBe(3);
            expect(result.value).toBe(0n);
        });

        it("should default value to 0 when not provided", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}=${PlayerActionType.CHECK}&${KEYS.INDEX}=5`
            };
            const result = toOrderedTransaction(tx);

            expect(result.value).toBe(0n);
        });

        it("should handle large BigInt values", () => {
            const largeValue = "100000000000000000000"; // 100 ETH in wei
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}=${PlayerActionType.BET}&${KEYS.INDEX}=1&${KEYS.VALUE}=${largeValue}`
            };
            const result = toOrderedTransaction(tx);

            expect(result.value).toBe(BigInt(largeValue));
        });

        it("should handle whitespace in action type and index", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}= bet &${KEYS.INDEX}= 5 &${KEYS.VALUE}=100`
            };
            const result = toOrderedTransaction(tx);

            expect(result.type).toBe("bet");
            expect(result.index).toBe(5);
        });

        it("should preserve original data in result", () => {
            const originalData = `${KEYS.ACTION_TYPE}=${PlayerActionType.BET}&${KEYS.INDEX}=1&${KEYS.VALUE}=100&extra=data`;
            const tx: ITransaction = {
                ...baseTx,
                data: originalData
            };
            const result = toOrderedTransaction(tx);

            expect(result.data).toBe(originalData);
        });

        it("should handle zero index", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}=${PlayerActionType.BET}&${KEYS.INDEX}=0&${KEYS.VALUE}=100`
            };
            const result = toOrderedTransaction(tx);

            expect(result.index).toBe(0);
        });

        it("should handle negative index (parsed as valid number)", () => {
            const tx: ITransaction = {
                ...baseTx,
                data: `${KEYS.ACTION_TYPE}=${PlayerActionType.BET}&${KEYS.INDEX}=-1&${KEYS.VALUE}=100`
            };
            const result = toOrderedTransaction(tx);

            // parseInt will parse -1 as a valid number
            expect(result.index).toBe(-1);
        });
    });
});
