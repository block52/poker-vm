import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, seed, getNextTestTimestamp } from "./testConstants";

describe("Texas Holdem - Play 5 Hands", () => {
    const THREE_TOKENS = 300000000000000000n;
    const SMALL_BLIND_PLAYER = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
    const BIG_BLIND_PLAYER = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";

    let game: TexasHoldemGame;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        expect(game.handNumber).toEqual(1);
        game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "1", getNextTestTimestamp());
        game.performAction(BIG_BLIND_PLAYER, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "2", getNextTestTimestamp());
    });

    /**
     * Helper function to play a complete hand of Texas Holdem
     * @param handNumber the current hand number
     * @param smallBlindPlayer address of the small blind player
     * @param bigBlindPlayer address of the big blind player
     * @param actionOffset offset for action numbers
     * @returns the next action offset
     */
    function playCompleteHand(handNumber: number, smallBlindPlayer: string, bigBlindPlayer: string, actionOffset: number): number {
        let actionCounter = actionOffset;

        // Verify initial state for this hand
        expect(game.handNumber).toEqual(handNumber);
        expect(game.pot).toEqual(0n);
        expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

        // Post small blind
        game.performAction(smallBlindPlayer, PlayerActionType.SMALL_BLIND, actionCounter, ONE_TOKEN, undefined, getNextTestTimestamp());
        expect(game.pot).toEqual(ONE_TOKEN);
        actionCounter += 1;

        // Post big blind
        game.performAction(bigBlindPlayer, PlayerActionType.BIG_BLIND, actionCounter, TWO_TOKENS, undefined, getNextTestTimestamp());
        expect(game.pot).toEqual(THREE_TOKENS);
        actionCounter += 1;

        // Deal cards (move from ANTE to PREFLOP)
        game.performAction(smallBlindPlayer, NonPlayerActionType.DEAL, actionCounter, undefined, undefined, getNextTestTimestamp());
        expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
        actionCounter += 1;

        // Call from small blind
        game.performAction(smallBlindPlayer, PlayerActionType.CALL, actionCounter, ONE_TOKEN, undefined, getNextTestTimestamp());
        actionCounter += 1;

        // Check from big blind
        game.performAction(bigBlindPlayer, PlayerActionType.CHECK, actionCounter, 0n, undefined, getNextTestTimestamp());
        expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
        actionCounter += 1;

        // Both check on flop
        game.performAction(smallBlindPlayer, PlayerActionType.CHECK, actionCounter, 0n, undefined, getNextTestTimestamp());
        actionCounter += 1;

        game.performAction(bigBlindPlayer, PlayerActionType.CHECK, actionCounter, 0n, undefined, getNextTestTimestamp());
        expect(game.currentRound).toEqual(TexasHoldemRound.TURN);
        actionCounter += 1;

        // Both check on turn
        game.performAction(smallBlindPlayer, PlayerActionType.CHECK, actionCounter, 0n, undefined, getNextTestTimestamp());
        actionCounter += 1;

        game.performAction(bigBlindPlayer, PlayerActionType.CHECK, actionCounter, 0n, undefined, getNextTestTimestamp());
        expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);
        actionCounter += 1;

        // Both check on river
        game.performAction(smallBlindPlayer, PlayerActionType.CHECK, actionCounter, 0n, undefined, getNextTestTimestamp());
        actionCounter += 1;

        game.performAction(bigBlindPlayer, PlayerActionType.CHECK, actionCounter, 0n, undefined, getNextTestTimestamp());
        expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);
        actionCounter += 1;

        // Both show their cards
        game.performAction(smallBlindPlayer, PlayerActionType.SHOW, actionCounter, 0n, undefined, getNextTestTimestamp());
        actionCounter += 1;

        game.performAction(bigBlindPlayer, PlayerActionType.SHOW, actionCounter, 0n, undefined, getNextTestTimestamp());

        // Verify the game state after showdown
        expect(game.currentRound).toEqual(TexasHoldemRound.END);
        expect(game.pot).toBeGreaterThan(0n);
        expect(game.handNumber).toEqual(handNumber);
        expect(game.winners).toBeDefined();

        // Verify winners exist
        const gameState = game.toJson();
        expect(gameState.winners).toBeDefined();
        expect(gameState.winners.length).toBeGreaterThan(0);

        actionCounter += 1;
        return actionCounter;
    }

    it.skip("should play five complete hands with button movement and pot reset", () => {
        // Initialize variables to track button position and players
        let smallBlindPlayer = SMALL_BLIND_PLAYER;
        let bigBlindPlayer = BIG_BLIND_PLAYER;
        let actionCounter = 3; // Start at 3 since JOIN actions were 1 and 2

        // Hand 1
        // Verify initial button positions for hand 1
        expect(game.smallBlindPosition).toEqual(1);
        expect(game.bigBlindPosition).toEqual(2);
        expect(game.dealerPosition).toEqual(9);

        actionCounter = playCompleteHand(1, smallBlindPlayer, bigBlindPlayer, actionCounter);

        // Reinitialize for hand 2
        game.performAction(smallBlindPlayer, NonPlayerActionType.NEW_HAND, actionCounter, undefined, seed, getNextTestTimestamp());
        // actionCounter = 1;

        // Hand 2 - buttons should switch positions
        [smallBlindPlayer, bigBlindPlayer] = [bigBlindPlayer, smallBlindPlayer];

        // Verify button positions for hand 2
        expect(game.handNumber).toEqual(2);
        expect(game.smallBlindPosition).toEqual(2);
        expect(game.bigBlindPosition).toEqual(1);
        expect(game.pot).toEqual(0n); // Pot should be reset

        actionCounter = playCompleteHand(2, smallBlindPlayer, bigBlindPlayer, actionCounter + 1);

        // Reinitialize for hand 3
        game.performAction(smallBlindPlayer, NonPlayerActionType.NEW_HAND, actionCounter, undefined, seed, getNextTestTimestamp());
        // actionCounter = 0;

        // Hand 3 - buttons should switch positions again
        [smallBlindPlayer, bigBlindPlayer] = [bigBlindPlayer, smallBlindPlayer];

        // Verify button positions for hand 3
        expect(game.handNumber).toEqual(2);
        expect(game.smallBlindPosition).toEqual(1);
        expect(game.bigBlindPosition).toEqual(2);
        expect(game.pot).toEqual(0n); // Pot should be reset

        actionCounter = playCompleteHand(3, smallBlindPlayer, bigBlindPlayer, actionCounter + 1);

        // Reinitialize for hand 4
        game.performAction(smallBlindPlayer, NonPlayerActionType.NEW_HAND, actionCounter, undefined, seed, getNextTestTimestamp());
        // actionCounter = 0;

        // Hand 4 - buttons should switch positions again
        [smallBlindPlayer, bigBlindPlayer] = [bigBlindPlayer, smallBlindPlayer];

        // Verify button positions for hand 4
        expect(game.handNumber).toEqual(3);
        expect(game.smallBlindPosition).toEqual(2);
        expect(game.bigBlindPosition).toEqual(1);
        expect(game.pot).toEqual(0n); // Pot should be reset

        actionCounter = playCompleteHand(4, smallBlindPlayer, bigBlindPlayer, actionCounter);

        // Reinitialize for hand 5
        game.performAction(smallBlindPlayer, NonPlayerActionType.NEW_HAND, actionCounter, undefined, seed, getNextTestTimestamp());
        actionCounter = 0;

        // Hand 5 - buttons should switch positions again
        [smallBlindPlayer, bigBlindPlayer] = [bigBlindPlayer, smallBlindPlayer];

        // Verify button positions for hand 5
        expect(game.handNumber).toEqual(4);
        expect(game.smallBlindPosition).toEqual(1);
        expect(game.bigBlindPosition).toEqual(2);
        expect(game.pot).toEqual(0n); // Pot should be reset

        actionCounter = playCompleteHand(5, smallBlindPlayer, bigBlindPlayer, actionCounter);

        // Final verification - check chip counts after 5 hands
        // Winner determination is deterministic with the set mnemonic, so we can check exact values
        // but this may need adjustment based on the actual implementation
        const smallBlindPlayerFinal = game.getPlayer(SMALL_BLIND_PLAYER);
        const bigBlindPlayerFinal = game.getPlayer(BIG_BLIND_PLAYER);

        expect(smallBlindPlayerFinal).toBeDefined();
        expect(bigBlindPlayerFinal).toBeDefined();

        // Verify both players still exist
        expect(game.exists(SMALL_BLIND_PLAYER)).toBeTruthy();
        expect(game.exists(BIG_BLIND_PLAYER)).toBeTruthy();

        // Chips should total the starting amount (200 tokens)
        const totalChips = (smallBlindPlayerFinal?.chips || 0n) + (bigBlindPlayerFinal?.chips || 0n);
        expect(totalChips).toEqual(ONE_HUNDRED_TOKENS + ONE_HUNDRED_TOKENS);
    });
});
