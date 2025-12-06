import { NonPlayerActionType, PlayerActionType, TexasHoldemRound, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { ethers } from "ethers";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, mnemonic, getNextTestTimestamp } from "./testConstants";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in a heads-up scenario.
describe("Texas Holdem - Ante - Heads Up", () => {
    describe("PREFLOP game states", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should find next seat", () => {
            expect(game.findNextEmptySeat()).toEqual(1);
        });

        it("should not have player", () => {
            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeFalsy();
        });

        it("should not allow player to join with insufficient funds", () => {
            expect(() => game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 1, 10n, "seat=1", getNextTestTimestamp())).toThrow(
                "Player does not have enough or too many chips to join."
            );
        });

        it("should allow a player to join", () => {
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            expect(game.getPlayerCount()).toEqual(1);
            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeTruthy();
            expect(game.findNextEmptySeat()).toEqual(2);
        });
    });

    describe("After blinds - ANTE to PREFLOP", () => {

        const PLAYER_1 = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
        const PLAYER_2 = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";

        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
        });

        it("should have the correct players pre flop", () => {
            expect(game.getPlayerCount()).toEqual(2);

            expect(game.exists(PLAYER_1)).toBeTruthy();
            expect(game.exists(PLAYER_2)).toBeTruthy();
            expect(game.getPlayer(PLAYER_1)).toBeDefined();
            expect(game.getPlayer(PLAYER_2)).toBeDefined();
        });

        it("should have correct legal actions before posting blinds", () => {
            // Get legal actions for the next player
            const actual = game.getLegalActions(PLAYER_1);
            expect(actual.length).toEqual(2);
            expect(actual[0].action).toEqual(PlayerActionType.SMALL_BLIND);
            expect(actual[1].action).toEqual(PlayerActionType.FOLD);
        });

        it("should have correct legal actions after posting the small blind", () => {
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            // Get legal actions for the next player
            const actual = game.getLegalActions(PLAYER_2);
            expect(actual.length).toEqual(2); // FOLD, BIG_BLIND
            expect(actual[0].action).toEqual(PlayerActionType.BIG_BLIND);
            expect(actual[1].action).toEqual(PlayerActionType.FOLD);
        });

        it("should have correct legal actions after posting the big blind", () => {
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // Get legal actions for the next player 1
            const actual = game.getLegalActions(PLAYER_1);

            expect(actual.length).toEqual(3);
            expect(actual[0].action).toEqual(PlayerActionType.FOLD);
            expect(actual[1].action).toEqual(PlayerActionType.CALL);
            expect(actual[2].action).toEqual(PlayerActionType.RAISE);
        });

        it("should get next to act after the blinds", () => {
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Add a DEAL action to advance from ANTE to PREFLOP
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // Now we're in PREFLOP round, so CALL is a valid action
            game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(PLAYER_2);
        });

        it("should advance to next round after ante round", () => {
            let round = game.currentRound;
            expect(round).toEqual(TexasHoldemRound.ANTE);

            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Add a DEAL action to advance from ANTE to PREFLOP
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            round = game.currentRound;
            expect(round).toEqual(TexasHoldemRound.PREFLOP);
        });
    });

    describe("Heads up end to end", () => {

        const PLAYER_1 = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
        const PLAYER_2 = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";

        let game: TexasHoldemGame;

        beforeEach(() => {
            // Custom mnemonic where Player 1 has AA and Player 2 has KK
            // This ensures Player 1 wins and Player 2 can muck after Player 1 shows
            const customMnemonic =
                "AS-KC-AH-KH-2S-7C-9H-TD-JD-" +                    // Player cards + community
                "2C-3C-4C-5C-6C-8C-9C-TC-JC-QC-AC-" +             // Clubs (avoiding duplicates)
                "2D-3D-4D-5D-6D-7D-8D-9D-QD-KD-AD-" +             // Diamonds
                "2H-3H-4H-5H-6H-7H-8H-TH-JH-QH-" +                // Hearts  
                "3S-4S-5S-6S-7S-8S-9S-TS-JS-QS-KS";               // Spades

            game = new TexasHoldemGame(
                ethers.ZeroAddress,
                gameOptions,
                9, // dealer
                [],
                1, // handNumber
                0, // actionCount
                TexasHoldemRound.ANTE,
                [], // communityCards
                [0n], // pot
                new Map(),
                customMnemonic
            );
            expect(game.handNumber).toEqual(1);
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

            const json: TexasHoldemStateDTO = game.toJson();
            expect(json).toBeDefined();

            expect(json.smallBlindPosition).toEqual(1);
            expect(json.bigBlindPosition).toEqual(2);
        });

        it("should have the correct players pre flop", () => {
            expect(game.getPlayerCount()).toEqual(2);

            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeTruthy();
            expect(game.exists("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeTruthy();
            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
        });

        it.only("should do end to end", () => {
            // Do the small blind
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            let nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual(PLAYER_2);

            // Do the big blind
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Add a DEAL action to advance from ANTE to PREFLOP
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // Get legal actions for the next player
            let actions = game.getLegalActions(PLAYER_1);
            expect(actions.length).toEqual(3);
            expect(actions[0].action).toEqual(PlayerActionType.FOLD);
            expect(actions[1].action).toEqual(PlayerActionType.CALL);
            expect(actions[2].action).toEqual(PlayerActionType.RAISE);

            // Perform a call from the small blind
            game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);

            // Both check
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 8, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.TURN);

            // Both check
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 10, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 11, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);

            // Both check
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 12, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 13, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);

            // Both reveal cards
            game.performAction(PLAYER_1, PlayerActionType.SHOW, 14, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.SHOW, 15, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.END);

            // Check the winner
            const gameState = game.toJson();
            expect(gameState.winners).toBeDefined();
            expect(gameState.winners.length).toEqual(1);

            game.performAction(PLAYER_1, NonPlayerActionType.NEW_HAND, 16, undefined, `deck=${mnemonic}`, getNextTestTimestamp());
            expect(game.handNumber).toEqual(2);

            const json: TexasHoldemStateDTO = game.toJson();
            expect(json).toBeDefined();
            expect(json.players).toBeDefined();
            expect(json.players.length).toEqual(2);

            // Get the small blind player to leave
            game.performAction(PLAYER_1, NonPlayerActionType.LEAVE, 17, undefined, undefined, getNextTestTimestamp());
            expect(game.getPlayerCount()).toEqual(1);
            expect(game.exists(PLAYER_1)).toBeFalsy();
            expect(game.exists(PLAYER_2)).toBeTruthy();
        });
    });

    describe("Heads up end to end with legal action asserts", () => {
        const THREE_TOKENS = 300000000000000000n;
        const PLAYER_1 = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
        const PLAYER_2 = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";

        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            expect(game.handNumber).toEqual(1);
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
        });

        it("should do end to end with legal actions", () => {
            // Check the initial state and positions
            expect(game.getPlayerCount()).toEqual(2);
            expect(game.exists(PLAYER_1)).toBeTruthy();
            expect(game.exists(PLAYER_2)).toBeTruthy();
            expect(game.getPlayer(PLAYER_1)).toBeDefined();
            expect(game.getPlayer(PLAYER_2)).toBeDefined();
            expect(game.smallBlindPosition).toEqual(1);
            expect(game.bigBlindPosition).toEqual(2);
            // expect(game.dealerPosition).toEqual(9);
            expect(game.handNumber).toEqual(1);

            // Do the small blind
            let actions = game.getLegalActions(PLAYER_1);
            expect(actions.length).toEqual(2);
            expect(actions[0].action).toEqual(PlayerActionType.SMALL_BLIND);
            expect(actions[1].action).toEqual(PlayerActionType.FOLD);

            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
            expect(game.pot).toEqual(ONE_TOKEN);

            // Do the big blind
            actions = game.getLegalActions(PLAYER_2);
            expect(actions.length).toEqual(2);
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
            expect(game.pot).toEqual(THREE_TOKENS);

            // Add a DEAL action to advance from ANTE to PREFLOP
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // Call from the small blind
            actions = game.getLegalActions(PLAYER_1);
            expect(actions.length).toEqual(3);
            expect(actions[0].action).toEqual(PlayerActionType.FOLD);
            expect(actions[1].action).toEqual(PlayerActionType.CALL);
            expect(actions[2].action).toEqual(PlayerActionType.RAISE);

            game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());

            actions = game.getLegalActions(PLAYER_2);
            expect(actions.length).toEqual(3);
            expect(actions[0].action).toEqual(PlayerActionType.FOLD);
            expect(actions[1].action).toEqual(PlayerActionType.CHECK);
            expect(actions[2].action).toEqual(PlayerActionType.RAISE);

            game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n, undefined, getNextTestTimestamp());

            // Should now be in round FLOP
            expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);

            // Both check
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 8, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.TURN);

            // Both check
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 10, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 11, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);

            // Both check
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 12, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 13, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);

            // Get legal actions for the small blind player
            actions = game.getLegalActions(PLAYER_1);
            expect(actions.length).toEqual(1); // Show
            expect(actions[0].action).toEqual(PlayerActionType.SHOW);

            // Both reveal cards
            game.performAction(PLAYER_1, PlayerActionType.SHOW, 14, 0n, undefined, getNextTestTimestamp());

            // Should still be in SHOWDOWN
            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);

            actions = game.getLegalActions(PLAYER_2);
            // expect(actions.length).toEqual(1); // Winner must show
            // expect(actions[0].action).toEqual(PlayerActionType.SHOW);

            // Both reveal cards
            game.performAction(PLAYER_2, PlayerActionType.SHOW, 15, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.END);

            // Check game states
            const gameState = game.toJson();
            expect(gameState).toBeDefined();
            expect(gameState.players).toBeDefined();
            expect(gameState.players.length).toEqual(2);
            expect(gameState.communityCards).toBeDefined();
            expect(gameState.communityCards.length).toEqual(5);

            // Check the winner
            expect(gameState.winners).toBeDefined();
            expect(gameState.winners.length).toEqual(1);
            expect(gameState.winners[0].address).toEqual(PLAYER_1);
            expect(gameState.winners[0].amount).toEqual("400000000000000000");
            expect(gameState.winners[0].name).toEqual("Flush");
            expect(gameState.winners[0].description).toEqual("Flush, Ac High");
            expect(gameState.winners[0].cards).toBeDefined();
            expect(gameState.winners[0].cards?.length).toEqual(2);
            expect(gameState.winners[0].cards?.[0]).toEqual("AC");
            expect(gameState.winners[0].cards?.[1]).toEqual("3C");

            // Check hole cards
            expect(gameState.players[0].holeCards).toBeDefined();
            expect(gameState.players[0].holeCards?.length).toEqual(2);
            expect(gameState.players[1].holeCards).toBeDefined();
            expect(gameState.players[1].holeCards?.length).toEqual(2);

            // Check players chips
            let smallBlindPlayer = game.getPlayer(PLAYER_1);
            let bigBlindPlayer = game.getPlayer(PLAYER_2);

            expect(smallBlindPlayer).toBeDefined();
            expect(bigBlindPlayer).toBeDefined();
            expect(smallBlindPlayer?.chips).toEqual(100200000000000000000n);
            expect(bigBlindPlayer?.chips).toEqual(99800000000000000000n);

            game.performAction(PLAYER_1, NonPlayerActionType.NEW_HAND, 16, undefined, `deck=${mnemonic}`, getNextTestTimestamp());

            // Check the game state after re-initialization
            expect(game.handNumber).toEqual(2);

            expect(game.getPlayerCount()).toEqual(2);
            expect(game.exists(PLAYER_1)).toBeTruthy();
            expect(game.exists(PLAYER_2)).toBeTruthy();
            expect(game.getPlayer(PLAYER_1)).toBeDefined();
            expect(game.getPlayer(PLAYER_2)).toBeDefined();
            expect(game.dealerPosition).toEqual(1);
            expect(game.smallBlindPosition).toEqual(2);
            expect(game.bigBlindPosition).toEqual(1);
            expect(game.pot).toEqual(0n);
            expect(game.handNumber).toEqual(2);

            // Check players chips
            smallBlindPlayer = game.getPlayer(PLAYER_1);
            bigBlindPlayer = game.getPlayer(PLAYER_2);

            expect(smallBlindPlayer).toBeDefined();
            expect(bigBlindPlayer).toBeDefined();
            expect(smallBlindPlayer?.chips).toEqual(100200000000000000000n);
            expect(bigBlindPlayer?.chips).toEqual(99800000000000000000n);

            // Get legal actions for the next player.
            // This guy should now be the small blind
            actions = game.getLegalActions(PLAYER_2);
            expect(actions.length).toEqual(2);
            expect(actions[0].action).toEqual(PlayerActionType.SMALL_BLIND);
            expect(actions[1].action).toEqual(PlayerActionType.FOLD);

            // Perform the small blind
            game.performAction(PLAYER_2, PlayerActionType.SMALL_BLIND, 17, ONE_TOKEN, undefined, getNextTestTimestamp());

            // Get legal actions for the next player
            actions = game.getLegalActions(PLAYER_1);
            expect(actions.length).toEqual(2);

            game.performAction(PLAYER_1, PlayerActionType.BIG_BLIND, 18, TWO_TOKENS, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
            expect(game.pot).toEqual(THREE_TOKENS);
        });
    });
});
