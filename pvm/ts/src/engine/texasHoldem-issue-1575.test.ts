import { NonPlayerActionType, PlayerActionType, PlayerStatus, TexasHoldemRound, GameType } from "@block52/poker-vm-sdk";
import TexasHoldemGame from "./texasHoldem";
import { getNextTestTimestamp } from "./testConstants";
import { ethers } from "ethers";

describe("Issue 1575: Missing cards when player is all-in on blinds", () => {
    it("should deal cards to player who is all-in on big blind", () => {
        const baseGameConfig = {
            address: ethers.ZeroAddress,
            dealer: 9,
            nextToAct: 1,
            currentRound: "ante",
            communityCards: [],
            pot: 0n,
            players: [],
            now: Date.now()
        };

        const gameOptions = {
            minBuyIn: 20000n, // Min buy-in equals big blind
            maxBuyIn: 2000000n,
            minPlayers: 2,
            maxPlayers: 9,
            smallBlind: 10000n,
            bigBlind: 20000n,
            timeout: 60000,
            type: GameType.CASH
        };

        const game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);

        const PLAYER_1 = "player1";
        const PLAYER_2 = "player2";

        // Player 1 joins with exactly the min buy-in (20000 = big blind)
        game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, 20000n, "seat=1", getNextTestTimestamp());

        // Player 2 joins with normal stack
        game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, 100000n, "seat=2", getNextTestTimestamp());

        // Post blinds - Player 2 posts small blind (dealer in heads-up)
        game.performAction(PLAYER_2, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());

        // Player 1 posts big blind - will be all-in
        game.performAction(PLAYER_1, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());

        // Verify player 1 is all-in after posting big blind
        const player1AfterBigBlind = game.getPlayer(PLAYER_1);
        expect(player1AfterBigBlind.chips).toBe(0n);
        expect(player1AfterBigBlind.status).toBe(PlayerStatus.ALL_IN);

        // Deal cards
        game.performAction(PLAYER_2, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

        // Verify both players received cards
        const player1 = game.getPlayer(PLAYER_1);
        const player2 = game.getPlayer(PLAYER_2);

        // Player 1 should have hole cards even though they are all-in
        expect(player1.holeCards).toBeDefined();
        expect(player1.holeCards?.length).toBe(2);

        // Player 2 should also have hole cards
        expect(player2.holeCards).toBeDefined();
        expect(player2.holeCards?.length).toBe(2);

        // Verify we're in preflop round
        expect(game.currentRound).toBe(TexasHoldemRound.PREFLOP);
    });
});
