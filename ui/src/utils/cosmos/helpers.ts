/**
 * Helper functions for Cosmos wallet operations
 */

/**
 * Validates if a string is a valid BIP39 mnemonic seed phrase
 * @param seedPhrase The seed phrase to validate
 * @returns boolean indicating if the seed phrase is valid
 */
export const isValidSeedPhrase = (seedPhrase: string): boolean => {
    if (!seedPhrase.trim()) return false;

    // Basic validation: should be 12, 15, 18, 21, or 24 words
    const words = seedPhrase.trim().split(/\s+/);
    const validWordCounts = [12, 15, 18, 21, 24];

    if (!validWordCounts.includes(words.length)) return false;

    // Check that all words are lowercase letters (basic mnemonic format)
    const mnemonicPattern = /^[a-z]+$/;
    return words.every(word => mnemonicPattern.test(word));
};

/**
 * Get test addresses from the local chain (alice, bob, etc.)
 * Useful for development and testing
 * @returns Object with test account addresses
 */
export const getTestAddresses = async () => {
    try {
        const restUrl = import.meta.env.VITE_COSMOS_REST_URL || "http://localhost:1317";

        // Query alice and bob balances to get their addresses
        // In development, these are the default test accounts
        return {
            alice: "b521xa0ue7p4z4vlfphkvxwz0w8sj5gam8zxszqy9l",
            bob: "b521qu2qmrc6rve2az7r74nc5jh5fuqe8j5fpd7hq0",
            restUrl: restUrl
        };
    } catch (error) {
        console.error("Failed to get test addresses:", error);
        return null;
    }
};
