import { NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { ITransaction } from "../models/interfaces";
import { toOrderedTransaction } from "./parsers";

describe("Parser", () => {
    describe("toOrderedTransaction", () => {
        it("should create ordered transaction", () => {
            const tx: ITransaction = {
                from: "0x1234",
                to: "0x5678",
                value: 1000n,
                type: NonPlayerActionType.JOIN,
                data: "0,1"
            };

            const actual = toOrderedTransaction(tx);
            expect(actual.index).toBe(1);
        });
    });
});
