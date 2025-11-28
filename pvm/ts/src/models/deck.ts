import { createHash } from "crypto";
import { ethers } from "ethers";
import { IJSONModel } from "./interfaces";
import { Card, SUIT } from "@bitcoinbrisbane/block52";

/**
 * Deck DTO - Data Transfer Object for deck state
 * Shuffling is now handled by Cosmos blockchain
 * This class only handles parsing and serializing deck state
 */
export interface IDeck {
    getNext(): Card;
}

export class Deck implements IDeck, IJSONModel {
    private cards: Card[] = [];
    public hash: string = "";
    private top: number = 0;

    constructor(deck?: string) {
        // For backwards compatibility: treat empty strings as undefined (create standard deck)
        // In production, Cosmos will always provide a valid shuffled deck string
        const deckStr = (deck && deck.trim() !== "") ? deck : undefined;

        if (deckStr) {
            const mnemonics = deckStr.split("-");
            if (mnemonics.length !== 52) {
                throw new Error("Deck must contain 52 cards.");
            }

            this.cards = [];

            for (let i = 0; i < mnemonics.length; i++) {
                if (mnemonics[i].startsWith("[") && mnemonics[i].endsWith("]")) {
                    mnemonics[i] = mnemonics[i].substring(1, mnemonics[i].length - 1);
                    this.top = i;
                }

                this.cards.push(Deck.fromString(mnemonics[i]));
            }

            // mnemonics.map(mnemonic => {
            //     this.cards.push(Deck.fromString(mnemonic));
            // });
        } else {
            this.initStandard52();
        }

        this.hash = ethers.ZeroHash;
        this.createHash();
    }

    public getCardMnemonic(suit: SUIT, rank: number): string {
        // Make sure we're working with a number
        const rankNum = Number(rank);

        // Define the mapping for special ranks
        const rankMap: Record<number, string> = {
            1: "A",
            10: "T",
            11: "J",
            12: "Q",
            13: "K"
        };

        // Create a mapping for suit to string
        const suitMap: Record<number, string> = {
            [SUIT.CLUBS]: "C",
            [SUIT.DIAMONDS]: "D",
            [SUIT.HEARTS]: "H",
            [SUIT.SPADES]: "S"
        };

        // Get the rank string (either from the map or use the number)
        const rankStr = rankMap[rankNum] !== undefined ? rankMap[rankNum] : rankNum.toString();

        // Get the suit string
        const suitStr = suitMap[suit];

        return `${rankStr}${suitStr}`;
    }

    public getNext(): Card {
        return this.cards[this.top++];
    }

    public deal(amount: number): Card[] {
        this.top += amount;
        return Array.from({ length: amount }, () => this.getNext());
    }

    public toJson(): unknown {
        return {
            cards: this.cards
        };
    }

    public toString(): string {
        const mnemonics: string[] = [];

        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];

            // Try to regenerate the mnemonic to see if there's a difference
            const regeneratedMnemonic = this.getCardMnemonic(card.suit, card.rank);

            if (card.mnemonic !== regeneratedMnemonic) {
                console.log(`MISMATCH: stored=${card.mnemonic}, regenerated=${regeneratedMnemonic}`);
            }

            if (i === this.top) {
                mnemonics.push(`[${card.mnemonic}]`);
            }
            else {
                mnemonics.push(card.mnemonic);
            }
        }

        const result = mnemonics.join("-");
        return result;
    }

    private createHash(): void {
        const cardMnemonics = this.cards.map(card => card.mnemonic);
        const cardsAsString = cardMnemonics.join("-");
        this.hash = createHash("sha256").update(cardsAsString).digest("hex");
    }

    public static fromString(mnemonic: string): Card {
        const match = mnemonic.match(/^([AJQKTajqkt]|[0-9]+)([CDHS])$/i);

        if (!match) {
            throw new Error(`Invalid card mnemonic: ${mnemonic}`);
        }

        const rankStr = match[1].toUpperCase();
        const suitChar = match[2].toUpperCase();

        // Convert rank string to number
        let rank: number;
        switch (rankStr) {
            case "A": rank = 1; break;
            case "T": rank = 10; break;
            case "J": rank = 11; break;
            case "Q": rank = 12; break;
            case "K": rank = 13; break;
            default: rank = parseInt(rankStr, 10); break;
        }

        // Convert suit character to SUIT enum
        let suit: SUIT;
        switch (suitChar) {
            case "C": suit = SUIT.CLUBS; break;
            case "D": suit = SUIT.DIAMONDS; break;
            case "H": suit = SUIT.HEARTS; break;
            case "S": suit = SUIT.SPADES; break;
            default:
                throw new Error(`Invalid suit character: ${suitChar}`);
        }

        return {
            suit,
            rank,
            value: 13 * (suit - 1) + (rank - 1),
            mnemonic // Use original mnemonic for consistency
        };
    }

    private initStandard52(): void {
        this.cards = []; // Clear existing cards
        for (let suit = SUIT.CLUBS; suit <= SUIT.SPADES; suit++) {
            for (let rank = 1; rank <= 13; rank++) {
                // Changed from 2-14 to 1-13
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
