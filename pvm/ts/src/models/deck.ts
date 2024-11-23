export enum DeckType {
    STANDARD_52 = 0,
    SHORT_DECK = 1,
    FIVE_HUNDRED = 2,
}

export enum SUIT {
    CLUBS = 1,
    DIAMONDS = 2,
    HEARTS = 3,
    SPADES = 4
};

export type Card = {
    suit: SUIT;
    rank: number;
    value: number;
    mnemonic: string;
};

import { createHash } from "crypto";
import { ethers } from "ethers";
import { IJSONModel } from "./interfaces";

export class Deck implements IJSONModel {

    // todo make this a stack
    private cards: Card[] = [];
    public hash: string = "";
    public seedHash: string;
    private top: number = 0;

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

        this.hash = ethers.ZeroHash;
        this.createHash();
        this.seedHash = ethers.ZeroHash;
    }

    private createHash(): void {
        const cardMnemonics = this.cards.map((card) => card.mnemonic);
        const cardsAsString = cardMnemonics.join("-");
        this.hash = createHash("sha256").update(cardsAsString).digest("hex");
    }

    public shuffle(seed?: number[]): void {
        // TODO: Switch to crypto.randomInt for better randomness
        if (!seed)
            seed = Array.from({ length: this.cards.length }, () => Math.floor(1000000 * Math.random()))
        const seedAsString = seed.join("-");
        this.seedHash = createHash("sha256").update(seedAsString).digest("hex");

        // Fisher-Yates shuffle
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = seed[i] % (i + 1);
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
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
            case SUIT.CLUBS:
                mnemonic += "C";
                break;
            case SUIT.DIAMONDS:
                mnemonic += "D";
                break;
            case SUIT.HEARTS:
                mnemonic += "H";
                break;
            case SUIT.SPADES:
                mnemonic += "S";
                break;
        }

        return mnemonic;
    }

    public getNext(): Card {
        return this.cards[this.top++];
    }

    public deal(amount: number): Card[] {
        return Array.from({ length: amount }, () => this.getNext());
    }

    public toJson(): any {
        return {
            cards: this.cards
        };
    }

    private initStandard52(): void {
        for (let suit = SUIT.CLUBS; suit <= SUIT.SPADES; suit++) {
            for (let rank = 2; rank <= 14; rank++) {
                this.cards.push({
                    suit: suit,
                    rank: rank,
                    value: 13 * (suit - 1) + (rank - 1),
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
