import { Player } from "../models/game";
import { CircularLinkedList, FixedCircularList } from "./linkedList";

describe.only("Linked List Test", () => {
    describe("Dynamic List", () => {
        it("should have the correct properties pre flop", () => {
            const list = new CircularLinkedList<Player>(9);
            // expect(list.).toEqual(0);
            // expect(list.getMaxSize()).toEqual(9);
        });
    })

    describe("Fixed List", () => {
        it("should have the correct properties pre flop", () => {
            const list = new FixedCircularList<Player>(9, null);
            expect(list.getSize()).toEqual(9);
        });
    })
});
