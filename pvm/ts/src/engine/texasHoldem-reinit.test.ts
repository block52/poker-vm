import { NonPlayerActionType, PlayerActionType, PlayerStatus, GameType } from "@block52/poker-vm-sdk";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, mnemonic, getNextTestTimestamp } from "./testConstants";
import { Player } from "../models/player";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in a heads-up scenario.
describe("Texas Holdem - Reinit", () => {
    describe("Reinit", () => {

        const PLAYER_1 = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
        const PLAYER_2 = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";

        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            expect(game.handNumber).toEqual(1);
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

            expect(game.getPlayerCount()).toEqual(2);
            expect(game.dealerPosition).toEqual(9);
            expect(game.smallBlindPosition).toEqual(1);
            expect(game.bigBlindPosition).toEqual(2);
            expect(game.handNumber).toEqual(1);

            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // Both check
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 6, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n, undefined, getNextTestTimestamp());

            // Both check
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 8, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, 0n, undefined, getNextTestTimestamp());

            // Both check
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 10, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 11, 0n, undefined, getNextTestTimestamp());

            // Both check
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 12, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 13, 0n, undefined, getNextTestTimestamp());

            // Both reveal cards
            game.performAction(PLAYER_1, PlayerActionType.SHOW, 14, 0n, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.SHOW, 15, 0n, undefined, getNextTestTimestamp());
        });

        it("should reinit after end", () => {
            // check positions and hand number
            expect(game.getPlayerCount()).toEqual(2);
            expect(game.dealerPosition).toEqual(9);
            expect(game.smallBlindPosition).toEqual(1);
            expect(game.bigBlindPosition).toEqual(2);
            expect(game.handNumber).toEqual(1);
            expect(game.getActionIndex()).toEqual(16); // 15 actions performed (1-15)

            game.performAction(PLAYER_1, NonPlayerActionType.NEW_HAND, 16, undefined, `deck=${mnemonic}`, getNextTestTimestamp()); // 16th action
            expect(game.handNumber).toEqual(2);
            expect(game.getActionIndex()).toEqual(17); // 0 actions performed (16 + 1 for next action index) New hand counts as an action

            const json = game.toJson();
            expect(json).toBeDefined();
            expect(json.actionCount).toEqual(16);

            expect(game.getPlayerCount()).toEqual(2);
            expect(game.exists(PLAYER_1)).toBeTruthy();
            expect(game.exists(PLAYER_2)).toBeTruthy();
            expect(game.getPlayer(PLAYER_1)).toBeDefined();
            expect(game.getPlayer(PLAYER_2)).toBeDefined();
            // In heads-up: effective dealer was seat 1, so after rotation dealer moves to seat 2
            expect(game.dealerPosition).toEqual(2);
            expect(game.smallBlindPosition).toEqual(2);  // dealer is SB in heads-up
            expect(game.bigBlindPosition).toEqual(1);    // non-dealer is BB
            expect(game.communityCards.length).toEqual(0);

            const player0 = game.getPlayer(PLAYER_1);
            expect(player0).toBeDefined();
            expect(player0?.holeCards).toBeUndefined();

            const player1 = game.getPlayer(PLAYER_2);
            expect(player1).toBeDefined();
            expect(player1?.holeCards).toBeUndefined();
        });
    });

    describe("Busted Players", () => {
        it("should mark cash game players with 0 chips as BUSTED on reInit", () => {
            const cashGameOptions = {
                ...gameOptions,
                type: GameType.CASH
            };

            const game = TexasHoldemGame.fromJson(baseGameConfig, cashGameOptions);

            const PLAYER_1 = "0x1111111111111111111111111111111111111111";
            const PLAYER_2 = "0x2222222222222222222222222222222222222222";

            // Join two players
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

            // Post blinds and complete a hand
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.FOLD, 6, undefined, undefined, getNextTestTimestamp());

            // After hand ends, manually set player 1's chips to 0 to simulate being busted
            const player1 = game.getPlayer(PLAYER_1);
            expect(player1).toBeDefined();
            player1!.chips = 0n;

            // Start new hand - this triggers reInit which should mark player 1 as BUSTED
            game.performAction(PLAYER_2, NonPlayerActionType.NEW_HAND, 7, undefined, `deck=${mnemonic}`, getNextTestTimestamp());

            // Verify player 1 is now BUSTED
            const player1AfterReinit = game.getPlayer(PLAYER_1);
            expect(player1AfterReinit?.status).toBe(PlayerStatus.BUSTED);

            // Verify player 2 is still ACTIVE
            const player2 = game.getPlayer(PLAYER_2);
            expect(player2?.status).toBe(PlayerStatus.ACTIVE);
        });

        it("should mark tournament players with 0 chips as BUSTED on reInit", () => {
            const tournamentGameOptions = {
                ...gameOptions,
                type: GameType.TOURNAMENT
            };

            const game = TexasHoldemGame.fromJson(baseGameConfig, tournamentGameOptions);

            const PLAYER_1 = "0x1111111111111111111111111111111111111111";
            const PLAYER_2 = "0x2222222222222222222222222222222222222222";

            // Join two players
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

            // Post blinds and complete a hand
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.FOLD, 6, undefined, undefined, getNextTestTimestamp());

            // After hand ends, manually set player 1's chips to 0 to simulate being busted
            const player1 = game.getPlayer(PLAYER_1);
            expect(player1).toBeDefined();
            player1!.chips = 0n;

            // Start new hand - this triggers reInit which should mark player 1 as BUSTED
            game.performAction(PLAYER_2, NonPlayerActionType.NEW_HAND, 7, undefined, `deck=${mnemonic}`, getNextTestTimestamp());

            // Verify player 1 is now BUSTED
            const player1AfterReinit = game.getPlayer(PLAYER_1);
            expect(player1AfterReinit?.status).toBe(PlayerStatus.BUSTED);

            // Verify player 2 is still ACTIVE
            const player2 = game.getPlayer(PLAYER_2);
            expect(player2?.status).toBe(PlayerStatus.ACTIVE);
        });
    });
});
