import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { stringToPath } from "@cosmjs/crypto";

/**
 * Cosmos wallet utilities for Block52 Poker VM
 */

export interface WalletInfo {
    mnemonic: string;
    address: string;
    wallet: DirectSecp256k1HdWallet;
}

/**
 * Standard Cosmos HD path for Block52
 * m/44'/118'/0'/0/0 is the standard Cosmos derivation path
 */
export const BLOCK52_HD_PATH = stringToPath("m/44'/118'/0'/0/0");

/**
 * Generate a new wallet with a random mnemonic
 * @param prefix Address prefix (default: "b52")
 * @param wordCount Number of words in mnemonic (12 or 24, default: 24)
 * @returns WalletInfo object with mnemonic, address, and wallet instance
 */
export async function generateWallet(
    prefix: string = "b52",
    wordCount: 12 | 24 = 24
): Promise<WalletInfo> {
    // Generate a new wallet with random mnemonic
    const wallet = await DirectSecp256k1HdWallet.generate(wordCount, {
        prefix,
        hdPaths: [BLOCK52_HD_PATH]
    });

    const mnemonic = wallet.mnemonic;
    const [account] = await wallet.getAccounts();

    return {
        mnemonic,
        address: account.address,
        wallet
    };
}

/**
 * Create a wallet from an existing mnemonic
 * @param mnemonic The seed phrase (12 or 24 words)
 * @param prefix Address prefix (default: "b52")
 * @returns WalletInfo object with mnemonic, address, and wallet instance
 */
export async function createWalletFromMnemonic(
    mnemonic: string,
    prefix: string = "b52"
): Promise<WalletInfo> {
    // Create wallet from mnemonic
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix,
        hdPaths: [BLOCK52_HD_PATH]
    });

    const [account] = await wallet.getAccounts();

    return {
        mnemonic,
        address: account.address,
        wallet
    };
}

/**
 * Validate a mnemonic phrase
 * @param mnemonic The seed phrase to validate
 * @returns true if valid, false otherwise
 */
export function isValidMnemonic(mnemonic: string): boolean {
    if (!mnemonic || typeof mnemonic !== "string") return false;

    const words = mnemonic.trim().split(/\s+/);
    const validWordCounts = [12, 15, 18, 21, 24];

    return validWordCounts.includes(words.length);
}

/**
 * Get address from mnemonic without creating full wallet instance
 * Useful for quick address lookups
 * @param mnemonic The seed phrase
 * @param prefix Address prefix (default: "b52")
 * @returns The derived address
 */
export async function getAddressFromMnemonic(
    mnemonic: string,
    prefix: string = "b52"
): Promise<string> {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix,
        hdPaths: [BLOCK52_HD_PATH]
    });

    const [account] = await wallet.getAccounts();
    return account.address;
}
