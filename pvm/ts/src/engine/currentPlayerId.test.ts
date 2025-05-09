import { GameOptions } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { ethers } from "ethers";
import { baseGameConfig, gameOptions } from "../../../../test_cvm/lucas_tests_files/testConstants";

describe("CurrentPlayerId Tests", () => {
    let game: TexasHoldemGame;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
    });

    it("should not break when there are no active players", () => {
        // Simply verify the function doesn't throw and returns ZeroAddress
        expect(game.currentPlayerId).toEqual(ethers.ZeroAddress);
    });
}); 