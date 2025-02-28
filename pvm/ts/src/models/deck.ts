export enum SUIT {
    CLUBS = 1,
    DIAMONDS = 2,
    HEARTS = 3,
    SPADES = 4
}

export type Card = {
    suit: SUIT;
    rank: number;
    value: number;
    mnemonic: string;
};

import { createHash } from "crypto";
import { ethers } from "ethers";
import { IJSONModel } from "./interfaces";

export interface IDeck {
    shuffle(seed?: number[]): void;
    getNext(): Card;
}

export class Deck implements IDeck, IJSONModel {
    private cards: Card[] = []; // todo: make stake
    public hash: string = "";
    public seedHash: string;
    private top: number = 0;

    private readonly SUIT_MAP = {
        'C': SUIT.CLUBS,
        'D': SUIT.DIAMONDS,
        'H': SUIT.HEARTS,
        'S': SUIT.SPADES
    };
    
    private readonly RANK_MAP: { [key: number]: string } = {
        1: 'A',
        11: 'J',
        12: 'Q',
        13: 'K'
    };

    constructor(deck?: string) {
        if (deck) {
            const mnemonics = deck.split("-");
            if (mnemonics.length !== 52) {
                throw new Error("Deck must contain 52 cards.");
            }

            this.cards = [];

            mnemonics.map(mnemonic => {
                this.cards.push(this.fromString(mnemonic));
            });
        } else {
            this.initStandard52();
        }

        this.hash = ethers.ZeroHash;
        this.createHash();
        this.seedHash = ethers.ZeroHash;
    }

    public shuffle(seed?: number[]): void {
        if (!seed || seed.length === 0) {
            seed = Array.from({ length: this.cards.length }, () => Math.floor(1000000 * Math.random()));
        }

        // Validate seed length matches cards length
        if (seed.length !== this.cards.length) {
            throw new Error(`Seed length (${seed.length}) must match cards length (${this.cards.length})`);
        }

        const seedAsString = seed.join("-");
        this.seedHash = createHash("sha256").update(seedAsString).digest("hex");

        // Fisher-Yates shuffle
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = seed[i] % (i + 1);
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }

        // Explicitly update hash after shuffling
        this.createHash();
    }

    public getCardMnemonic(suit: SUIT, rank: number): string {
        const RANK_MAP: { [key: number]: string } = {
            1: 'A',
            11: 'J',
            12: 'Q',
            13: 'K'
        };

        const SUIT_MAP = {
            [SUIT.CLUBS]: 'C',
            [SUIT.DIAMONDS]: 'D',
            [SUIT.HEARTS]: 'H',
            [SUIT.SPADES]: 'S'
        };

        const rankStr = RANK_MAP[rank] || rank.toString();
        const suitStr = SUIT_MAP[suit];

        return rankStr + suitStr;
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

    public toString(): string {
        return this.cards.map(card => card.mnemonic).join('-');
    }

    private createHash(): void {
        const cardMnemonics = this.cards.map(card => card.mnemonic);
        const cardsAsString = cardMnemonics.join("-");
        this.hash = createHash("sha256").update(cardsAsString).digest("hex");
    }

    private fromString(mnemonics: string): Card {
        const rank = parseInt(mnemonics.slice(0, -1));
        const suitChar = mnemonics.slice(-1);

        const SUIT_MAP = {
            'C': SUIT.CLUBS,
            'D': SUIT.DIAMONDS,
            'H': SUIT.HEARTS,
            'S': SUIT.SPADES
        };

        const suit = SUIT_MAP[suitChar as keyof typeof SUIT_MAP];

        return {
            suit,
            rank,
            value: 13 * (suit - 1) + (rank - 1),
            mnemonic: this.getCardMnemonic(suit, rank)
        };
    }

    private initStandard52(): void {
        this.cards = []; // Clear existing cards
        for (let suit = SUIT.CLUBS; suit <= SUIT.SPADES; suit++) {
            for (let rank = 1; rank <= 13; rank++) { // Changed from 2-14 to 1-13
                this.cards.push({
                    suit: suit,
                    rank: rank,
                    value: 13 * (suit - 1) + (rank - 1),
                    mnemonic: this.getCardMnemonic(suit, rank)
                });
            }
        }
        this.createHash(); // Make sure hash is updated after initializing cards
    }
}
