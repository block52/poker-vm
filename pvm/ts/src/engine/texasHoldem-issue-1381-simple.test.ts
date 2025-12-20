import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@block52/poker-vm-sdk";
import TexasHoldemGame from "./texasHoldem";
import { getNextTestTimestamp, ONE_HUNDRED_TOKENS, baseGameConfig, gameOptions } from "./testConstants";

describe("Simple test for issue 1381", () => {
    const PLAYER_1 = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";
    const PLAYER_2 = "0x980b8D8A16f5891F41871d878a479d81Da52334c";

    it("should not hang on simple all-in scenario", () => {
        const game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);

        console.log("1. Players join");
        game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
        game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());

        console.log("2. Post blinds");
        game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());

        console.log("3. Deal cards");
        game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
        console.log("Current round after deal:", game.currentRound);

        console.log("4. Player 1 goes all-in (using RAISE since there's already a bet - BB)");
        const player1Chips = game.getPlayer(PLAYER_1).chips;
        console.log("Player 1 chips:", player1Chips.toString());
        // Preflop with BB already in, must use RAISE to increase bet (ALL_IN maps to BET which fails)
        // Player 1 has already posted SB (1 token), so additional amount = remaining chips
        game.performAction(PLAYER_1, PlayerActionType.RAISE, 6, player1Chips, undefined, getNextTestTimestamp());
        console.log("Current round after all-in:", game.currentRound);

        console.log("5. Player 2 calls - THIS IS WHERE IT MAY HANG");
        const startTime = Date.now();
        // Player 2 calls with their remaining chips (they'll also go all-in)
        const player2Chips = game.getPlayer(PLAYER_2).chips;
        console.log("Player 2 chips:", player2Chips.toString());
        game.performAction(PLAYER_2, PlayerActionType.CALL, 7, player2Chips, undefined, getNextTestTimestamp());
        const endTime = Date.now();
        console.log("COMPLETED! Time taken:", endTime - startTime, "ms");
        console.log("Final round:", game.currentRound);
        console.log("Community cards:", game.communityCards.length);

        expect(endTime - startTime).toBeLessThan(100);
    }, 5000); // 5 second timeout
});
