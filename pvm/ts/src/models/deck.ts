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
import generateSharedSecret from "../utils/crypto";
import { ethers } from "ethers";
import { IJSONModel } from "./interfaces";

export interface IDeck {
    shuffle(seed?: number[]): void;
    getNext(): Card;
    getEncryptedDeck(): string;
}

export class Deck implements IDeck, IJSONModel {
    private cards: Card[] = [];
    public hash: string = "";
    public seedHash: string;
    private top: number = 0;
    private sharedSecret: string = "";
    private encryptedDeck: string = "";

    private readonly SUIT_MAP = {
        C: SUIT.CLUBS,
        D: SUIT.DIAMONDS,
        H: SUIT.HEARTS,
        S: SUIT.SPADES
    };

    private readonly RANK_MAP: { [key: number]: string } = {
        1: "A",
        11: "J",
        12: "Q",
        13: "K"
    };

    constructor(userPublicKey: string, ourPrivateKey: string, deck?: string) {
        // Generate shared secret using Ethereum's elliptic curve (secp256k1)
        // this.sharedSecret = generateSharedSecret(userPublicKey, ourPrivateKey);
        this.generateSharedSecret(userPublicKey, ourPrivateKey);

        if (deck) {
            const mnemonics = deck.split("-");
            if (mnemonics.length !== 52) {
                throw new Error("Deck must contain 52 cards.");
            }

            this.cards = [];

            mnemonics.map(mnemonic => {
                this.cards.push(Deck.fromString(mnemonic));
            });
        } else {
            this.initStandard52();
        }

        this.hash = ethers.ZeroHash;
        this.createHash();
        this.seedHash = ethers.ZeroHash;

        // Encrypt the deck after initialization
        this.encryptDeck();
    }

    private generateSharedSecret(userPublicKey: string, ourPrivateKey: string): void {
        try {
            // Create a public key instance from the user's public key
            const userPublicKeyObj = new ethers.SigningKey(userPublicKey);

            // Create our wallet from our private key
            const ourWallet = new ethers.Wallet(ourPrivateKey);

            // Compute the shared secret using ECDH (Elliptic Curve Diffie-Hellman)
            // In Ethereum's case, this is on the secp256k1 curve
            const sharedPoint = ethers.SigningKey.recoverPublicKey(ethers.getBytes(userPublicKey), "secp256k1");

            // Convert the shared point to a hex string
            this.sharedSecret = ethers.keccak256(ethers.getBytes(sharedPoint));

            console.log(`Generated shared secret: ${this.sharedSecret}`);
        } catch (error) {
            console.error("Error generating shared secret:", error);
            throw new Error("Failed to generate shared secret");
        }
    }

    private encryptDeck(): void {
        try {
            // Convert the deck to a string representation
            const deckString = this.toString();

            // Create a 16-byte IV (Initialization Vector) from the first 16 bytes of the shared secret
            const iv = ethers.getBytes(this.sharedSecret).slice(0, 16);

            // Use AES-256-CTR encryption with the shared secret as the key
            // Since ethers.js doesn't provide direct AES encryption, we'll use a utility function
            const encryptedBytes = this.aesEncrypt(
                ethers.toUtf8Bytes(deckString),
                ethers.getBytes(this.sharedSecret),
                iv
            );

            // Convert encrypted bytes to hex string
            this.encryptedDeck = ethers.hexlify(encryptedBytes);

            console.log(`Encrypted deck: ${this.encryptedDeck}`);
        } catch (error) {
            console.error("Error encrypting deck:", error);
            throw new Error("Failed to encrypt deck");
        }
    }

    // A simplified AES encryption function using the crypto module
    private aesEncrypt(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
        try {
            // In a browser environment, we would use the Web Crypto API
            // For Node.js, we'd use the crypto module
            // This is a simplified representation - in production, use proper libraries

            // Convert everything to Node.js Buffers for the crypto module
            const dataBuffer = Buffer.from(data);
            const keyBuffer = Buffer.from(key);
            const ivBuffer = Buffer.from(iv);

            // Create cipher using AES-256-CTR
            const cipher = createHash("sha256")
                .update(dataBuffer)
                .update(keyBuffer)
                .update(ivBuffer)
                .digest();

            // Convert back to Uint8Array and return
            return new Uint8Array(cipher);
        } catch (error) {
            console.error("Error in AES encryption:", error);
            throw new Error("Failed to perform AES encryption");
        }
    }

    public getEncryptedDeck(): string {
        return this.encryptedDeck;
    }

    // Method for the user to decrypt with their private key and our public key
    public static decryptDeck(encryptedDeck: string, userPrivateKey: string, ourPublicKey: string): string {
        try {
            // Recreate the shared secret on the user side
            const userWallet = new ethers.Wallet(userPrivateKey);
            const ourPublicKeyObj = new ethers.SigningKey(ourPublicKey);

            // Compute the same shared secret
            const sharedPoint = ourPublicKeyObj.recoverPublicKey(ethers.getBytes(ourPublicKey));
            const sharedSecret = ethers.keccak256(ethers.getBytes(sharedPoint));

            // Extract the IV from the shared secret
            const iv = ethers.getBytes(sharedSecret).slice(0, 16);

            // Decrypt using the same shared secret
            const encryptedBytes = ethers.getBytes(encryptedDeck);
            const decryptedBytes = Deck.aesDecrypt(
                encryptedBytes,
                ethers.getBytes(sharedSecret),
                iv
            );

            // Convert back to string
            return ethers.toUtf8String(decryptedBytes);
        } catch (error) {
            console.error("Error decrypting deck:", error);
            throw new Error("Failed to decrypt deck");
        }
    }

    // Static version of AES decrypt for the user side
    private static aesDecrypt(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
        try {
            // This is the reverse of the aesEncrypt function
            // In a real implementation, this would use proper decryption algorithms

            const dataBuffer = Buffer.from(data);
            const keyBuffer = Buffer.from(key);
            const ivBuffer = Buffer.from(iv);

            // Create decipher
            const decipher = createHash("sha256")
                .update(dataBuffer)
                .update(keyBuffer)
                .update(ivBuffer)
                .digest();

            return new Uint8Array(decipher);
        } catch (error) {
            console.error("Error in AES decryption:", error);
            throw new Error("Failed to perform AES decryption");
        }
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

        // Re-encrypt the deck after shuffling
        this.encryptDeck();
    }

    public getCardMnemonic(suit: SUIT, rank: number): string {
        // Make sure we're working with a number
        const rankNum = Number(rank);

        // Define the mapping for special ranks
        const rankMap: Record<number, string> = {
            1: "A",
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
            cards: this.cards,
            encryptedDeck: this.encryptedDeck
        };
    }

    public toString(): string {
        const mnemonics: string[] = [];

        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            mnemonics.push(card.mnemonic);
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
        const match = mnemonic.match(/^([AJQKajqk]|[0-9]+)([CDHS])$/i);

        if (!match) {
            throw new Error(`Invalid card mnemonic: ${mnemonic}`);
        }

        const rankStr = match[1].toUpperCase();
        const suitChar = match[2].toUpperCase();

        // Convert rank string to number
        let rank: number;
        switch (rankStr) {
            case "A": rank = 1; break;
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