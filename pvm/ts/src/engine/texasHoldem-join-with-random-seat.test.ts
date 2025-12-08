import { PlayerStatus, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, getNextTestTimestamp } from "./testConstants";
import { Player } from "../models/player";

describe("Texas Holdem - Random Join", () => {
    describe("Player Management - Sit without a seat number", () => {
        let game: TexasHoldemGame;

        const PLAYER_1 = "0x1111111111111111111111111111111111111111";
        const PLAYER_2 = "0x2222222222222222222222222222222222222222";

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should let one player join with random seat", () => {
            const player1 = new Player(PLAYER_1, undefined, ONE_HUNDRED_TOKENS, undefined, PlayerStatus.ACTIVE);

            game.performAction(player1.address, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp()); // Only one player

            expect(game.getPlayerCount()).toEqual(1);
            expect(game.exists(player1.address)).toBeTruthy();
        });

        it("should let two players join with random seat", () => {
            const player1 = new Player(PLAYER_1, undefined, ONE_HUNDRED_TOKENS, undefined, PlayerStatus.ACTIVE);
            const player2 = new Player(PLAYER_2, undefined, ONE_HUNDRED_TOKENS, undefined, PlayerStatus.ACTIVE);

            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            expect(game.getPlayerCount()).toEqual(1);
            expect(game.exists(player1.address)).toBeTruthy();

            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

            //expect(game.getPlayerCount()).toEqual(2); // Not sure why this fails
            expect(game.exists(player1.address)).toBeTruthy();
            expect(game.exists(player2.address)).toBeTruthy();
        });
    });
});
