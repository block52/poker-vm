import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "../src/engine/texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, getNextTestTimestamp } from "../src/engine/testConstants";

describe("TEST - When a player can not beat another players hand at showdown he has 2 options Muck hand or Show hand (Scenario 1 0f 2 He Mucks)", () => {
    const PLAYER_1 = "0x1111111111111111111111111111111111111111";
    const PLAYER_2 = "0x2222222222222222222222222222222222222222";

    let game: TexasHoldemGame;

    beforeEach(() => {
        // Custom mnemonic where Player 1 gets AA and Player 2 gets KK
        // Card dealing order: P1-first, P2-first, P1-second, P2-second, then community
        // AS-KC-AH-KH are the first 4 cards (P1: AS,AH; P2: KC,KH)
        // Community cards: 2S-7C-9H-TD-JD (cards 4-8) 
        const customMnemonic =
            "AS-KC-AH-KH-2S-7C-9H-TD-JD-" +                    // Player cards + community
            "2C-3C-4C-5C-6C-8C-9C-TC-JC-QC-AC-" +             // Clubs (no 7C, TD, KC already used)
            "2D-3D-4D-5D-6D-7D-8D-9D-QD-KD-AD-" +             // Diamonds (no JD, TD already used)
            "2H-3H-4H-5H-6H-7H-8H-TH-JH-QH-" +                // Hearts (no 9H, KH, AH already used)
            "3S-4S-5S-6S-7S-8S-9S-TS-JS-QS-KS";               // Spades (no 2S, AS already used)
        "KC-AS-KH-AH-2S-7C-9H-TD-JD-" +                    // Player cards + community
            "2C-3C-4C-5C-6C-8C-9C-TC-JC-QC-AC-" +             // Clubs (no 7C, TD already used)
            "2D-3D-4D-5D-6D-7D-8D-9D-QD-KD-AD-" +             // Diamonds (no JD, TD already used)
            "2H-3H-4H-5H-6H-7H-8H-TH-JH-QH-" +                // Hearts (no 9H, KH already used)
            "3S-4S-5S-6S-7S-8S-9S-TS-JS-QS-KS";               // Spades (no 2S, AS already used)

        const customGameConfig = {
            ...baseGameConfig,
            players: []
        };

        game = new TexasHoldemGame(
            baseGameConfig.address,
            gameOptions,
            baseGameConfig.dealer,
            [],
            1,
            0,
            TexasHoldemRound.ANTE,
            [],
            [0n],
            new Map(),
            customMnemonic
        );

        // Add players to the game
        game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
        game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
    }); it("test - when a player can not beat another players hand at showdown he has 2 options muck hand or show hand (scenario 1 0f 2 he mucks)", () => {
        // Execute the setup actions
        game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CHECK, 8, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CHECK, 10, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 11, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CHECK, 12, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 13, 0n, undefined, getNextTestTimestamp());

        // Test showdown behavior
        expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);

        // The first player to act should only have SHOW as a legal action
        // This is the core test - first to act cannot muck, must show
        const firstPlayerActions = game.getLegalActions(PLAYER_1);
        expect(firstPlayerActions).toBeDefined();
        expect(firstPlayerActions.length).toEqual(1);
        expect(firstPlayerActions[0].action).toEqual(PlayerActionType.SHOW);

        // Now perform the SHOW action to complete the test
        game.performAction(PLAYER_1, PlayerActionType.SHOW, 14, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.MUCK, 15, 0n, undefined, getNextTestTimestamp());

        // Verify that the game state is consistent
        expect(game.getPlayerCount()).toEqual(2);
        expect(game.pot).toBeGreaterThan(0n);
    });
});