/**
 * Simple wallet utilities for Cosmos without CosmJS dependencies
 */
import * as crypto from "crypto-js";

// Standard BIP39 word list (first 50 words for demo - in production use full list)
const BIP39_WORDS = [
    "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse",
    "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
    "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit",
    "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
    "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert",
    // In production, include all 2048 BIP39 words
    "all", "allow", "almost", "alone", "alpha", "already", "also", "alter", "always", "amateur",
    "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry",
    "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique", "anxiety", "any",
    "apart", "apology", "appear", "apple", "approve", "april", "area", "arena", "argue", "arm",
    "armed", "armor", "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "article"
];

export interface SimpleWallet {
    mnemonic: string;
    address: string;
}

/**
 * Generate a simple mnemonic phrase (demo version)
 * Note: This is a simplified version for demo purposes.
 * In production, use a proper BIP39 library with entropy and validation.
 */
export function generateMnemonic(wordCount: number = 24): string {
    const words: string[] = [];

    for (let i = 0; i < wordCount; i++) {
        const randomIndex = Math.floor(Math.random() * BIP39_WORDS.length);
        words.push(BIP39_WORDS[randomIndex]);
    }

    return words.join(" ");
}

/**
 * Derive a Cosmos address from mnemonic (simplified)
 * Note: This is a demo implementation. In production, use proper 
 * BIP32/BIP44 derivation with secp256k1 and bech32 encoding.
 */
export function deriveAddressFromMnemonic(mnemonic: string, prefix: string = "b52"): string {
    // Simple demo address generation using hash of mnemonic
    // In production, use proper BIP44 derivation path m/44'/118'/0'/0/0
    const hash = crypto.SHA256(mnemonic).toString();
    const addressBytes = hash.substring(0, 40); // Take first 20 bytes (40 hex chars)

    // Simple bech32-like encoding (demo only)
    return `${prefix}1${addressBytes}`;
}

/**
 * Create a wallet from mnemonic
 */
export function createWalletFromMnemonic(mnemonic: string, prefix: string = "b52"): SimpleWallet {
    return {
        mnemonic,
        address: deriveAddressFromMnemonic(mnemonic, prefix)
    };
}

/**
 * Generate a new wallet
 */
export function generateWallet(prefix: string = "b52", wordCount: number = 24): SimpleWallet {
    const mnemonic = generateMnemonic(wordCount);
    return createWalletFromMnemonic(mnemonic, prefix);
}

/**
 * Validate mnemonic format (basic validation)
 */
export function validateMnemonic(mnemonic: string): boolean {
    if (!mnemonic.trim()) return false;

    const words = mnemonic.trim().split(/\s+/);
    const validWordCounts = [12, 15, 18, 21, 24];

    if (!validWordCounts.includes(words.length)) return false;

    // Check that all words are in our word list (simplified check)
    return words.every(word => BIP39_WORDS.includes(word.toLowerCase()));
}