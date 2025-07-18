// import { NonPlayerActionType, PlayerActionType, TexasHoldemRound, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
// import TexasHoldemGame from "./texasHoldem";
// import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, mnemonic, seed } from "./testConstants";

// describe("Texas Hold'em Game Scenarios", () => {
//     const PLAYER_1 = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
//     const PLAYER_2 = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";
//     const THREE_TOKENS = 300000000000000000n;
//     const FIVE_TOKENS = 500000000000000000n;
//     const TEN_TOKENS = 1000000000000000000n;
//     const TWENTY_TOKENS = 2000000000000000000n;

//     let game: TexasHoldemGame;

//     beforeEach(() => {
//         game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
//         game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, 1);
//         game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, 2);
//     });

//     describe("Scenario 1: All-in Preflop", () => {
//         it("should handle all-in preflop action", () => {
//             // Post blinds
//             game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
//             game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);
//             game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

//             // Small blind goes all-in
//             const player1 = game.getPlayer(PLAYER_1);
//             expect(player1?.chips).toEqual(ONE_HUNDRED_TOKENS - ONE_TOKEN);
            
//             game.performAction(PLAYER_1, PlayerActionType.RAISE, 6, player1!.chips);
            
//             // Big blind calls all-in
//             const player2 = game.getPlayer(PLAYER_2);
//             game.performAction(PLAYER_2, PlayerActionType.CALL, 7, player2!.chips - TWO_TOKENS);
            
//             // Should advance directly to showdown since both players are all-in
//             expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);
            
//             // Players show cards
//             game.performAction(PLAYER_1, PlayerActionType.SHOW, 8, 0n);
//             game.performAction(PLAYER_2, PlayerActionType.SHOW, 9, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.END);
            
//             const gameState = game.toJson();
//             expect(gameState.winners).toBeDefined();
//             expect(gameState.winners.length).toEqual(1);
//         });
//     });

//     describe("Scenario 2: All-in on the Flop", () => {
//         it("should handle all-in on flop", () => {
//             // Post blinds and deal
//             game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
//             game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);
//             game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5);
            
//             // Preflop: Small blind calls, big blind checks
//             game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN);
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
            
//             // Flop: Big blind bets, small blind goes all-in
//             game.performAction(PLAYER_2, PlayerActionType.BET, 8, FIVE_TOKENS);
            
//             const player1 = game.getPlayer(PLAYER_1);
//             game.performAction(PLAYER_1, PlayerActionType.RAISE, 9, player1!.chips);
            
//             // Big blind calls all-in
//             const player2 = game.getPlayer(PLAYER_2);
//             const callAmount = player1!.chips - FIVE_TOKENS;
//             game.performAction(PLAYER_2, PlayerActionType.CALL, 10, callAmount);
            
//             // Should advance to showdown
//             expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);
            
//             game.performAction(PLAYER_1, PlayerActionType.SHOW, 11, 0n);
//             game.performAction(PLAYER_2, PlayerActionType.SHOW, 12, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.END);
//         });
//     });

//     describe("Scenario 3: Raise and Reraise on Flop", () => {
//         it("should handle multiple raises on flop", () => {
//             // Post blinds and deal
//             game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
//             game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);
//             game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5);
            
//             // Preflop: Call and check
//             game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN);
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
            
//             // Flop betting action
//             game.performAction(PLAYER_2, PlayerActionType.BET, 8, FIVE_TOKENS);
//             game.performAction(PLAYER_1, PlayerActionType.RAISE, 9, TEN_TOKENS);
//             game.performAction(PLAYER_2, PlayerActionType.RAISE, 10, TWENTY_TOKENS);
//             game.performAction(PLAYER_1, PlayerActionType.CALL, 11, TEN_TOKENS);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.TURN);
            
//             // Turn: Check-check
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 12, 0n);
//             game.performAction(PLAYER_1, PlayerActionType.CHECK, 13, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);
            
//             // River: Check-check
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 14, 0n);
//             game.performAction(PLAYER_1, PlayerActionType.CHECK, 15, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);
            
//             game.performAction(PLAYER_1, PlayerActionType.SHOW, 16, 0n);
//             game.performAction(PLAYER_2, PlayerActionType.SHOW, 17, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.END);
//         });
//     });

//     describe("Scenario 4: Check-Raise All-in on River", () => {
//         it("should handle check-raise all-in on river", () => {
//             // Post blinds and deal
//             game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
//             game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);
//             game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5);
            
//             // Preflop: Call and check
//             game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN);
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n);
            
//             // Flop: Check-check
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 8, 0n);
//             game.performAction(PLAYER_1, PlayerActionType.CHECK, 9, 0n);
            
//             // Turn: Check-check
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 10, 0n);
//             game.performAction(PLAYER_1, PlayerActionType.CHECK, 11, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);
            
//             // River: Check-raise all-in
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 12, 0n);
//             game.performAction(PLAYER_1, PlayerActionType.BET, 13, TEN_TOKENS);
            
//             const player2 = game.getPlayer(PLAYER_2);
//             game.performAction(PLAYER_2, PlayerActionType.RAISE, 14, player2!.chips);
            
//             // Player 1 folds to the all-in
//             game.performAction(PLAYER_1, PlayerActionType.FOLD, 15, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.END);
            
//             // Player 2 should win without showdown
//             const gameState = game.toJson();
//             expect(gameState.winners).toBeDefined();
//             expect(gameState.winners.length).toEqual(1);
//             expect(gameState.winners[0].address).toEqual(PLAYER_2);
//         });
//     });

//     describe("Scenario 5: Fold to Turn Bet", () => {
//         it("should handle fold to turn bet", () => {
//             // Post blinds and deal
//             game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
//             game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);
//             game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5);
            
//             // Preflop: Call and check
//             game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN);
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n);
            
//             // Flop: Check-check
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 8, 0n);
//             game.performAction(PLAYER_1, PlayerActionType.CHECK, 9, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.TURN);
            
//             // Turn: Big blind bets, small blind folds
//             game.performAction(PLAYER_2, PlayerActionType.BET, 10, FIVE_TOKENS);
//             game.performAction(PLAYER_1, PlayerActionType.FOLD, 11, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.END);
            
//             const gameState = game.toJson();
//             expect(gameState.winners).toBeDefined();
//             expect(gameState.winners.length).toEqual(1);
//             expect(gameState.winners[0].address).toEqual(PLAYER_2);
//         });
//     });

//     describe("Scenario 6: Multiple Preflop Raises", () => {
//         it("should handle multiple preflop raises", () => {
//             // Post blinds and deal
//             game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
//             game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);
//             game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
            
//             // Preflop: Multiple raises
//             game.performAction(PLAYER_1, PlayerActionType.RAISE, 6, FIVE_TOKENS);
//             game.performAction(PLAYER_2, PlayerActionType.RAISE, 7, TEN_TOKENS);
//             game.performAction(PLAYER_1, PlayerActionType.RAISE, 8, TWENTY_TOKENS);
//             game.performAction(PLAYER_2, PlayerActionType.CALL, 9, TEN_TOKENS);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
            
//             // Flop onwards: Check-check to showdown
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 10, 0n);
//             game.performAction(PLAYER_1, PlayerActionType.CHECK, 11, 0n);
            
//             // Turn: Check-check
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 12, 0n);
//             game.performAction(PLAYER_1, PlayerActionType.CHECK, 13, 0n);
            
//             // River: Check-check
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 14, 0n);
//             game.performAction(PLAYER_1, PlayerActionType.CHECK, 15, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);
            
//             game.performAction(PLAYER_1, PlayerActionType.SHOW, 16, 0n);
//             game.performAction(PLAYER_2, PlayerActionType.SHOW, 17, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.END);
//         });
//     });

//     describe("Scenario 7: Bet and Call Every Street", () => {
//         it("should handle bet and call on every street", () => {
//             // Post blinds and deal
//             game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
//             game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);
//             game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5);
            
//             // Preflop: Call and check
//             game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN);
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n);
            
//             // Flop: Bet and call
//             game.performAction(PLAYER_2, PlayerActionType.BET, 8, THREE_TOKENS);
//             game.performAction(PLAYER_1, PlayerActionType.CALL, 9, THREE_TOKENS);
            
//             // Turn: Bet and call
//             game.performAction(PLAYER_2, PlayerActionType.BET, 10, FIVE_TOKENS);
//             game.performAction(PLAYER_1, PlayerActionType.CALL, 11, FIVE_TOKENS);
            
//             // River: Bet and call
//             game.performAction(PLAYER_2, PlayerActionType.BET, 12, TEN_TOKENS);
//             game.performAction(PLAYER_1, PlayerActionType.CALL, 13, TEN_TOKENS);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);
            
//             game.performAction(PLAYER_1, PlayerActionType.SHOW, 14, 0n);
//             game.performAction(PLAYER_2, PlayerActionType.SHOW, 15, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.END);
            
//             // Verify substantial pot due to betting every street
//             const gameState = game.toJson();
//             expect(Number(gameState.pot)).toBeGreaterThan(Number(TWENTY_TOKENS));
//         });
//     });

//     describe("Scenario 8: Check-Raise Then Fold", () => {
//         it("should handle check-raise followed by fold", () => {
//             // Post blinds and deal
//             game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
//             game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);
//             game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5);
            
//             // Preflop: Call and check
//             game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN);
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
            
//             // Flop: Check-raise action
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 8, 0n);
//             game.performAction(PLAYER_1, PlayerActionType.BET, 9, FIVE_TOKENS);
//             game.performAction(PLAYER_2, PlayerActionType.RAISE, 10, FIFTEEN_TOKENS);
            
//             // Player 1 re-raises
//             game.performAction(PLAYER_1, PlayerActionType.RAISE, 11, TWENTY_TOKENS);
            
//             // Player 2 folds to the re-raise
//             game.performAction(PLAYER_2, PlayerActionType.FOLD, 12, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.END);
            
//             const gameState = game.toJson();
//             expect(gameState.winners).toBeDefined();
//             expect(gameState.winners.length).toEqual(1);
//             expect(gameState.winners[0].address).toEqual(PLAYER_1);
//         });
//     });

//     describe("Scenario 9: All-in Call and Showdown", () => {
//         it("should handle all-in call with showdown", () => {
//             // Post blinds and deal
//             game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
//             game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);
//             game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5);
            
//             // Preflop: Raise and call
//             game.performAction(PLAYER_1, PlayerActionType.RAISE, 6, TEN_TOKENS);
//             game.performAction(PLAYER_2, PlayerActionType.CALL, 7, EIGHT_TOKENS);
            
//             // Flop: Big bet
//             game.performAction(PLAYER_2, PlayerActionType.CHECK, 8, 0n);
//             game.performAction(PLAYER_1, PlayerActionType.BET, 9, TWENTY_TOKENS);
            
//             // Player 2 goes all-in
//             const player2 = game.getPlayer(PLAYER_2);
//             game.performAction(PLAYER_2, PlayerActionType.RAISE, 10, player2!.chips);
            
//             // Player 1 calls the all-in
//             const callAmount = player2!.chips - TWENTY_TOKENS;
//             game.performAction(PLAYER_1, PlayerActionType.CALL, 11, callAmount);
            
//             // Should go directly to showdown
//             expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);
            
//             game.performAction(PLAYER_1, PlayerActionType.SHOW, 12, 0n);
//             game.performAction(PLAYER_2, PlayerActionType.SHOW, 13, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.END);
            
//             const gameState = game.toJson();
//             expect(gameState.winners).toBeDefined();
//             expect(gameState.communityCards?.length).toEqual(5); // All cards should be dealt
//         });
//     });

//     describe("Scenario 10: Fold to Initial Bet", () => {
//         it("should handle immediate fold to first bet", () => {
//             // Post blinds and deal
//             game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
//             game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);
//             game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
            
//             // Small blind immediately folds preflop
//             game.performAction(PLAYER_1, PlayerActionType.FOLD, 6, 0n);
            
//             expect(game.currentRound).toEqual(TexasHoldemRound.END);
            
//             const gameState = game.toJson();
//             expect(gameState.winners).toBeDefined();
//             expect(gameState.winners.length).toEqual(1);
//             expect(gameState.winners[0].address).toEqual(PLAYER_2);
            
//             // Verify minimal pot (just the blinds)
//             expect(gameState.winners[0].amount).toEqual((THREE_TOKENS).toString());
            
//             // Verify no community cards were dealt
//             expect(gameState.communityCards?.length).toEqual(0);
//         });
//     });

//     // Helper constants for readability
//     const EIGHT_TOKENS = 800000000000000000n;
//     const FIFTEEN_TOKENS = 1500000000000000000n;
// });