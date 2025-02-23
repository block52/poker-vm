import { PlayerStatus } from "@bitcoinbrisbane/block52";
import { Player } from "../models/game";
import { FixedCircularList } from "./linkedList";

describe.only("Fixed List Tests", () => {
    it("should test the linked list properties", () => {
        const list = new FixedCircularList<Player>(9, null);
        expect(list.getSize()).toEqual(0);
        expect(list.getMaxSize()).toEqual(9);
        expect(list.isEmpty()).toEqual(true);

        const next = list.next(0);
        expect(next).toEqual(0);

        const player1 = new Player("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f", undefined, BigInt(100), undefined, PlayerStatus.SITTING_OUT);
        list.add(player1);

        expect(list.getSize()).toEqual(1);
        expect(list.isEmpty()).toEqual(false);
        // expect(list.getNext()).toEqual(player1);
        // expect(list.getNextIndex()).toEqual(1);

        const player2 = new Player("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981g", undefined, BigInt(100), undefined, PlayerStatus.SITTING_OUT);
        list.add(player2);

        expect(list.getSize()).toEqual(2);

        const player3 = new Player("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981h", undefined, BigInt(100), undefined, PlayerStatus.SITTING_OUT);
        list.add(player3);

        expect(list.getSize()).toEqual(3);

        const player4 = new Player("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981i", undefined, BigInt(100), undefined, PlayerStatus.SITTING_OUT);
        list.add(player4);

        expect(list.getSize()).toEqual(4);

        const player5 = new Player("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981j", undefined, BigInt(100), undefined, PlayerStatus.SITTING_OUT);
        list.add(player5);

        expect(list.getSize()).toEqual(5);

        const player6 = new Player("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981k", undefined, BigInt(100), undefined, PlayerStatus.SITTING_OUT);
        list.add(player6);

        expect(list.getSize()).toEqual(6);

        const player7 = new Player("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981l", undefined
            , BigInt(100), undefined, PlayerStatus.SITTING_OUT);
        list.add(player7);

        expect(list.isEmpty()).toEqual(false);
    });
});