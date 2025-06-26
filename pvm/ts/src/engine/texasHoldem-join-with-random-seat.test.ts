import { PlayerStatus, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS } from "./testConstants";
import { Player } from "../models/player";

describe("Texas Holdem - Random Join", () => {
    describe("Player Management - Sit without a seat number", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should let one player join with random seat", () => {
            const player1 = new Player("0x1111111111111111111111111111111111111111", undefined, ONE_HUNDRED_TOKENS, undefined, PlayerStatus.ACTIVE);

            game.performAction(player1.address, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS); // Only one player
            
            expect(game.getPlayerCount()).toEqual(1);
            expect(game.exists(player1.address)).toBeTruthy();
        });

        it("should let two players join with random seat", () => {
            const player1 = new Player("0x1111111111111111111111111111111111111111", undefined, ONE_HUNDRED_TOKENS, undefined, PlayerStatus.ACTIVE);
            const player2 = new Player("0x2222222222222222222222222222222222222222", undefined, ONE_HUNDRED_TOKENS, undefined, PlayerStatus.ACTIVE);

            game.performAction("0x1111111111111111111111111111111111111111", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS);
            expect(game.getPlayerCount()).toEqual(1);
            expect(game.exists(player1.address)).toBeTruthy();

            game.performAction("0x2222222222222222222222222222222222222222", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS);
            
            expect(game.getPlayerCount()).toEqual(2);
            expect(game.exists(player1.address)).toBeTruthy();
            expect(game.exists(player2.address)).toBeTruthy();
        });
    });
});
