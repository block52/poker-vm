import { PlayerActionType, PlayerStatus, TexasHoldemRound, GameOptions } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { ethers } from "ethers";

describe.only("Texas Holdem Game", () => {

    const TEN_TOKENS = 10000000000000000000n;
    const TWENTY_TOKENS = 20000000000000000000n;
    const FIFTY_TOKENS = 50000000000000000000n;

    const baseGameConfig = {
        address: ethers.ZeroAddress,
        dealer: 0,
        nextToAct: 1,
        currentRound: "preflop",
        communityCards: [],
        pot: 0n,
        players: []
    };

    const gameOptions: GameOptions = {
        minBuyIn: 1000000000000000000n, // 1 ETH or $1
        maxBuyIn: 10000000000000000000n, // 10 ETH or $10
        minPlayers: 2,
        maxPlayers: 9,
        smallBlind: 10000000000000000n, // 0.01 ETH or 1 cent
        bigBlind: 20000000000000000n, // 0.02 ETH or 2 cents
    };

    describe("Game Initialization", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should initialize with correct base properties", () => {
            expect(game.smallBlind).toEqual(10000000000000000n);
            expect(game.bigBlind).toEqual(20000000000000000n);
            expect(game.dealerPosition).toEqual(9);
            expect(game.getPlayerCount()).toEqual(0);
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
            expect(game.pot).toEqual(0n);
        });

        it("should find correct next available seat", () => {
            expect(game.findNextSeat()).toEqual(1);
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            expect(game.findNextSeat()).toEqual(2);
        });

        it("should throw error when table is full", () => {
            for (let i = 1; i <= 9; i++) {
                game.join2(`0x${i}`, TEN_TOKENS);
            }

            expect(() => game.join2("0x9999", TEN_TOKENS)).toThrow("Table full.");
        });

        it("should not be able to join more than once", () => {
            expect(game.findNextSeat()).toEqual(1);
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            expect(() => {
                game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            }).toThrow("Player already joined.");
        });
    });

    describe("Deck initialization", () => {
        it("should initialize with a standard 52 card deck", () => {
            const game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            expect(game).toBeDefined();
            // expect(game.deck.cards.length).toEqual(52);
        });
    });

    describe("Player Management", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should correctly add players", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            expect(game.getPlayerCount()).toEqual(1);
            expect(game.exists("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeTruthy();

            const player1 = game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(player1).toBeDefined();

            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", TEN_TOKENS);
            expect(game.getPlayerCount()).toEqual(2);
            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeTruthy();

            const player2 = game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            expect(player2).toBeDefined();
        });

        it("should not allow duplicate players", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            expect(() => game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS)).toThrow();
        });

        it("should handle player removal", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            game.leave("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(game.exists("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeFalsy();
            expect(game.getPlayerCount()).toEqual(0);
        });

        it("should track player positions correctly", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", TEN_TOKENS);

            expect(game.getPlayerSeatNumber("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toEqual(1);
            expect(game.getPlayerSeatNumber("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toEqual(2);
        });
    });

    describe("Player Turn Validation", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            // Add minimum required players
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", TEN_TOKENS);
        });

        it("should throw error when player acts out of turn", () => {
            // In a new game, the small blind position should act first
            const nextPlayer = game.getNextPlayerToAct();
            expect(nextPlayer?.address).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            // Attempt to act with the wrong player (big blind) should throw an error
            expect(() => {
                game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.SMALL_BLIND);
            }).toThrow("Not player's turn.");
        });

        it("should allow correct player to act", () => {
            // Small blind position should act first
            expect(() => {
                game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND);
            }).not.toThrow();

            // Now big blind should be next to act
            const nextPlayer = game.getNextPlayerToAct();
            expect(nextPlayer?.address).toEqual("0x980b8D8A16f5891F41871d878a479d81Da52334c");

            // Big blind should be able to act now
            expect(() => {
                game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND);
            }).not.toThrow();
        });

        it("should maintain correct turn order through a betting round", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND);

            // After blinds are posted, small blind acts first in preflop
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            // Attempting to act with big blind should throw error
            expect(() => {
                game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK);
            }).toThrow("Not player's turn.");

            // Small blind should be able to act
            expect(() => {
                game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 10000000000000000n);
            }).not.toThrow();

            // Now big blind should be next
            expect(game.getNextPlayerToAct()?.address).toEqual("0x980b8D8A16f5891F41871d878a479d81Da52334c");
        });

        it("should enforce turn order with multiple players", () => {
            // Add a third player
            game.join2("0x3333333333333333333333333333333333333333", TEN_TOKENS);

            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND);

            // Player 3 should act next
            expect(game.getNextPlayerToAct()?.address).toEqual("0x3333333333333333333333333333333333333333");

            // Trying to act with small blind or big blind should fail
            expect(() => {
                game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CHECK);
            }).toThrow("Not player's turn.");

            expect(() => {
                game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK);
            }).toThrow("Not player's turn.");

            // Player 3 should be able to act
            expect(() => {
                game.performAction("0x3333333333333333333333333333333333333333", PlayerActionType.CALL, 20000000000000000n);
            }).not.toThrow();

            // After player 3, small blind should be next
            expect(game.getNextPlayerToAct()?.address).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
        });

        it("should skip folded players when determining next turn", () => {
            // Add a third player
            game.join2("0x3333333333333333333333333333333333333333", TEN_TOKENS);

            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND);

            // Player 3 folds
            game.performAction("0x3333333333333333333333333333333333333333", PlayerActionType.FOLD);

            // Next should be small blind, not player 3 again
            expect(game.getNextPlayerToAct()?.address).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            // Small blind acts
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 10000000000000000n);

            // Big blind should be next, not player 3
            expect(game.getNextPlayerToAct()?.address).toEqual("0x980b8D8A16f5891F41871d878a479d81Da52334c");
        });
    });

    describe("hasRoundEnded function tests", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            // Add minimum required players
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", TEN_TOKENS);
        });

        it("should return false when no blinds have been posted", () => {
            // No actions taken, preflop round shouldn't end
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it("should return false after small blind but no big blind", () => {
            // Only small blind posted
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND);
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it("should return false after both blinds but no additional actions", () => {
            // Both blinds posted, but no player actions yet
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND);

            // Round shouldn't end because first player (small blind) needs to act again
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it("should return false when small blind calls but big blind hasn't acted after", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND);

            // Small blind calls the difference (brings total to BIG_BLIND amount)
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 10000000000000000n);

            // Big blind still needs to act (check or raise)
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it.only("should return true when all players have acted and matched highest bet in preflop", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND);

            // Small blind calls (total bet now matches big blind)
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 10000000000000000n);

            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);

            // Big blind checks (all players have acted and matched highest bet)
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK);

            // Round should end
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(true);
            expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
            expect(game.hasRoundEnded(TexasHoldemRound.FLOP)).toBe(false);
        });

        it("should return false when a player raises and others haven't responded", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND);

            // Small blind raises instead of calling
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.BET, 50000000000000000n);

            // Big blind hasn't responded to the raise
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it.skip("should return true when all players fold except one", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND);

            // Small blind folds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.FOLD);

            // Only one player left active - round should end
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(true);
        });

        it.skip("should handle three player scenarios correctly", () => {
            // Add a third player
            game.join2("0x3333333333333333333333333333333333333333", TEN_TOKENS);

            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND);

            // Third player calls
            game.performAction("0x3333333333333333333333333333333333333333", PlayerActionType.CALL, 20000000000000000n);

            // Small blind folds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.FOLD);

            // Big blind raises
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BET, 20000000000000000n);

            // Round shouldn't end yet - player 3 needs to respond to raise
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);

            // Player 3 calls the raise
            game.performAction("0x3333333333333333333333333333333333333333", PlayerActionType.CALL, 20000000000000000n);

            // Now round should end - all active players have acted and matched highest bet
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(true);
        });

        it.skip("should track actions from previous rounds separately", () => {
            // Post blinds and complete preflop round
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 10000000000000000n);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK);

            // Force round to FLOP (normally would happen automatically)
            // This is a workaround since we can't easily access the private setNextRound method
            const gameAsAny = game as any;
            gameAsAny._currentRound = TexasHoldemRound.FLOP;

            // At start of new round, no actions taken yet
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);

            // Both players check in flop
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CHECK);

            // One player checked but other hasn't - round shouldn't end
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);

            // Other player checks
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK);

            // Now round should end - all players checked
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(true);
        });
    });

    describe("Game Flow", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            // Add minimum required players
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", TEN_TOKENS);

            // no blind have been posted yet
        });

        it("should have correct table properties", () => {
            expect(game.getPlayerCount()).toEqual(2);
        });

        it("should have player status set to active", () => {
            const player1 = game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            const player2 = game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c");

            expect(player1?.status).toEqual(PlayerStatus.ACTIVE);
            expect(player2?.status).toEqual(PlayerStatus.ACTIVE);
        });

        it("should have deducted blinds from players", () => {
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND);

            const player1 = game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            const player2 = game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c");

            expect(player1?.chips).toEqual(9990000000000000000n);
            expect(player2?.chips).toEqual(9980000000000000000n);
            expect(game.pot).toEqual(30000000000000000n);
        });

        it.skip("should automatically progress from ante to preflop when minimum players join", () => {
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
            expect(game.getPlayerCount()).toEqual(2);
        });

        it("should have legal moves for players to post small blind", () => {
            const legalActions = game.getLegalActions("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            expect(legalActions).toContainEqual(expect.objectContaining({
                action: PlayerActionType.SMALL_BLIND
            }));

            expect(legalActions).toContainEqual(expect.objectContaining({
                action: PlayerActionType.FOLD
            }));
        });

        it.skip("should have legal moves for players to post big blind", () => {
            const legalActions = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");

            expect(legalActions).toContainEqual(expect.objectContaining({
                action: PlayerActionType.BIG_BLIND
            }));

            expect(legalActions).toContainEqual(expect.objectContaining({
                action: PlayerActionType.FOLD
            }));
        });

        it("should validate legal actions after blinds", () => {
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND);

            const legalActions1 = game.getLegalActions("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            expect(legalActions1.length).toEqual(5);
            expect(legalActions1).toContainEqual(expect.objectContaining({
                action: PlayerActionType.DEAL
            }));

            expect(legalActions1).toContainEqual(expect.objectContaining({
                action: PlayerActionType.FOLD
            }));

            expect(legalActions1).toContainEqual(expect.objectContaining({
                action: PlayerActionType.CALL,
                min: "10000000000000000",
                max: "10000000000000000"
            }));

            // Get legal actions for big blind
            let legalActions2 = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            expect(legalActions2).toContainEqual(expect.objectContaining({
                action: PlayerActionType.DEAL
            }));

            expect(legalActions2).toContainEqual(expect.objectContaining({
                action: PlayerActionType.FOLD
            }));

            expect(legalActions2).toContainEqual(expect.objectContaining({
                action: PlayerActionType.CHECK
            }));

            expect(legalActions2).toContainEqual(expect.objectContaining({
                action: PlayerActionType.RAISE
            }));

            // Now call from the small blind
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 10000000000000000n);

            // Now big blind should have different legal actions
            // Check, raise, fold
            legalActions2 = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            expect(legalActions2).toContainEqual(expect.objectContaining({
                action: PlayerActionType.FOLD
            }));

            expect(legalActions2).toContainEqual(expect.objectContaining({
                action: PlayerActionType.CHECK
            }));

            expect(legalActions2).toContainEqual(expect.objectContaining({
                action: PlayerActionType.RAISE
            }));
        });
    });

    describe.skip("Complete Game Round", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", TEN_TOKENS);
        });

        it("should complete a full round of play", () => {
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // Big blind should be the last player
            expect(game.currentPlayerId).toEqual("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            const player = game.getNextPlayerToAct();
            expect(player).toBeDefined();
            expect(player?.address).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            // Pre-flop
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 10000000000000000n);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK);

            // Flop
            expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CHECK);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK);

            // Turn
            expect(game.currentRound).toEqual(TexasHoldemRound.TURN);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.BET, FIFTY_TOKENS);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CALL);

            // River
            expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CHECK);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.FOLD);

            // Verify game state after completion
            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);
            expect(game.pot).toBeGreaterThan(0n);
        });
    });
});