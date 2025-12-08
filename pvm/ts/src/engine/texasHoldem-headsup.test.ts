import { NonPlayerActionType, PlayerActionType, TexasHoldemRound, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { ethers } from "ethers";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, mnemonic, TWO_TOKENS, getNextTestTimestamp } from "./testConstants";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in a heads-up scenario.
describe("Texas Holdem - Ante - Heads Up", () => {
    describe("Preflop game states", () => {
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

    describe("Heads up", () => {
        const SMALL_BLIND_PLAYER = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
        const BIG_BLIND_PLAYER = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";

        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
        });

        it("should have the correct players pre flop", () => {
            expect(game.getPlayerCount()).toEqual(2);

            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeTruthy();
            expect(game.exists("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeTruthy();
            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
        });

        it("should have correct legal actions after posting the small blind", () => {
            // Get legal actions for the next player
            let actual = game.getLegalActions(SMALL_BLIND_PLAYER);
            // SIT_OUT is now a non-player action (always available), not included in legal actions
            expect(actual.length).toEqual(2);
            expect(actual[0].action).toEqual(PlayerActionType.SMALL_BLIND);
            expect(actual[1].action).toEqual(PlayerActionType.FOLD);

            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Get legal actions for the next player
            actual = game.getLegalActions(BIG_BLIND_PLAYER);

            // SIT_OUT is now a non-player action (always available), not included in legal actions
            expect(actual.length).toEqual(2);
            expect(actual[0].action).toEqual(PlayerActionType.BIG_BLIND);
            expect(actual[1].action).toEqual(PlayerActionType.FOLD);

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(BIG_BLIND_PLAYER);
        });

        it("should have correct legal actions after posting the big blind", () => {
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Get legal actions for the next player
            const actual = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");

            // SIT_OUT is now a non-player action (always available), not included in legal actions
            expect(actual.length).toEqual(2);
            expect(actual[0].action).toEqual(NonPlayerActionType.DEAL);
            expect(actual[1].action).toEqual(PlayerActionType.FOLD);
        });

        it("should have correct legal actions after posting blinds", () => {
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Add a DEAL action to advance from ANTE to PREFLOP
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // Now we're in PREFLOP round, so CALL is a valid action
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(BIG_BLIND_PLAYER);
        });

        it("should advance to next round after ante round", () => {
            let round = game.currentRound;
            expect(round).toEqual(TexasHoldemRound.ANTE);

            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Add a DEAL action to advance from ANTE to PREFLOP
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            round = game.currentRound;
            expect(round).toEqual(TexasHoldemRound.PREFLOP);
        });
    });

    describe("Heads up end to end", () => {
        const SMALL_BLIND_PLAYER = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
        const BIG_BLIND_PLAYER = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";

        let game: TexasHoldemGame;

        beforeEach(() => {
            // Custom mnemonic where Small Blind has AA and Big Blind has KK
            // This ensures Small Blind wins and Big Blind can muck after Small Blind shows
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
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

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

        it("should do end to end", () => {
            // Do the small blind
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            let nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual(BIG_BLIND_PLAYER);

            // Do the big blind
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Add a DEAL action to advance from ANTE to PREFLOP
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // Perform actions for the small blind player
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CHECK, 7, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);

            // Both check
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CHECK, 8, 0n, undefined, getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CHECK, 9, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.TURN);

            // Both check
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CHECK, 10, 0n, undefined, getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CHECK, 11, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);

            // Both check
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CHECK, 12, 0n, undefined, getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CHECK, 13, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);

            // Both reveal cards
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SHOW, 14, 0n, undefined, getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.SHOW, 15, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.END);

            // Should have new hand action
            const actions = game.getLegalActions(SMALL_BLIND_PLAYER);
            expect(actions.length).toEqual(1);
            expect(actions[0].action).toEqual(NonPlayerActionType.NEW_HAND);

            // Check the winner
            const gameState = game.toJson();
            expect(gameState.winners).toBeDefined();
            expect(gameState.winners.length).toEqual(1);

            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.NEW_HAND, 16, undefined, `deck=${mnemonic}`, getNextTestTimestamp());
            expect(game.handNumber).toEqual(2);

            const json: TexasHoldemStateDTO = game.toJson();
            expect(json).toBeDefined();
            expect(json.players).toBeDefined();
            expect(json.players.length).toEqual(2);

            // Get the small blind player to leave
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.LEAVE, 17, undefined, undefined, getNextTestTimestamp());
            expect(game.getPlayerCount()).toEqual(1);
            expect(game.exists(SMALL_BLIND_PLAYER)).toBeFalsy();
            expect(game.exists(BIG_BLIND_PLAYER)).toBeTruthy();
        });
    });

    describe("Heads up end to end with legal action asserts", () => {
        const THREE_TOKENS = 300000000000000000n;
        const SMALL_BLIND_PLAYER = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
        const BIG_BLIND_PLAYER = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";

        let game: TexasHoldemGame;

        beforeEach(() => {
            // Custom mnemonic where Small Blind has AA and Big Blind has KK
            // This ensures Small Blind wins and Big Blind can muck after Small Blind shows
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
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
        });

        it("should do end to end with legal actions", () => {
            // Check the initial state and positions
            expect(game.getPlayerCount()).toEqual(2);
            expect(game.exists(SMALL_BLIND_PLAYER)).toBeTruthy();
            expect(game.exists(BIG_BLIND_PLAYER)).toBeTruthy();
            expect(game.getPlayer(SMALL_BLIND_PLAYER)).toBeDefined();
            expect(game.getPlayer(BIG_BLIND_PLAYER)).toBeDefined();
            expect(game.smallBlindPosition).toEqual(1);
            expect(game.bigBlindPosition).toEqual(2);
            // expect(game.dealerPosition).toEqual(9);
            expect(game.handNumber).toEqual(1);

            // Do the small blind (SIT_OUT is now a non-player action, not in legal actions)
            let actions = game.getLegalActions(SMALL_BLIND_PLAYER);
            expect(actions.length).toEqual(2);
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
            expect(game.pot).toEqual(ONE_TOKEN);

            // Do the big blind (SIT_OUT is now a non-player action, not in legal actions)
            actions = game.getLegalActions(BIG_BLIND_PLAYER);
            expect(actions.length).toEqual(2);
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
            expect(game.pot).toEqual(THREE_TOKENS);

            // Add a DEAL action to advance from ANTE to PREFLOP
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // Call from the small blind
            actions = game.getLegalActions(SMALL_BLIND_PLAYER);
            expect(actions.length).toEqual(3); // Fold, Call, Raise
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());

            actions = game.getLegalActions(BIG_BLIND_PLAYER);
            expect(actions.length).toEqual(3); // Fold, Check, Raise
            expect(actions[0].action).toEqual(PlayerActionType.FOLD); // Check, raise or fold
            expect(actions[1].action).toEqual(PlayerActionType.CHECK); // Check, raise or fold
            expect(actions[2].action).toEqual(PlayerActionType.RAISE); // Check, raise or fold
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CHECK, 7, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);

            // Both check
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CHECK, 8, 0n, undefined, getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CHECK, 9, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.TURN);

            // Both check
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CHECK, 10, 0n, undefined, getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CHECK, 11, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);

            // Both check
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CHECK, 12, 0n, undefined, getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.CHECK, 13, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);

            // Get legal actions for the small blind player
            actions = game.getLegalActions(SMALL_BLIND_PLAYER);
            expect(actions.length).toEqual(1); // Show
            expect(actions[0].action).toEqual(PlayerActionType.SHOW);

            // Both reveal cards
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SHOW, 14, 0n, undefined, getNextTestTimestamp());

            // Should still be in SHOWDOWN
            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);

            actions = game.getLegalActions(BIG_BLIND_PLAYER);
            expect(actions.length).toEqual(2); // Muck or Show
            // expect(actions[0].action).toEqual(PlayerActionType.MUCK);
            // expect(actions[1].action).toEqual(PlayerActionType.SHOW);

            // Both reveal cards
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.SHOW, 15, 0n, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.END);

            // Check the winner
            const gameState = game.toJson();
            expect(gameState.winners).toBeDefined();
            expect(gameState.winners.length).toEqual(1);

            // Check players chips
            let smallBlindPlayer = game.getPlayer(SMALL_BLIND_PLAYER);
            let bigBlindPlayer = game.getPlayer(BIG_BLIND_PLAYER);

            expect(smallBlindPlayer).toBeDefined();
            expect(bigBlindPlayer).toBeDefined();
            expect(smallBlindPlayer?.chips).toEqual(100200000000000000000n);
            expect(bigBlindPlayer?.chips).toEqual(99800000000000000000n);

            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.NEW_HAND, 16, undefined, `deck=${mnemonic}`, getNextTestTimestamp());

            // Check the game state after re-initialization
            expect(game.handNumber).toEqual(2);

            expect(game.getPlayerCount()).toEqual(2);
            expect(game.exists(SMALL_BLIND_PLAYER)).toBeTruthy();
            expect(game.exists(BIG_BLIND_PLAYER)).toBeTruthy();
            expect(game.getPlayer(SMALL_BLIND_PLAYER)).toBeDefined();
            expect(game.getPlayer(BIG_BLIND_PLAYER)).toBeDefined();
            expect(game.smallBlindPosition).toEqual(2);
            expect(game.bigBlindPosition).toEqual(1);
            expect(game.pot).toEqual(0n);
            expect(game.handNumber).toEqual(2);

            // Check players chips
            smallBlindPlayer = game.getPlayer(SMALL_BLIND_PLAYER);
            bigBlindPlayer = game.getPlayer(BIG_BLIND_PLAYER);

            expect(smallBlindPlayer).toBeDefined();
            expect(bigBlindPlayer).toBeDefined();
            expect(smallBlindPlayer?.chips).toEqual(100200000000000000000n);
            expect(bigBlindPlayer?.chips).toEqual(99800000000000000000n);

            // Reset hand index
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 17, ONE_TOKEN, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
            expect(game.pot).toEqual(ONE_TOKEN);
            expect(game.getNextPlayerToAct()?.address).toEqual(SMALL_BLIND_PLAYER);

            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 18, TWO_TOKENS, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
            expect(game.pot).toEqual(THREE_TOKENS);

            // Add a DEAL action to advance from ANTE to PREFLOP
            game.performAction(BIG_BLIND_PLAYER, NonPlayerActionType.DEAL, 19, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
        });
    });
});
