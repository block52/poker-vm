import { ethers } from "ethers";
import { IAccountDocument } from "./interfaces";

enum DeckType {
    STANDARD_52 = 0,
    SHORT_DECK = 1,
    FIVE_HUNDRED = 2,
}

enum SUIT {
    SPADES = 0,
    HEARTS = 1,
    DIAMONDS = 2,
    CLUBS = 3,
};

export type Card = {
    suit: SUIT;
    rank: number;
    value: number;
    mnemonic: string;
};

export class Deck {

    // todo make this a stack
    private cards: Card[] = [];

    constructor(type: DeckType) {
        switch (type) {
            case DeckType.STANDARD_52:
                this.initStandard52();
                break;
            case DeckType.SHORT_DECK:
                this.initShortDeck();
                break;
            case DeckType.FIVE_HUNDRED:
                this.initFiveHundred();
                break;
            default:
                throw new Error("Invalid deck type");
        }
    }

    public getCardMnemonic(suit: SUIT, rank: number): string {
        let mnemonic = "";
        switch (rank) {
            case 11:
                mnemonic += "J";
                break;
            case 12:
                mnemonic += "Q";
                break;
            case 13:
                mnemonic += "K";
                break;
            case 14:
                mnemonic += "A";
                break;
            default:
                mnemonic += rank.toString();
        }

        switch (suit) {
            case SUIT.SPADES:
                mnemonic += "S";
                break;
            case SUIT.HEARTS:
                mnemonic += "H";
                break;
            case SUIT.DIAMONDS:
                mnemonic += "D";
                break;
            case SUIT.CLUBS:
                mnemonic += "C";
                break;
        }

        return mnemonic;
    }

    public getNext(): number {
        return ;
    }

    // public toJson(): any {
    //     return {
    //         address: this.address,
    //         balance: this.balance,
    //     };
    // }

    // public static fromJson(json: any): Account {
    //     return new Account(json.address, json.balance);
    // }

    // public static fromDocument(document: IAccountDocument): Account {
    //     return new Account(document.address, BigInt(document.balance));
    // }

    // public toDocument(): IAccountDocument {
    //     return {
    //         address: this.address,
    //         balance: Number(this.balance),
    //         nonce: 0,
    //     };
    // }

    private initStandard52(): void {
        for (let suit = 0; suit < 4; suit++) {
            for (let rank = 2; rank <= 14; rank++) {
                this.cards.push({
                    suit: suit,
                    rank: rank,
                    value: rank,
                    mnemonic: this.getCardMnemonic(suit, rank),
                });
            }
        }
    }

    private initShortDeck(): void {
        throw new Error("Not implemented");
    }

    private initFiveHundred(): void {
        throw new Error("Not implemented");
    }
}
