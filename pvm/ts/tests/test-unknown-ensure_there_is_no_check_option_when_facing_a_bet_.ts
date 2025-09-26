describe("Ensure there is No CHECK option when facing a bet from another opponent (SCENARIO 18 OF 18 - 8 BETS)", () => {
    const PLAYER_1 = "0x1111111111111111111111111111111111111111";
    const PLAYER_2 = "0x2222222222222222222222222222222222222222";

    let game: TexasHoldemGame;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        
        // Add players to the game
        game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1");
        game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2");
    });

    it("ensure there is no check option when facing a bet from another opponent (scenario 18 of 18 - 8 bets)", () => {
        // Execute the setup actions
        game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
        game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);
        game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5);
        game.performAction(PLAYER_1, PlayerActionType.RAISE, 6, 300000000000000000nn);
        game.performAction(PLAYER_2, PlayerActionType.RAISE, 7, 600000000000000000nn);
        game.performAction(PLAYER_1, PlayerActionType.RAISE, 8, 800000000000000000nn);
        game.performAction(PLAYER_2, PlayerActionType.RAISE, 9, 800000000000000000nn);
        game.performAction(PLAYER_1, PlayerActionType.RAISE, 10, 800000000000000000nn);
        game.performAction(PLAYER_2, PlayerActionType.RAISE, 11, 800000000000000000nn);
        game.performAction(PLAYER_1, PlayerActionType.RAISE, 12, 800000000000000000nn);

        // Verify the game executed correctly
        expect(game.currentRound).toBeDefined();
        expect(game.getPlayerCount()).toEqual(2);
        
        const nextToAct = game.getNextPlayerToAct();
        
        // TODO: Add assertions specific to this test case
        const legalActions = game.getLegalActions(nextToAct?.address);
        expect(legalActions).toBeDefined();
        expect(legalActions.length).toEqual(0); // TODO: CHECK
    });
});