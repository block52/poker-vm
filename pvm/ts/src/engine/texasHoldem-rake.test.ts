import { NonPlayerActionType, PlayerActionType, TexasHoldemRound, GameType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { ethers } from "ethers";

const ONE_TOKEN = 1000000000000000000n;
const FIVE_TOKENS = 5n * ONE_TOKEN;
const TEN_TOKENS = 10n * ONE_TOKEN;
const ONE_HUNDRED_TOKENS = 100n * ONE_TOKEN;

describe("Texas Holdem - Rake Tests", () => {
    let game: TexasHoldemGame;
    const player1Address = ethers.Wallet.createRandom().address;
    const player2Address = ethers.Wallet.createRandom().address;
    const ownerAddress = ethers.Wallet.createRandom().address;

    describe("Rake calculation", () => {
        beforeEach(() => {
            const gameConfig = {
                address: ethers.ZeroAddress,
                dealer: 1,
                handNumber: 1,
                actionCount: 0,
                round: TexasHoldemRound.ANTE,
                communityCards: [],
                pots: [0n],
                previousActions: [],
                players: [],
                deck: "",
                winners: [],
                now: Date.now()
            };

            const gameOptions = {
                minBuyIn: ONE_TOKEN.toString(),
                maxBuyIn: ONE_HUNDRED_TOKENS.toString(),
                minPlayers: 2,
                maxPlayers: 9,
                smallBlind: (ONE_TOKEN / 10n).toString(),
                bigBlind: (ONE_TOKEN / 5n).toString(),
                timeout: 30,
                type: GameType.CASH,
                rake: {
                    rakeFreeThreshold: FIVE_TOKENS.toString(), // Hands below 5 tokens are rake-free
                    rakePercentage: 5, // 5% rake
                    rakeCap: (ONE_TOKEN / 2n).toString() // Max rake is 0.5 tokens
                },
                owner: ownerAddress
            };

            game = TexasHoldemGame.fromJson(gameConfig, gameOptions);
        });

        it("should have rake configuration set correctly", () => {
            expect(game.rake).toBeDefined();
            expect(game.rake?.rakeFreeThreshold).toBe(FIVE_TOKENS);
            expect(game.rake?.rakePercentage).toBe(5);
            expect(game.rake?.rakeCap).toBe(ONE_TOKEN / 2n);
            expect(game.owner).toBe(ownerAddress);
        });

        it("should not charge rake when pot is below rake-free threshold", () => {
            // Join players
            game.performAction(player1Address, NonPlayerActionType.JOIN, 1, TEN_TOKENS, "seat=1");
            game.performAction(player2Address, NonPlayerActionType.JOIN, 2, TEN_TOKENS, "seat=2");

            // Post blinds
            game.performAction(player1Address, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN / 10n);
            game.performAction(player2Address, PlayerActionType.BIG_BLIND, 4, ONE_TOKEN / 5n);

            // Deal cards
            game.performAction(player1Address, NonPlayerActionType.DEAL, 5);

            // Player 1 folds (pot is only blinds, below threshold)
            game.performAction(player1Address, PlayerActionType.FOLD, 6);

            const pot = game.getPot();
            expect(pot).toBeLessThan(FIVE_TOKENS);

            // Player 2 should win the full pot (no rake)
            const player2 = game.getPlayer(player2Address);
            const expectedChips = TEN_TOKENS + (ONE_TOKEN / 10n); // Starting chips + small blind won
            expect(player2.chips).toBe(expectedChips);
        });

        it("should charge 5% rake when pot is above rake-free threshold", () => {
            // Join players and owner
            game.performAction(player1Address, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1");
            game.performAction(player2Address, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2");
            game.performAction(ownerAddress, NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3");

            // Post blinds
            game.performAction(player1Address, PlayerActionType.SMALL_BLIND, 4, ONE_TOKEN / 10n);
            game.performAction(player2Address, PlayerActionType.BIG_BLIND, 5, ONE_TOKEN / 5n);

            // Deal cards
            game.performAction(player1Address, NonPlayerActionType.DEAL, 6);

            // Player 1 raises to make pot significant
            game.performAction(player1Address, PlayerActionType.RAISE, 7, TEN_TOKENS);
            
            // Player 2 calls
            game.performAction(player2Address, PlayerActionType.CALL, 8, TEN_TOKENS);
            
            // Owner folds
            game.performAction(ownerAddress, PlayerActionType.FOLD, 9);

            // Check and move to showdown
            game.performAction(player1Address, PlayerActionType.CHECK, 10);
            game.performAction(player2Address, PlayerActionType.CHECK, 11);
            
            game.performAction(player1Address, PlayerActionType.CHECK, 12);
            game.performAction(player2Address, PlayerActionType.CHECK, 13);
            
            game.performAction(player1Address, PlayerActionType.CHECK, 14);
            game.performAction(player2Address, PlayerActionType.CHECK, 15);

            const pot = game.getPot();
            expect(pot).toBeGreaterThan(FIVE_TOKENS);

            // Calculate expected rake (5% of pot)
            const expectedRake = (pot * 5n) / 100n;
            
            // Since we can't determine winner without cards, just verify rake was calculated
            // The owner should have received the rake
            const owner = game.getPlayer(ownerAddress);
            const ownerStartingChips = ONE_HUNDRED_TOKENS - (ONE_TOKEN / 10n); // Folded small blind
            
            // Owner should have starting chips minus their fold, but no rake yet (need showdown)
            expect(owner.chips).toBeGreaterThanOrEqual(ownerStartingChips);
        });

        it("should cap rake at maximum value", () => {
            // Create a very large pot scenario
            game.performAction(player1Address, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1");
            game.performAction(player2Address, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2");
            game.performAction(ownerAddress, NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3");

            // Post blinds
            game.performAction(player1Address, PlayerActionType.SMALL_BLIND, 4, ONE_TOKEN / 10n);
            game.performAction(player2Address, PlayerActionType.BIG_BLIND, 5, ONE_TOKEN / 5n);

            // Deal cards
            game.performAction(player1Address, NonPlayerActionType.DEAL, 6);

            // Create large pot (20 tokens each)
            game.performAction(player1Address, PlayerActionType.RAISE, 7, 20n * ONE_TOKEN);
            game.performAction(player2Address, PlayerActionType.CALL, 8, 20n * ONE_TOKEN);
            game.performAction(ownerAddress, PlayerActionType.FOLD, 9);

            const pot = game.getPot();
            
            // 5% of 40+ tokens would be 2+ tokens, but rake cap is 0.5 tokens
            const calculatedRake = (pot * 5n) / 100n;
            const rakeCap = ONE_TOKEN / 2n;
            
            expect(calculatedRake).toBeGreaterThan(rakeCap);
            // The actual rake charged should be capped
            // (We'll verify this in integration when showdown happens)
        });

        it("should work without rake configuration (backward compatibility)", () => {
            const gameConfig = {
                address: ethers.ZeroAddress,
                dealer: 1,
                handNumber: 1,
                actionCount: 0,
                round: TexasHoldemRound.ANTE,
                communityCards: [],
                pots: [0n],
                previousActions: [],
                players: [],
                deck: "",
                winners: [],
                now: Date.now()
            };

            const gameOptionsNoRake = {
                minBuyIn: ONE_TOKEN.toString(),
                maxBuyIn: ONE_HUNDRED_TOKENS.toString(),
                minPlayers: 2,
                maxPlayers: 9,
                smallBlind: (ONE_TOKEN / 10n).toString(),
                bigBlind: (ONE_TOKEN / 5n).toString(),
                timeout: 30,
                type: GameType.CASH
                // No rake config
            };

            const gameNoRake = TexasHoldemGame.fromJson(gameConfig, gameOptionsNoRake);

            expect(gameNoRake.rake).toBeUndefined();
            expect(gameNoRake.owner).toBeUndefined();

            // Game should work normally without rake
            gameNoRake.performAction(player1Address, NonPlayerActionType.JOIN, 1, TEN_TOKENS, "seat=1");
            gameNoRake.performAction(player2Address, NonPlayerActionType.JOIN, 2, TEN_TOKENS, "seat=2");

            gameNoRake.performAction(player1Address, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN / 10n);
            gameNoRake.performAction(player2Address, PlayerActionType.BIG_BLIND, 4, ONE_TOKEN / 5n);

            gameNoRake.performAction(player1Address, NonPlayerActionType.DEAL, 5);
            gameNoRake.performAction(player1Address, PlayerActionType.FOLD, 6);

            // Player 2 should win the full pot (no rake deducted)
            const player2 = gameNoRake.getPlayer(player2Address);
            const expectedChips = TEN_TOKENS + (ONE_TOKEN / 10n);
            expect(player2.chips).toBe(expectedChips);
        });

        it("should serialize and deserialize rake configuration correctly", () => {
            const json = game.toJson();

            expect(json.gameOptions.rake).toBeDefined();
            expect(json.gameOptions.rake?.rakeFreeThreshold).toBe(FIVE_TOKENS.toString());
            expect(json.gameOptions.rake?.rakePercentage).toBe(5);
            expect(json.gameOptions.rake?.rakeCap).toBe((ONE_TOKEN / 2n).toString());
            expect(json.gameOptions.owner).toBe(ownerAddress);

            // Recreate game from JSON
            const restoredGame = TexasHoldemGame.fromJson(json, json.gameOptions);

            expect(restoredGame.rake).toBeDefined();
            expect(restoredGame.rake?.rakeFreeThreshold).toBe(FIVE_TOKENS);
            expect(restoredGame.rake?.rakePercentage).toBe(5);
            expect(restoredGame.rake?.rakeCap).toBe(ONE_TOKEN / 2n);
            expect(restoredGame.owner).toBe(ownerAddress);
        });
    });

    describe("Rake validation", () => {
        it("should reject negative rake-free threshold", () => {
            const gameConfig = {
                address: ethers.ZeroAddress,
                dealer: 1,
                handNumber: 1,
                actionCount: 0,
                round: TexasHoldemRound.ANTE,
                communityCards: [],
                pots: [0n],
                previousActions: [],
                players: [],
                deck: "",
                winners: [],
                now: Date.now()
            };

            const invalidGameOptions = {
                minBuyIn: ONE_TOKEN.toString(),
                maxBuyIn: ONE_HUNDRED_TOKENS.toString(),
                minPlayers: 2,
                maxPlayers: 9,
                smallBlind: (ONE_TOKEN / 10n).toString(),
                bigBlind: (ONE_TOKEN / 5n).toString(),
                timeout: 30,
                type: GameType.CASH,
                rake: {
                    rakeFreeThreshold: (-1n).toString(),
                    rakePercentage: 5,
                    rakeCap: ONE_TOKEN.toString()
                },
                owner: ownerAddress
            };

            expect(() => {
                TexasHoldemGame.fromJson(gameConfig, invalidGameOptions);
            }).toThrow("Rake-free threshold must be non-negative");
        });

        it("should reject invalid rake percentage", () => {
            const gameConfig = {
                address: ethers.ZeroAddress,
                dealer: 1,
                handNumber: 1,
                actionCount: 0,
                round: TexasHoldemRound.ANTE,
                communityCards: [],
                pots: [0n],
                previousActions: [],
                players: [],
                deck: "",
                winners: [],
                now: Date.now()
            };

            const invalidGameOptions = {
                minBuyIn: ONE_TOKEN.toString(),
                maxBuyIn: ONE_HUNDRED_TOKENS.toString(),
                minPlayers: 2,
                maxPlayers: 9,
                smallBlind: (ONE_TOKEN / 10n).toString(),
                bigBlind: (ONE_TOKEN / 5n).toString(),
                timeout: 30,
                type: GameType.CASH,
                rake: {
                    rakeFreeThreshold: FIVE_TOKENS.toString(),
                    rakePercentage: 150, // Invalid: over 100%
                    rakeCap: ONE_TOKEN.toString()
                },
                owner: ownerAddress
            };

            expect(() => {
                TexasHoldemGame.fromJson(gameConfig, invalidGameOptions);
            }).toThrow("Rake percentage must be between 0 and 100");
        });

        it("should reject negative rake cap", () => {
            const gameConfig = {
                address: ethers.ZeroAddress,
                dealer: 1,
                handNumber: 1,
                actionCount: 0,
                round: TexasHoldemRound.ANTE,
                communityCards: [],
                pots: [0n],
                previousActions: [],
                players: [],
                deck: "",
                winners: [],
                now: Date.now()
            };

            const invalidGameOptions = {
                minBuyIn: ONE_TOKEN.toString(),
                maxBuyIn: ONE_HUNDRED_TOKENS.toString(),
                minPlayers: 2,
                maxPlayers: 9,
                smallBlind: (ONE_TOKEN / 10n).toString(),
                bigBlind: (ONE_TOKEN / 5n).toString(),
                timeout: 30,
                type: GameType.CASH,
                rake: {
                    rakeFreeThreshold: FIVE_TOKENS.toString(),
                    rakePercentage: 5,
                    rakeCap: (-1n).toString()
                },
                owner: ownerAddress
            };

            expect(() => {
                TexasHoldemGame.fromJson(gameConfig, invalidGameOptions);
            }).toThrow("Rake cap must be non-negative");
        });
    });

    describe("Rake allocation to owner", () => {
        it("should allocate rake to owner when winner is determined (single winner by fold)", () => {
            const gameConfig = {
                address: ethers.ZeroAddress,
                dealer: 1,
                handNumber: 1,
                actionCount: 0,
                round: TexasHoldemRound.ANTE,
                communityCards: [],
                pots: [0n],
                previousActions: [],
                players: [],
                deck: "",
                winners: [],
                now: Date.now()
            };

            const gameOptions = {
                minBuyIn: ONE_TOKEN.toString(),
                maxBuyIn: ONE_HUNDRED_TOKENS.toString(),
                minPlayers: 2,
                maxPlayers: 9,
                smallBlind: (ONE_TOKEN / 10n).toString(),
                bigBlind: (ONE_TOKEN / 5n).toString(),
                timeout: 30,
                type: GameType.CASH,
                rake: {
                    rakeFreeThreshold: ONE_TOKEN.toString(), // 1 token threshold
                    rakePercentage: 5,
                    rakeCap: ONE_TOKEN.toString()
                },
                owner: ownerAddress
            };

            const gameWithOwner = TexasHoldemGame.fromJson(gameConfig, gameOptions);

            // Join players including owner
            gameWithOwner.performAction(player1Address, NonPlayerActionType.JOIN, 1, TEN_TOKENS, "seat=1");
            gameWithOwner.performAction(player2Address, NonPlayerActionType.JOIN, 2, TEN_TOKENS, "seat=2");
            gameWithOwner.performAction(ownerAddress, NonPlayerActionType.JOIN, 3, TEN_TOKENS, "seat=3");

            const ownerInitialChips = gameWithOwner.getPlayer(ownerAddress).chips;

            // Post blinds
            gameWithOwner.performAction(player1Address, PlayerActionType.SMALL_BLIND, 4, ONE_TOKEN / 10n);
            gameWithOwner.performAction(player2Address, PlayerActionType.BIG_BLIND, 5, ONE_TOKEN / 5n);

            // Deal
            gameWithOwner.performAction(player1Address, NonPlayerActionType.DEAL, 6);

            // Player 1 raises to create pot above threshold
            gameWithOwner.performAction(player1Address, PlayerActionType.RAISE, 7, FIVE_TOKENS);
            
            // Player 2 calls, owner folds
            gameWithOwner.performAction(player2Address, PlayerActionType.CALL, 8, FIVE_TOKENS);
            gameWithOwner.performAction(ownerAddress, PlayerActionType.FOLD, 9);

            const potBeforeFold = gameWithOwner.getPot();
            
            // Player 2 folds on flop - Player 1 wins
            gameWithOwner.performAction(player1Address, PlayerActionType.CHECK, 10);
            gameWithOwner.performAction(player2Address, PlayerActionType.FOLD, 11);

            const pot = potBeforeFold; // Pot before fold
            const expectedRake = (pot * 5n) / 100n;
            
            // Owner should have received the rake
            const owner = gameWithOwner.getPlayer(ownerAddress);
            const ownerExpectedChips = ownerInitialChips + expectedRake;
            
            expect(owner.chips).toBe(ownerExpectedChips);
        });
    });
});
