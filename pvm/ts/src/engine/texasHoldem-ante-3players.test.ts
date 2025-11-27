import { NonPlayerActionType, PlayerActionType, TexasHoldemRound, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS } from "./testConstants";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in with 3 players.
describe("Texas Holdem - Ante - 3 Players", () => {

    const PLAYER_1 = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
    const PLAYER_2 = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";
    const PLAYER_3 = "0x3333333333333333333333333333333333333333";

    describe("3 Players", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1");
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2");
        });

        it("should have the correct players in ante", () => {
            expect(game.getPlayerCount()).toEqual(2);

            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3");
            expect(game.getPlayerCount()).toEqual(3);

            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
            expect(game.getPlayer("0x3333333333333333333333333333333333333333")).toBeDefined();

            expect(game.findNextEmptySeat()).toEqual(4);
        });

        it("should have the correct legal options with 3 players after blinds", () => {
            expect(game.getPlayerCount()).toEqual(2);

            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3");
            expect(game.getPlayerCount()).toEqual(3);

            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
            expect(game.getPlayer("0x3333333333333333333333333333333333333333")).toBeDefined();

            expect(game.findNextEmptySeat()).toEqual(4);

            // Perform blinds
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.SMALL_BLIND, 4, ONE_TOKEN);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.BIG_BLIND, 5, TWO_TOKENS);

            // Get round
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Get legal actions for player 1, can only fold
            const actions = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            expect(actions).toBeDefined();
            expect(actions.length).toEqual(2);
            expect(actions[0].action).toEqual(NonPlayerActionType.DEAL);
            expect(actions[1].action).toEqual(PlayerActionType.SIT_OUT);
        });
    });

    describe("3 Players in random seats", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=5"); // seat 5
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2"); // seat 2
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=8"); // seat 8
        });

        it("should have correct seats and players", () => {
            expect(game.getPlayerCount()).toEqual(3);
            expect(game.getPlayer(PLAYER_1)).toBeDefined();
            expect(game.getPlayer(PLAYER_2)).toBeDefined();
            expect(game.getPlayer(PLAYER_3)).toBeDefined();

            expect(game.getPlayerAtSeat(1)).toBeUndefined();
            expect(game.getPlayerAtSeat(2)?.address).toEqual(PLAYER_2);
            expect(game.getPlayerAtSeat(3)).toBeUndefined();
            expect(game.getPlayerAtSeat(4)).toBeUndefined();
            expect(game.getPlayerAtSeat(5)?.address).toEqual(PLAYER_1);
            expect(game.getPlayerAtSeat(6)).toBeUndefined();
            expect(game.getPlayerAtSeat(7)).toBeUndefined();
            expect(game.getPlayerAtSeat(8)?.address).toEqual(PLAYER_3);
            expect(game.getPlayerAtSeat(9)).toBeUndefined();
        });

        it("should have the correct legal options with 3 players after blinds", () => {
            expect(game.getPlayerCount()).toEqual(3);

            // If dealer is 9, next empty seat is 1
            expect(game.findNextEmptySeat()).toEqual(1);

            // Get next to act
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(PLAYER_2);

            // Get player 
            let seat2Actions = game.getLegalActions(PLAYER_2);
            expect(seat2Actions).toBeDefined();
            expect(seat2Actions.length).toEqual(3);
            expect(seat2Actions[0].action).toEqual(PlayerActionType.SMALL_BLIND);
            expect(seat2Actions[1].action).toEqual(PlayerActionType.FOLD);
            expect(seat2Actions[2].action).toEqual(PlayerActionType.SIT_OUT);

            // Perform blinds
            game.performAction(PLAYER_2, PlayerActionType.SMALL_BLIND, 4, ONE_TOKEN);
            game.performAction(PLAYER_1, PlayerActionType.BIG_BLIND, 5, TWO_TOKENS);

            // Get round
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Get legal actions for player 3 seat 8
            const seat8Actions = game.getLegalActions(PLAYER_3);
            expect(seat8Actions).toBeDefined();
            expect(seat8Actions.length).toEqual(3);
            expect(seat8Actions[0].action).toEqual(NonPlayerActionType.DEAL);
            expect(seat8Actions[1].action).toEqual(PlayerActionType.FOLD);
            expect(seat8Actions[2].action).toEqual(PlayerActionType.SIT_OUT);

            // Get legal actions for player 2 seat 2
            seat2Actions = game.getLegalActions(PLAYER_2);
            expect(seat2Actions).toBeDefined();
            expect(seat2Actions.length).toEqual(2);
            expect(seat2Actions[0].action).toEqual(NonPlayerActionType.DEAL);
            expect(seat2Actions[1].action).toEqual(PlayerActionType.SIT_OUT);
        });

        it("should allow a player to leave and remove them from the game", () => {
            expect(game.getPlayerCount()).toEqual(3);

            // Player 3 leaves the game
            game.performAction(PLAYER_3, NonPlayerActionType.LEAVE, 4);

            // Assert player count decreased
            expect(game.getPlayerCount()).toEqual(2);

            // Assert player is no longer in the game
            expect(game.exists(PLAYER_3)).toBe(false);

            // Assert other players are still in the game
            expect(game.exists(PLAYER_1)).toBe(true);
            expect(game.exists(PLAYER_2)).toBe(true);

            // Assert player is not in toJson output
            const json: TexasHoldemStateDTO = game.toJson();
            expect(json).toBeDefined();
            expect(json.players).toBeDefined();
            expect(json.players.length).toEqual(2);

            // Verify PLAYER_3 is not in the players array
            const player3InJson = json.players.find(p => p.address === PLAYER_3);
            expect(player3InJson).toBeUndefined();

            // Verify the other players are still in the JSON
            const player1InJson = json.players.find(p => p.address === PLAYER_1);
            const player2InJson = json.players.find(p => p.address === PLAYER_2);
            expect(player1InJson).toBeDefined();
            expect(player2InJson).toBeDefined();

            // Verify seat 8 is now empty
            expect(game.getPlayerAtSeat(8)).toBeUndefined();
        });
    });
});
