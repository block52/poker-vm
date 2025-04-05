import { PlayerActionType, PlayerStatus, TexasHoldemRound, GameOptions } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { ethers } from "ethers";

describe("Texas Holdem - Join and Leave", () => {

    const TEN_TOKENS = 10000000000000000000n;
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

    describe("Player Management", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should not be able to join more than once", () => {
            expect(game.findNextSeat()).toEqual(1);
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            expect(() => {
                game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            }).toThrow("Player already joined.");
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
});