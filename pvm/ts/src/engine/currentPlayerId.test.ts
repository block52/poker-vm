import TexasHoldemGame from "./texasHoldem";
import { ethers } from "ethers";

describe("CurrentPlayerId Tests", () => {
    const baseGameConfig = {
        address: ethers.ZeroAddress,
        minPlayers: 2,
        maxPlayers: 9,
        smallBlind: 10000000000000000000n,
        bigBlind: 20000000000000000000n,
        dealer: 9,
        nextToAct: 0,
        currentRound: "ante",
        communityCards: [],
        pot: 0n,
        players: []
    };

    // These need to be fetched from the contract in the future
    const minBuyIn = 1000000000000000000n;
    const maxBuyIn = 10000000000000000000n;

    let game: TexasHoldemGame;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, minBuyIn, maxBuyIn);
    });

    it("should not break when there are no active players", () => {
        // Simply verify the function doesn't throw and returns ZeroAddress
        expect(game.currentPlayerId).toEqual(ethers.ZeroAddress);
    });
}); 