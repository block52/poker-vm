import TexasHoldemGame from "../engine/texasHoldem";
import { GameOptions, PlayerActionType, NonPlayerActionType, TexasHoldemRound, PlayerStatus } from "@bitcoinbrisbane/block52";
import { Player } from "../models/player";
import { ONE_TOKEN, TWO_TOKENS } from "./testConstants";
import { ethers } from "ethers";

describe("hasRoundEnded", () => {
    let game: TexasHoldemGame;
    let gameOptions: GameOptions;

    const PLAYER_1 = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";
    const PLAYER_2 = "0x980b8D8A16f5891F41871d878a479d81Da52334c";

    beforeEach(() => {
        gameOptions = {
            minBuyIn: 100n * ONE_TOKEN,
            maxBuyIn: 1000n * ONE_TOKEN,
            maxPlayers: 9,
            minPlayers: 2,
            smallBlind: ONE_TOKEN,
            bigBlind: TWO_TOKENS,
            timeout: 30000
        };

        game = new TexasHoldemGame(
            "0x123",
            gameOptions,
            1, // dealer position
            [], // previous actions
            1, // hand number
            0, // action count
            TexasHoldemRound.ANTE
        );

        // Add two players
        const player1 = new Player(PLAYER_1, undefined, 100n * ONE_TOKEN, undefined, PlayerStatus.ACTIVE);
        const player2 = new Player(PLAYER_2, undefined, 100n * ONE_TOKEN, undefined, PlayerStatus.ACTIVE);

        game.joinAtSeat(player1, 2);
        game.joinAtSeat(player2, 3);

        // Check initial game state
        expect(game.players.size).toBe(2);
        expect(game.currentRound).toBe(TexasHoldemRound.ANTE);
        expect(game.currentPlayerId).toBe(ethers.ZeroAddress);
        expect(game.smallBlindPosition).toBe(2);
        expect(game.bigBlindPosition).toBe(3);
        expect(game.getPlayerSeatNumber(PLAYER_1)).toBe(2);
        expect(game.getPlayerSeatNumber(PLAYER_2)).toBe(3);
    });

    describe("ANTE round", () => {
        it("should not end without blinds", () => {
            expect(game.hasRoundEnded(TexasHoldemRound.ANTE)).toBe(false);
        });

        it("should not end with only small blind", () => {
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 1);
            expect(game.hasRoundEnded(TexasHoldemRound.ANTE)).toBe(false);
        });

        it("should not end with both blinds but no deal", () => {
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 1);
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 2);
            expect(game.hasRoundEnded(TexasHoldemRound.ANTE)).toBe(false);
        });

        it("should end with both blinds and deal", () => {
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 1);
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 2);
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 3);
            expect(game.hasRoundEnded(TexasHoldemRound.ANTE)).toBe(true);
        });
    });

    describe("PREFLOP round", () => {
        beforeEach(() => {
            // Set up blinds and deal to get to PREFLOP
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 1);
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 2);
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 3);

            // Check that we are now in PREFLOP
            expect(game.currentRound).toBe(TexasHoldemRound.PREFLOP);
        });

        it("should end when both players check", () => {
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 4);
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 5);
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(true);
        });

        it("should not end when only one player has acted", () => {
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 4);
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it("should not end when player bets and other hasn't responded", () => {
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 4);
            game.performAction(PLAYER_2, PlayerActionType.BET, 5, TWO_TOKENS);
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it("should end when player bets and other calls", () => {
            game.performAction(PLAYER_1, PlayerActionType.CALL, 4);
            game.performAction(PLAYER_2, PlayerActionType.BET, 5, TWO_TOKENS);
            game.performAction(PLAYER_1, PlayerActionType.CALL, 6);
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(true);
        });

        it("should end when player raises and other calls", () => {
            game.performAction(PLAYER_1, PlayerActionType.CALL, 4);
            game.performAction(PLAYER_2, PlayerActionType.RAISE, 5, TWO_TOKENS);
            game.performAction(PLAYER_1, PlayerActionType.CALL, 6);
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(true);
        });
    });

    describe("POST-FLOP rounds (FLOP/TURN/RIVER)", () => {
        beforeEach(() => {
            // Set up to get to FLOP
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 1);
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 2);
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 3);
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 4);
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 5);
            // Now we should be on FLOP
        });

        it("should end when both players check", () => {
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 6);
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 7);
            expect(game.hasRoundEnded(TexasHoldemRound.FLOP)).toBe(true);
        });

        it("should not end when player checks, other bets, first hasnt responded", () => {
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 6);
            game.performAction(PLAYER_2, PlayerActionType.BET, 7, TWO_TOKENS);
            expect(game.hasRoundEnded(TexasHoldemRound.FLOP)).toBe(false);
        });

        it("should end when player checks, other bets, first calls", () => {
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 6);
            game.performAction(PLAYER_2, PlayerActionType.BET, 7, TWO_TOKENS);
            game.performAction(PLAYER_1, PlayerActionType.CALL, 8);
            expect(game.hasRoundEnded(TexasHoldemRound.FLOP)).toBe(true);
        });
    });

    describe("SHOWDOWN round", () => {
        beforeEach(() => {
            // Set up to get to SHOWDOWN by checking through all rounds
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 1);
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 2);
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 3);

            // PREFLOP - both check
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 4);
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 5);

            // FLOP - both check
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 6);
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 7);

            // TURN - both check
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 8);
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 9);

            // RIVER - both check
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 10);
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 11);

            // Should now be at SHOWDOWN
        });

        it("should not end when no players have acted", () => {
            expect(game.hasRoundEnded(TexasHoldemRound.SHOWDOWN)).toBe(false);
        });

        it("should not end when only one player has shown", () => {
            game.performAction(PLAYER_1, PlayerActionType.SHOW, 12);
            expect(game.hasRoundEnded(TexasHoldemRound.SHOWDOWN)).toBe(false);
        });

        it("should end when both players show", () => {
            game.performAction(PLAYER_1, PlayerActionType.SHOW, 12);
            game.performAction(PLAYER_2, PlayerActionType.SHOW, 13);
            expect(game.hasRoundEnded(TexasHoldemRound.SHOWDOWN)).toBe(true);
        });

        // Not going to allow both players to muck in SHOWDOWN
        it.skip("should end when both players muck", () => {
            game.performAction(PLAYER_1, PlayerActionType.MUCK, 12);
            game.performAction(PLAYER_2, PlayerActionType.MUCK, 13);
            expect(game.hasRoundEnded(TexasHoldemRound.SHOWDOWN)).toBe(true);
        });

        it("should end when one shows and one mucks", () => {
            game.performAction(PLAYER_1, PlayerActionType.SHOW, 12);
            game.performAction(PLAYER_2, PlayerActionType.MUCK, 13);
            expect(game.hasRoundEnded(TexasHoldemRound.SHOWDOWN)).toBe(true);
        });
    });

    describe("Edge cases", () => {
        it("should end immediately if only one player remains", () => {
            // Add players then fold one
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 1);
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 2);
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 3);
            game.performAction(PLAYER_1, PlayerActionType.FOLD, 4);

            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(true);
        });

        // Not going to allow last player to fold
        it.skip("should end immediately if no active players", () => {
            // Both players fold
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 1);
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 2);
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 3);
            game.performAction(PLAYER_1, PlayerActionType.FOLD, 4);
            game.performAction(PLAYER_2, PlayerActionType.FOLD, 5);

            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(true);
        });
    });
});
