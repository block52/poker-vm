// Note: This is a framework for zero-knowledge proofs
// To use this, install snarkjs: npm install snarkjs
// import * as snarkjs from "snarkjs";
import { Deck } from "../models/deck";
import { createHash } from "crypto";
import * as path from "path";
import * as fs from "fs";

export interface ShuffleProofInputs {
    originalDeck: number[];
    shuffledDeck: number[];
    seeds: number[];
    seedHash: number;
}

export interface ShuffleProof {
    proof: any;
    publicSignals: number[];
}

export interface ShuffleVerificationResult {
    isValid: boolean;
    error?: string;
}

export class FisherYatesZKProof {
    private circuitPath: string;
    private wasmPath: string;
    private zkeyPath: string;
    private vkeyPath: string;

    constructor() {
        const zkpDir = path.join(__dirname, "../zkp");
        this.circuitPath = path.join(zkpDir, "circuits/fisherYatesShuffle.circom");
        this.wasmPath = path.join(zkpDir, "build/fisherYatesShuffle.wasm");
        this.zkeyPath = path.join(zkpDir, "build/fisherYatesShuffle_final.zkey");
        this.vkeyPath = path.join(zkpDir, "build/verification_key.json");
    }

    /**
     * Generate a zero-knowledge proof for a Fisher-Yates shuffle
     */
    async generateProof(
        originalDeck: number[],
        shuffledDeck: number[],
        seeds: number[]
    ): Promise<ShuffleProof> {
        try {
            // Validate inputs
            this.validateInputs(originalDeck, shuffledDeck, seeds);

            // Calculate seed hash (simplified - in practice use proper hash)
            const seedHash = this.calculateSeedHash(seeds);

            // Prepare circuit inputs
            const circuitInputs: ShuffleProofInputs = {
                originalDeck,
                shuffledDeck,
                seeds,
                seedHash
            };

            // TODO: Implement with snarkjs when dependency is added
            // const { witness } = await snarkjs.wtns.calculate(
            //     circuitInputs,
            //     this.wasmPath
            // );

            // const { proof, publicSignals } = await snarkjs.groth16.prove(
            //     this.zkeyPath,
            //     witness
            // );

            // For now, return a mock proof structure
            const mockProof = {
                pi_a: ["0", "0", "1"],
                pi_b: [["0", "0"], ["0", "0"], ["1", "0"]],
                pi_c: ["0", "0", "1"],
                protocol: "groth16"
            };

            const mockPublicSignals = [...shuffledDeck, seedHash, 1];

            return { proof: mockProof, publicSignals: mockPublicSignals };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to generate shuffle proof: ${errorMessage}`);
        }
    }

    /**
     * Verify a Fisher-Yates shuffle proof
     */
    async verifyProof(
        proof: any,
        publicSignals: number[],
        shuffledDeck: number[],
        seedHash: number
    ): Promise<ShuffleVerificationResult> {
        try {
            // TODO: Implement with snarkjs when dependency is added
            // const vKey = JSON.parse(fs.readFileSync(this.vkeyPath, 'utf8'));
            // const isValid = await snarkjs.groth16.verify(
            //     vKey,
            //     publicSignals,
            //     proof
            // );

            // For now, perform basic validation
            const expectedPublicSignals = [...shuffledDeck, seedHash, 1];

            if (publicSignals.length !== expectedPublicSignals.length) {
                return {
                    isValid: false,
                    error: "Public signals length mismatch"
                };
            }

            // Check if public signals match expected values
            for (let i = 0; i < expectedPublicSignals.length - 1; i++) {
                if (publicSignals[i] !== expectedPublicSignals[i]) {
                    return {
                        isValid: false,
                        error: `Public signal mismatch at index ${i}`
                    };
                }
            }

            // Check if the proof indicates a valid shuffle
            if (publicSignals[publicSignals.length - 1] !== 1) {
                return {
                    isValid: false,
                    error: "Proof indicates invalid shuffle"
                };
            }

            return { isValid: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                isValid: false,
                error: `Verification failed: ${errorMessage}`
            };
        }
    }

    /**
     * Generate proof for an existing Deck shuffle
     */
    async generateDeckShuffleProof(deck: Deck, seeds: number[]): Promise<ShuffleProof> {
        // Create original ordered deck
        const originalDeck = Array.from({ length: 52 }, (_, i) => i);

        // Get the current deck state (shuffled) using the deck's string representation
        const shuffledDeck = this.getDeckAsNumbers(deck);

        return this.generateProof(originalDeck, shuffledDeck, seeds);
    }

    /**
     * Verify that a shuffle was performed correctly using zero-knowledge proof
     */
    async verifyDeckShuffle(
        deck: Deck,
        proof: any,
        publicSignals: number[],
        seedHash: number
    ): Promise<ShuffleVerificationResult> {
        const shuffledDeck = this.getDeckAsNumbers(deck);
        return this.verifyProof(proof, publicSignals, shuffledDeck, seedHash);
    }

    /**
     * Get deck cards as numbers by parsing the deck's string representation
     */
    private getDeckAsNumbers(deck: Deck): number[] {
        const deckString = deck.toString();
        const cardMnemonics = deckString.split('-').map(card => {
            // Remove brackets if present (indicates top card)
            return card.replace(/[\[\]]/g, '');
        });

        return cardMnemonics.map(mnemonic => this.cardMnemonicToNumber(mnemonic));
    }

    /**
     * Convert card mnemonic (like "AS", "2H") to number
     */
    private cardMnemonicToNumber(mnemonic: string): number {
        const suits = ['C', 'D', 'H', 'S']; // Clubs, Diamonds, Hearts, Spades
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];

        const rankChar = mnemonic.slice(0, -1);
        const suitChar = mnemonic.slice(-1);

        const rank = ranks.indexOf(rankChar);
        const suit = suits.indexOf(suitChar);

        if (rank === -1 || suit === -1) {
            throw new Error(`Invalid card mnemonic: ${mnemonic}`);
        }

        return suit * 13 + rank;
    }

    /**
     * Setup the circuit (compile and generate proving/verification keys)
     * This should be run once during initialization
     */
    async setupCircuit(): Promise<void> {
        try {
            const zkpDir = path.join(__dirname, "../zkp");
            const buildDir = path.join(zkpDir, "build");

            // Create build directory if it doesn't exist
            if (!fs.existsSync(buildDir)) {
                fs.mkdirSync(buildDir, { recursive: true });
            }

            console.log("Setting up Fisher-Yates ZK circuit...");
            console.log("To complete setup, install circom and snarkjs, then run:");
            console.log(`1. npm install snarkjs`);
            console.log(`2. circom ${this.circuitPath} --wasm --r1cs -o ${buildDir}`);
            console.log(`3. Generate trusted setup parameters and proving keys`);
            console.log(`   See setup instructions in the circuit comments`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Circuit setup failed: ${errorMessage}`);
        }
    }

    /**
     * Check if the circuit is properly set up
     */
    isSetup(): boolean {
        return fs.existsSync(this.wasmPath) &&
            fs.existsSync(this.zkeyPath) &&
            fs.existsSync(this.vkeyPath);
    }

    private validateInputs(originalDeck: number[], shuffledDeck: number[], seeds: number[]): void {
        if (originalDeck.length !== 52) {
            throw new Error("Original deck must have 52 cards");
        }

        if (shuffledDeck.length !== 52) {
            throw new Error("Shuffled deck must have 52 cards");
        }

        if (seeds.length !== 52) {
            throw new Error("Seeds array must have 52 elements");
        }

        // Check that both decks contain the same cards (permutation)
        const originalSet = new Set(originalDeck);
        const shuffledSet = new Set(shuffledDeck);

        if (originalSet.size !== 52 || shuffledSet.size !== 52) {
            throw new Error("Decks must contain unique cards");
        }

        for (const card of originalDeck) {
            if (!shuffledSet.has(card)) {
                throw new Error("Shuffled deck must be a permutation of original deck");
            }
        }
    }

    private calculateSeedHash(seeds: number[]): number {
        // Simplified hash - in practice use SHA256 or Poseidon hash
        return seeds.reduce((sum, seed) => sum + seed, 0) % (2 ** 32);
    }

    private cardToNumber(card: any): number {
        // Convert card object to number representation
        if (typeof card === 'number') return card;

        // If card has rank and suit properties
        if (card.rank !== undefined && card.suit !== undefined) {
            return card.suit * 13 + card.rank;
        }

        // If card is a string like "AS", "2H", etc.
        if (typeof card === 'string') {
            return this.cardMnemonicToNumber(card);
        }

        throw new Error(`Unsupported card format: ${card}`);
    }
}

// Export convenience functions
export async function generateShuffleProof(
    originalDeck: number[],
    shuffledDeck: number[],
    seeds: number[]
): Promise<ShuffleProof> {
    const zkProof = new FisherYatesZKProof();
    return zkProof.generateProof(originalDeck, shuffledDeck, seeds);
}

export async function verifyShuffleProof(
    proof: any,
    publicSignals: number[],
    shuffledDeck: number[],
    seedHash: number
): Promise<ShuffleVerificationResult> {
    const zkProof = new FisherYatesZKProof();
    return zkProof.verifyProof(proof, publicSignals, shuffledDeck, seedHash);
}

export async function setupZKCircuit(): Promise<void> {
    const zkProof = new FisherYatesZKProof();
    await zkProof.setupCircuit();
}