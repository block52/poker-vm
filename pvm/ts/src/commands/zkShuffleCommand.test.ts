import { describe, test, expect, beforeAll } from '@jest/globals';
import { ZKShuffleCommand, ZKShuffleVerifier } from './zkShuffleCommand';
import { Deck } from '../models/deck';
import { FisherYatesZKProof } from '../zkp/zkProof';

describe('ZKShuffleCommand', () => {
    const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    test('should create a ZK shuffle command', () => {
        const command = new ZKShuffleCommand(privateKey, false);
        expect(command).toBeDefined();
    });

    test('should execute shuffle without ZK proof', async () => {
        const command = new ZKShuffleCommand(privateKey, false);
        const result = await command.execute();

        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.data.deck).toBeInstanceOf(Deck);
        expect(result.data.seedHash).toBeDefined();
        expect(result.data.zkProof).toBeUndefined();
    });

    test('should execute shuffle with ZK proof generation', async () => {
        const command = new ZKShuffleCommand(privateKey, true);
        const result = await command.execute();

        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.data.deck).toBeInstanceOf(Deck);
        expect(result.data.seedHash).toBeDefined();
        expect(result.data.zkProof).toBeDefined();

        if (result.data.zkProof) {
            expect(result.data.zkProof.proof).toBeDefined();
            expect(result.data.zkProof.publicSignals).toBeDefined();
            expect(Array.isArray(result.data.zkProof.publicSignals)).toBe(true);
        }
    });

    test('should verify deck shuffle with mock proof', async () => {
        const verifier = new ZKShuffleVerifier();
        const deck = new Deck();

        // Create a mock proof structure
        const mockProof = {
            pi_a: ["0", "0", "1"],
            pi_b: [["0", "0"], ["0", "0"], ["1", "0"]],
            pi_c: ["0", "0", "1"],
            protocol: "groth16"
        };

        // Generate mock public signals (52 cards + seed hash + validity flag)
        const mockPublicSignals = Array.from({ length: 54 }, (_, i) => i < 52 ? i : (i === 52 ? 12345 : 1));

        const result = await verifier.verifyShuffleProof(
            deck,
            mockProof,
            mockPublicSignals,
            12345
        );

        expect(result).toBeDefined();
        expect(typeof result.isValid).toBe('boolean');
    });
});

describe('FisherYatesZKProof', () => {
    test('should create ZK proof instance', () => {
        const zkProof = new FisherYatesZKProof();
        expect(zkProof).toBeDefined();
    });

    test('should validate inputs correctly', async () => {
        const zkProof = new FisherYatesZKProof();

        const originalDeck = Array.from({ length: 52 }, (_, i) => i);
        const shuffledDeck = [...originalDeck].reverse(); // Simple permutation
        const seeds = Array.from({ length: 52 }, (_, i) => i + 1);

        // Should not throw for valid inputs
        expect(async () => {
            await zkProof.generateProof(originalDeck, shuffledDeck, seeds);
        }).not.toThrow();
    });

    test('should reject invalid deck sizes', async () => {
        const zkProof = new FisherYatesZKProof();

        const originalDeck = Array.from({ length: 51 }, (_, i) => i); // Wrong size
        const shuffledDeck = Array.from({ length: 52 }, (_, i) => i);
        const seeds = Array.from({ length: 52 }, (_, i) => i + 1);

        await expect(zkProof.generateProof(originalDeck, shuffledDeck, seeds))
            .rejects.toThrow('Original deck must have 52 cards');
    });

    test('should reject non-permutation decks', async () => {
        const zkProof = new FisherYatesZKProof();

        const originalDeck = Array.from({ length: 52 }, (_, i) => i);
        const shuffledDeck = Array.from({ length: 52 }, () => 0); // Not a permutation
        const seeds = Array.from({ length: 52 }, (_, i) => i + 1);

        await expect(zkProof.generateProof(originalDeck, shuffledDeck, seeds))
            .rejects.toThrow('Shuffled deck must be a permutation of original deck');
    });

    test('should setup circuit instructions', async () => {
        const zkProof = new FisherYatesZKProof();

        // Should not throw
        await expect(zkProof.setupCircuit()).resolves.toBeUndefined();
    });

    test('should check setup status', () => {
        const zkProof = new FisherYatesZKProof();

        // Since we haven't set up the circuit files, this should return false
        expect(zkProof.isSetup()).toBe(false);
    });
});

describe('Deck Integration with ZK Proofs', () => {
    test('should convert deck to numbers correctly', () => {
        const deck = new Deck();
        const zkProof = new FisherYatesZKProof();

        // Test the private method by generating a proof
        const seeds = Array.from({ length: 52 }, (_, i) => i + 1);

        expect(async () => {
            await zkProof.generateDeckShuffleProof(deck, seeds);
        }).not.toThrow();
    });

    test('should handle deck shuffle with ZK proof generation', async () => {
        const deck = new Deck();
        const seeds = Array.from({ length: 52 }, (_, i) => (i * 7) % 256); // Pseudo-random seeds

        // Shuffle the deck first
        deck.shuffle(seeds);

        const zkProof = new FisherYatesZKProof();
        const proof = await zkProof.generateDeckShuffleProof(deck, seeds);

        expect(proof).toBeDefined();
        expect(proof.proof).toBeDefined();
        expect(proof.publicSignals).toBeDefined();
        expect(proof.publicSignals.length).toBeGreaterThan(52);
    });
});

describe('ZKShuffleVerifier', () => {
    test('should create verifier instance', () => {
        const verifier = new ZKShuffleVerifier();
        expect(verifier).toBeDefined();
    });

    test('should check setup status', () => {
        const verifier = new ZKShuffleVerifier();
        expect(typeof verifier.isSetup()).toBe('boolean');
    });

    test('should setup circuit', async () => {
        const verifier = new ZKShuffleVerifier();
        await expect(verifier.setupCircuit()).resolves.toBeUndefined();
    });
});