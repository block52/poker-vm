import { Player } from "../models/game";
import { FixedCircularList } from "./linkedList";

describe.only("Linked List Test", () => {
    describe("Fixed List", () => {
        it("should test and find the next free seat", () => {
            const list = new FixedCircularList<Player>(9, null);
            expect(list.getSize()).toEqual(0);
            expect(list.getMaxSize()).toEqual(9);
            expect(list.isEmpty()).toEqual(true);
            
            const next = list.next(0);
            console.log("Next", next);
            expect(next).toEqual(0);

            const player1 = new Player("Player 1", 1000n);
            list.add(player1);

            expect(list.getSize()).toEqual(1);
        });
    })
});
