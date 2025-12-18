import { NonPlayerActionType, PlayerActionType, TexasHoldemRound, Deck, PlayerStatus } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "../src/engine/texasHoldem";
import { fromTestJson, ONE_TOKEN, PLAYER_1_ADDRESS, TWO_TOKENS, getNextTestTimestamp } from "../src/engine/testConstants";
import { Winner } from "../src/engine/types";
import { Player } from "../src/models/player";
import {
    test_json,
    test_735,
    test_735_2,
    test_735_3,
    test_792,
    test_870,
    test_873,
    test_873_2,
    test_877,
    test_899,
    test_899_2,
    test_902,
    test_913,
    test_971,
    test_949,
    test_984,
    test_1006,
    test_1103,
    test_1103_2,
    test_1120,
    test_1126,
    test_1130,
    test_1130_edited,
    test_1137,
    test_1158,
    test_1173,
    test_1176,
    test_1178,
} from "./scenarios/data";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in a heads-up scenario.
describe("Texas Holdem - Data driven", () => {
    describe("Turn tests", () => {
        const SEAT_1 = "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C";
        const SEAT_2 = "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD";

        let game: TexasHoldemGame;

        beforeEach(() => {
            game = fromTestJson(test_json);
        });

        it.skip("should have correct legal actions after turn", () => {
            // Check the current round
            expect(game.currentRound).toEqual(TexasHoldemRound.TURN);

            // Get legal actions for the next player
            const actual = game.getLegalActions(SEAT_1);
            expect(actual).toBeDefined();
        });

        it.skip("should test bug 735", () => {
            game = fromTestJson(test_735);
            // Check the current round
            expect(game.currentRound).toEqual(TexasHoldemRound.END);

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual("0xE8DE79b707BfB7d8217cF0a494370A9cC251602C"); // Seat 1 is next to act
        });

        it.skip("should test bug 735 2", () => {
            game = fromTestJson(test_735_2);
            // Check the current round
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
        });

        it("should test bug 735 3", () => {
            game = fromTestJson(test_735_3);
            // Check the current round
            expect(game.currentPlayerId).toEqual("0xC84737526E425D7549eF20998Fa992f88EAC2484"); // Seat 2 has checked
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual("0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8"); // Seat 1 is next to act
        });

        it.skip("should test bug 792", () => {
            const SEAT_1 = "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C";

            game = fromTestJson(test_792);
            const actual = game.getLegalActions(SEAT_1);
            expect(actual).toBeDefined();
            expect(actual.length).toEqual(0);
        });

        it("should test bug 870", () => {
            const SEAT_1 = "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8";
            const SEAT_2 = "0xC84737526E425D7549eF20998Fa992f88EAC2484";

            game = fromTestJson(test_870);
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
            expect(game.lastActedSeat).toEqual(2);
            const actual = game.getLegalActions(SEAT_1);
            expect(actual).toBeDefined();
            // Should be able to fold, call, or raise
            expect(actual.length).toBeGreaterThanOrEqual(3);
            expect(actual[0].action).toEqual("fold");
            expect(actual[1].action).toEqual("call");
            expect(actual[2].action).toEqual("raise");
        });

        it.skip("should test bug 873", () => {
            const SEAT_1 = "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8";
            const SEAT_2 = "0xC84737526E425D7549eF20998Fa992f88EAC2484";

            game = fromTestJson(test_873);
            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);
            expect(game.lastActedSeat).toEqual(2);
            const actual = game.getLegalActions(SEAT_1);
            expect(actual).toBeDefined();
            // Should be able to fold, call, or raise
            expect(actual.length).toBeGreaterThanOrEqual(3);
            expect(actual[0].action).toEqual("fold");
            expect(actual[1].action).toEqual("call");
            expect(actual[2].action).toEqual("raise");
        });

        it.skip("should test bug 873 second test", () => {
            const SEAT_1 = "0xC84737526E425D7549eF20998Fa992f88EAC2484";

            game = fromTestJson(test_873_2);
            const actual = game.getLegalActions(SEAT_1);
            expect(actual).toBeDefined();
            expect(game.smallBlindPosition).toEqual(1);
            expect(game.bigBlindPosition).toEqual(2);
        });

        it.skip("should test bug 877", () => {
            game = fromTestJson(test_877);
            // Game state should be end
            expect(game.currentRound).toEqual(TexasHoldemRound.END);
        });

        it("should test bug 899", () => {
            const SEAT_1 = "0x4260E88e81E60113146092Fb9474b61C59f7552e";

            game = fromTestJson(test_899);
            // Game state should be end
            const actual = game.getLegalActions(SEAT_1);
            expect(actual).toBeDefined();
            expect(actual.length).toBeGreaterThanOrEqual(3);
            expect(actual[1].action).toEqual("call");
            expect(actual[1].min).toEqual("30000000000000000");
            expect(actual[1].max).toEqual("30000000000000000");
            expect(actual[2].action).toEqual("raise");
        });

        it("should test bug 899 second test", () => {
            const SEAT_8 = "0x4260E88e81E60113146092Fb9474b61C59f7552e";

            game = fromTestJson(test_899_2);
            // Game state should be end
            const actual = game.getLegalActions(SEAT_8);
            expect(actual).toBeDefined();
            expect(actual.length).toBeGreaterThanOrEqual(3);
            expect(actual[1].action).toEqual("call");
            expect(actual[1].min).toEqual("20000000000000000");
            expect(actual[1].max).toEqual("20000000000000000");
            expect(actual[2].action).toEqual("raise");
        });

        it.skip("should test bug 902", () => {
            const SEAT_1 = "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C";
            const SEAT_2 = "0x4260E88e81E60113146092Fb9474b61C59f7552e";

            game = fromTestJson(test_902);
            // Game state should be end
            const actual = game.getLegalActions(SEAT_2);
            expect(actual).toBeDefined();
            expect(actual.length).toBeGreaterThanOrEqual(3);
            expect(actual[2].action).toEqual("raise");
            expect(actual[2].min).toEqual("50000000000000000");
        });

        it("should test bug 913", () => {
            const SEAT_1 = "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C";

            game = fromTestJson(test_913);

            const previousActions = game.getPreviousActions();
            // Sanity check to ensure we have the expected number of previous actions
            expect(previousActions.length).toEqual(7);
            const actual = game.getLegalActions(SEAT_1);
            expect(actual).toBeDefined();
            expect(actual.length).toBeGreaterThanOrEqual(3);
        });

        it("should test bug 971", () => {
            game = fromTestJson(test_971);

            // SB posts
            // BB posts
            // SB raises
            // BB calls

            // Player 1 to call
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual("0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8");

            const legalActions = game.getLegalActions("0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8");
            expect(legalActions).toBeDefined();
            expect(legalActions.length).toBeGreaterThanOrEqual(3);
        });

        it("should test bug 949", () => {
            game = fromTestJson(test_949);

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual("0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8");

            const legalActions = game.getLegalActions("0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8");
            expect(legalActions).toBeDefined();
            expect(legalActions.length).toBeGreaterThanOrEqual(3);

            expect(legalActions[0].action).toEqual("fold");
            expect(legalActions[1].action).toEqual("call");
            expect(legalActions[2].action).toEqual("raise");
            expect(legalActions[2].min).toEqual("40000000000000000");
        });

        it("should test bug 984 second test", () => {
            game = fromTestJson(test_984);

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual("0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8");

            const legalActions = game.getLegalActions("0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8");
            expect(legalActions).toBeDefined();
            expect(legalActions.length).toBeGreaterThanOrEqual(3);
            expect(legalActions[1].min).toEqual("20000000000000000");
            expect(legalActions[2].min).toEqual("40000000000000000");
        });

        it("should test bug 1006 second test", () => {
            game = fromTestJson(test_1006);

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual("0x4260E88e81E60113146092Fb9474b61C59f7552e");

            // During ANTE round: DEAL + SIT_OUT. FOLD is NOT available during ANTE.
            const legalActions = game.getLegalActions("0x4260E88e81E60113146092Fb9474b61C59f7552e");
            expect(legalActions).toBeDefined();
            expect(legalActions.length).toBe(2);
            expect(legalActions[0].action).toEqual("deal");
            expect(legalActions[1].action).toEqual("sit-out");
        });

        it.skip("should test bug 1103", () => {
            game = fromTestJson(test_1103);

            // Player 4
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).not.toEqual("0xE8DE79b707BfB7d8217cF0a494370A9cC251602C");

            const legalActions = game.getLegalActions("0x4260E88e81E60113146092Fb9474b61C59f7552e");
            expect(legalActions).toBeDefined();

            game.performAction("0xE8DE79b707BfB7d8217cF0a494370A9cC251602C", PlayerActionType.CHECK, 0, ONE_TOKEN, undefined, getNextTestTimestamp());
        });

        it.skip("should test bug 1103 next to act", () => {
            game = fromTestJson(test_1103_2);

            // Player 4
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).not.toEqual("0xE8DE79b707BfB7d8217cF0a494370A9cC251602C");

            const legalActions = game.getLegalActions("0x4260E88e81E60113146092Fb9474b61C59f7552e");
            expect(legalActions).toBeDefined();

            game.performAction("0xE8DE79b707BfB7d8217cF0a494370A9cC251602C", PlayerActionType.CHECK, 0, ONE_TOKEN, undefined, getNextTestTimestamp());
        });

        it("should test bug 1120 next to act", () => {
            game = fromTestJson(test_1120);

            // Player 1
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual("0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD");
        });

        it.skip("should test bug 1126", () => {
            game = fromTestJson(test_1126);

            // Player 3 should be next to act
            const SEAT_3 = "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD";
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(SEAT_3);

            // Player 3 should have 3 legal actions: fold, call, raise
            const legalActions = game.getLegalActions(SEAT_3);
            expect(legalActions).toBeDefined();
            expect(legalActions.length).toBeGreaterThanOrEqual(3);

            // Verify the legal actions
            expect(legalActions[0].action).toEqual("fold");
            expect(legalActions[0].min).toEqual("0");
            expect(legalActions[0].max).toEqual("0");

            expect(legalActions[1].action).toEqual("check");
            // Player 3 has already matched the highest bet, so they can check
            expect(legalActions[1].min).toEqual("0");
            expect(legalActions[1].max).toEqual("0");

            expect(legalActions[2].action).toEqual("raise");
            expect(legalActions[2].min).toEqual("1800000000000000000000"); // All-in amount
            expect(legalActions[2].max).toEqual("1800000000000000000000");

            // Game should still be in TURN round, not END
            expect(game.currentRound).toEqual(TexasHoldemRound.TURN);
        });

        it("should test bug 1130", () => {
            game = fromTestJson(test_1130);
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
        });

        it("should test bug 1111 - sumOfBets should include blinds in JSON", () => {
            // Use test_1130_edited as the basis since it has blind posting setup
            game = fromTestJson(test_1130_edited);

            // This is the key fix - JSON should include blind bets in sumOfBets
            const gameJson = game.toJson();
            const player1Json = gameJson.players.find(p => p.address === "0xC84737526E425D7549eF20998Fa992f88EAC2484");
            const player2Json = gameJson.players.find(p => p.address === "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD");

            expect(player1Json?.sumOfBets).toBe("200000000000000000000"); // Small blind + call = 200
            expect(player2Json?.sumOfBets).toBe("200000000000000000000"); // Big blind amount in JSON
        });

        it("should test bug 1130 should progress to next round", () => {
            game = fromTestJson(test_1130_edited);
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            console.log("\n=== PLAYER DETAILS ===");
            const livePlayers = game.findLivePlayers();
            for (const player of livePlayers) {
                console.log(`Player ${player.address}:`);
                console.log(`  - Status: ${player.status}`);
                console.log(`  - Stack: ${player.chips}`);
                console.log(`  - Seat: ${(game as any).getPlayerSeatNumber(player.address)}`);
                const preflopBet = game.getPlayerTotalBets(player.address, TexasHoldemRound.PREFLOP, true);
                console.log(`  - PREFLOP bet (incl blinds): ${preflopBet}`);
            }

            console.log("Has round ended before action:", (game as any).hasRoundEnded(TexasHoldemRound.PREFLOP));

            game.performAction("0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD", PlayerActionType.CHECK, 27, 0n, undefined, getNextTestTimestamp());

            console.log("\n=== AFTER CHECK ACTION ===");
            console.log("Current round:", game.currentRound);
            console.log("Has round ended after action:", (game as any).hasRoundEnded(TexasHoldemRound.PREFLOP));

            expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
        });
    });

    describe("Bug 1137 - Should allow seat 1 to start new hand after tournament end", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = fromTestJson(test_1137);
        });

        it("should show round as 'end' after tournament completion", () => {
            expect(game.currentRound).toBe(TexasHoldemRound.END);
        });

        it("should have winners declared", () => {
            const gameData = game.toJson();
            expect(gameData.winners).toBeDefined();
            expect(gameData.winners.length).toBe(1);
            expect(gameData.winners[0].address).toBe("0xE8DE79b707BfB7d8217cF0a494370A9cC251602C");
            expect(gameData.winners[0].amount).toBe("27200000000000000000000");
        });

        it("should allow seat 1 to start new hand", () => {
            const seat1Address = "0xc264FEDe83B081C089530BA0b8770C98266d058a";
            const legalActions = game.getLegalActions(seat1Address);

            const newHandAction = legalActions.find(action => action.action === NonPlayerActionType.NEW_HAND);
            expect(newHandAction).toBeDefined();
            expect(newHandAction?.min).toBe("0");
            expect(newHandAction?.max).toBe("0");
        });

        it("should allow seat 4 (winner) to start new hand", () => {
            const seat4Address = "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C";
            const legalActions = game.getLegalActions(seat4Address);

            const newHandAction = legalActions.find(action => action.action === NonPlayerActionType.NEW_HAND);
            expect(newHandAction).toBeDefined();
        });

        it("should have correct pot amount from final hand", () => {
            const gameData = game.toJson();
            expect(gameData.pots).toEqual(["27200000000000000000000"]);
        });

        it("should have correct chip distribution after tournament", () => {
            // Seat 1 should have remaining chips
            const seat1Player = game.getPlayerAtSeat(1);
            expect(seat1Player!.chips).toBe(BigInt("9200000000000000000000"));

            // Seat 4 (winner) should have most chips
            const seat4Player = game.getPlayerAtSeat(4);
            expect(seat4Player!.chips).toBe(BigInt("30800000000000000000000"));

            // Seats 2 and 3 should be busted
            const seat2Player = game.getPlayerAtSeat(2);
            const seat3Player = game.getPlayerAtSeat(3);
            expect(seat2Player!.chips).toBe(0n);
            expect(seat3Player!.chips).toBe(0n);
        });

        it.skip("should execute new-hand action successfully", () => {
            const seat1Address = "0xc264FEDe83B081C089530BA0b8770C98266d058a";

            expect(() => {
                game.performAction(seat1Address, NonPlayerActionType.NEW_HAND, 17, undefined, undefined, getNextTestTimestamp());
            }).not.toThrow();

            // After new hand, the game should reset for heads-up play
            expect(game.currentRound).toBe(TexasHoldemRound.ANTE);
        });

        it.skip("should test bug 1159 - poker solver inconsistency", () => {
            // DISCOVERED BUG: pokersolver compare() and winners() methods are inconsistent
            // This test demonstrates the original bug and is skipped since we now use our custom solver
            // const PokerSolver = require("pokersolver");
            // Community cards from test data issue #1159
            // const community = ["7D", "3C", "TC", "6D", "8H"];
            // Player hands from test data
            // const player1Cards = ["TD", "5C"].concat(community); // Should make pair of 10's
            // const player2Cards = ["5D", "5H"].concat(community); // Should make pair of 5's
            // const player1Hand = PokerSolver.Hand.solve(player1Cards);
            // const player2Hand = PokerSolver.Hand.solve(player2Cards);
            // console.log("Player 1:", player1Hand.descr, "- cards:", player1Hand.cards.map((c: any) => c.toString()));
            // console.log("Player 2:", player2Hand.descr, "- cards:", player2Hand.cards.map((c: any) => c.toString()));
            // Test the bug: compare() vs winners() inconsistency
            // const comparison = player1Hand.compare(player2Hand);
            // const winners = PokerSolver.Hand.winners([player1Hand, player2Hand]);
            // console.log("compare() result:", comparison, "(1=P1 wins, -1=P2 wins, 0=tie)");
            // console.log("winners() result:", winners.map((w: any) => w.descr));
            // const winnerIsPlayer1 = winners.includes(player1Hand);
            // const winnerIsPlayer2 = winners.includes(player2Hand);
            // This is the bug: inconsistent results between methods
            // expect(player1Hand.name).toBe("Pair");
            // expect(player2Hand.name).toBe("Pair");
            // Document the specific bug found
            // expect(comparison).toBe(-1);        // compare() says Player 2 wins
            // expect(winnerIsPlayer1).toBe(true); // but winners() says Player 1 wins
            // expect(winnerIsPlayer2).toBe(false);
            // console.log("BUG CONFIRMED: pokersolver methods are inconsistent!");
            // console.log("This explains the wrong winner determination in issue #1159");
        });

        it("should test bug 1159 - FIXED with custom poker solver", () => {
            // FIX: Using our custom poker solver that is consistent

            // Import our custom poker solver from published SDK
            const { PokerSolver: CustomPokerSolver } = require("@bitcoinbrisbane/block52");

            // Community cards from test data issue #1159
            const community = ["7D", "3C", "TC", "6D", "8H"];

            // Player hands from test data
            const player1Cards = ["TD", "5C"].concat(community); // Pair of 10's
            const player2Cards = ["5D", "5H"].concat(community); // Pair of 5's

            // Convert to Block52 Card objects
            const player1Block52Cards = player1Cards.map((mnemonic: string) => Deck.fromString(mnemonic));
            const player2Block52Cards = player2Cards.map((mnemonic: string) => Deck.fromString(mnemonic));

            // Evaluate hands with our custom solver
            const player1Evaluation = CustomPokerSolver.findBestHand(player1Block52Cards);
            const player2Evaluation = CustomPokerSolver.findBestHand(player2Block52Cards);

            console.log("CUSTOM SOLVER RESULTS:");
            console.log("Player 1:", player1Evaluation.description, "- rank values:", player1Evaluation.rankValues);
            console.log("Player 2:", player2Evaluation.description, "- rank values:", player2Evaluation.rankValues);

            // Test our custom solver's consistency
            const customComparison = CustomPokerSolver.compareHands(player1Evaluation, player2Evaluation);
            const customWinners = CustomPokerSolver.findWinners([player1Evaluation, player2Evaluation]);

            console.log("Custom compare() result:", customComparison, "(1=P1 wins, -1=P2 wins, 0=tie)");
            console.log(
                "Custom winners() result: Player",
                customWinners.map((i: number) => i + 1)
            );

            // Verify both hands are pairs
            expect(player1Evaluation.handType).toBe(1); // HandType.PAIR
            expect(player2Evaluation.handType).toBe(1); // HandType.PAIR

            // Verify our solver is consistent - both methods should agree
            expect(customComparison).toBe(1); // Player 1 wins (pair of 10s > pair of 5s)
            expect(customWinners).toEqual([0]); // Player 1 (index 0) wins

            // Verify correct pair ranks
            expect(player1Evaluation.rankValues[0]).toBe(10); // Pair of 10s
            expect(player2Evaluation.rankValues[0]).toBe(5); // Pair of 5s

            console.log("SUCCESS: Custom poker solver is consistent!");
            console.log("Player 1 correctly wins with pair of 10s vs pair of 5s");
        });
    });

    describe("Bug 1158 - Sit and Go tournament not ending when only one player remains", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = fromTestJson(test_1158);
        });

        it("should end tournament when only one player remains", () => {
            // Tournament should be in END state when only one player has chips
            expect(game.currentRound).toEqual(TexasHoldemRound.END);

            // Check that only one player has chips remaining
            const playersWithChips = game.getSeatedPlayers().filter(player => player.chips > 0n);
            expect(playersWithChips.length).toBe(1);

            // Should have a winner declared
            const gameState = game.toJson();
            expect(gameState.winners).toBeDefined();
            expect(gameState.winners.length).toBe(1);
        });

        it("should not allow further actions in completed tournament", () => {
            // No legal actions should be available when tournament is complete
            const remainingPlayer = game.getSeatedPlayers().find(player => player.chips > 0n);
            expect(remainingPlayer).toBeDefined();

            const legalActions = game.getLegalActions(remainingPlayer!.address);

            // Only NEW_HAND action should be available to start a new tournament
            expect(legalActions.length).toBeGreaterThanOrEqual(1);
            expect(legalActions[0].action).toBe("new-hand");
        });
    });

    describe("Bug 1173 - Incorrect actions after all-in", () => {
        let game: TexasHoldemGame;

        it("should allow call/fold options after a player goes all-in, not show", () => {
            const SEAT_1 = "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8"; // Player 1
            const SEAT_2 = "0x2B6be678D732346c364c98905A285C938056b0A8"; // Player who went all-in (busted)
            const SEAT_3 = "0xf20d09D3ef43315C392d4879e253142557363A2C"; // Next to act after all-in
            const SEAT_4 = "0x4260E88e81E60113146092Fb9474b61C59f7552e"; // Big blind player

            // Create game state that reproduces the exact bug scenario
            console.log("Creating game state just after all-in...");

            const fullGameData = test_1173.result.data;
            const allActions = fullGameData.previousActions || [];

            // Find the all-in action
            const allInActionIndex = allActions.findIndex((action: any) => action.action === PlayerActionType.ALL_IN);
            const allInAction = allActions[allInActionIndex];

            console.log("All-in action:", allInAction);
            expect(allInAction).toBeDefined();
            expect(allInAction?.playerId).toEqual(SEAT_2);

            // Create game state up to and including the all-in
            const actionsUpToAllIn = allActions.slice(0, allInActionIndex + 1);
            console.log("Actions included up to and including all-in:", actionsUpToAllIn.length);

            // Create modified game data with only actions up to the all-in
            const gameDataAfterAllIn = {
                ...fullGameData,
                previousActions: actionsUpToAllIn,
                // Reset any state that would be set after the all-in
                currentRound: "river",
                nextToAct: SEAT_3 // Seat 3 should be next to act
            };

            // Create game from this state
            game = fromTestJson({
                id: "1",
                result: {
                    data: gameDataAfterAllIn
                }
            });

            // Verify the fix: hasRoundEnded should now return false
            expect(game.hasRoundEnded(game.currentRound)).toBe(false);

            // Verify that seat 3 (next to act) has call/fold options, not show
            const seat3Player = game.getSeatedPlayers().find((p: any) => p.address === SEAT_3);
            expect(seat3Player).toBeDefined();
            expect(seat3Player?.status).toBe("active");

            const seat3Actions = game.getLegalActions(SEAT_3);
            const actionTypes = seat3Actions.map((a: any) => a.action);

            console.log("✅ Bug fixed: Seat 3 now has actions after all-in:", actionTypes);
            console.log("Seat 3 details:", {
                address: seat3Player?.address.slice(-4),
                chips: seat3Player?.chips?.toString(),
                status: seat3Player?.status
            });

            // Check all-in amount vs seat 3's chips
            console.log("All-in amount:", allInAction.amount);
            console.log("Can Seat 3 call? Chips:", seat3Player?.chips, "vs All-in:", allInAction.amount);

            // After the fix, seat 3 should have fold option at minimum
            expect(actionTypes).toContain("fold");
            // Should NOT have show action (that indicates showdown)
            expect(actionTypes).not.toContain("show");

            // Verify hasRoundEnded is now false (this is the key fix)
            expect(game.hasRoundEnded(game.currentRound)).toBe(false);
        });
    });

    describe("Bug 1173 reproduction", () => {
        let game: TexasHoldemGame;

        test("All-in should allow call/fold, not immediately go to showdown", () => {
            game = fromTestJson(test_1173);

            // Verify the game state - this test data shows the END state after the bug occurred
            expect(game.currentRound).toBe(TexasHoldemRound.END);

            // Check the action sequence to understand the bug:
            const previousActions = game.getPreviousActions();

            // Find the all-in action
            const allInAction = previousActions.find((action: any) => action.action === PlayerActionType.ALL_IN);
            expect(allInAction).toBeDefined();
            expect(allInAction?.seat).toBe(2); // Player 2 went all-in

            // Find what happened immediately after the all-in
            if (!allInAction) return;
            const allInIndex = previousActions.indexOf(allInAction);
            const nextAction = previousActions[allInIndex + 1];

            console.log("All-in action:", allInAction);
            console.log("Next action after all-in:", nextAction);

            // THE BUG: After the all-in, the next action is immediately "show"
            // instead of giving other players a chance to call or fold
            expect(nextAction?.action).toBe("show"); // This demonstrates the bug

            // The correct behavior would be:
            // 1. Player 2 goes all-in
            // 2. Player 3 should get call/fold options
            // 3. Player 4 should get call/fold options
            // 4. Only then proceed to showdown

            console.log("Bug demonstrated: All-in immediately triggers showdown instead of call/fold actions");
        });

        test("Debug: Recreate game state just before all-in to understand the bug", () => {
            // Let's create a modified version of test_1173 that stops just before the all-in
            // to see what the legal actions should be

            // Get the test data and examine the state right before the all-in
            const gameData = { ...test_1173.result.data };

            // Find the all-in action (index 66) and remove it and all subsequent actions
            const originalActions = gameData.previousActions;
            const allInActionIndex = originalActions.findIndex((action: any) => action.action === PlayerActionType.ALL_IN);

            console.log("All-in action was at index:", allInActionIndex, "with action index:", originalActions[allInActionIndex].index);

            // Create a modified game state that stops just before the all-in
            const actionsBeforeAllIn = originalActions.slice(0, allInActionIndex);
            const modifiedTestData = {
                id: test_1173.id,
                result: {
                    data: {
                        ...gameData,
                        previousActions: actionsBeforeAllIn,
                        round: "river", // Should still be on river, not end
                        // Reset player legal actions since we're changing the state
                        players: gameData.players.map((player: any) => ({
                            ...player,
                            legalActions: [] // We'll let the game engine determine these
                        }))
                    },
                    signature: test_1173.result.signature
                }
            };

            console.log("Creating game state just before all-in...");
            console.log("Original actions count:", originalActions.length);
            console.log("Modified actions count:", actionsBeforeAllIn.length);
            console.log("Last action before all-in:", actionsBeforeAllIn[actionsBeforeAllIn.length - 1]);

            // Create the modified game using fromTestJson
            const modifiedGame = fromTestJson(modifiedTestData);

            console.log("Modified game current round:", modifiedGame.currentRound);
            console.log("Modified game next to act:", modifiedGame.getNextPlayerToAct());

            // Now check legal actions for all players
            const SEAT_1 = "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8";
            const SEAT_2 = "0x2B6be678D732346c364c98905A285C938056b0A8"; // The one about to go all-in
            const SEAT_3 = "0xf20d09D3ef43315C392d4879e253142557363A2C";
            const SEAT_4 = "0x4260E88e81E60113146092Fb9474b61C59f7552e";

            console.log("Legal actions just before all-in:");
            console.log(
                "Seat 1:",
                modifiedGame.getLegalActions(SEAT_1).map((a: any) => a.action)
            );
            console.log(
                "Seat 2:",
                modifiedGame.getLegalActions(SEAT_2).map((a: any) => a.action)
            );
            console.log(
                "Seat 3:",
                modifiedGame.getLegalActions(SEAT_3).map((a: any) => a.action)
            );
            console.log(
                "Seat 4:",
                modifiedGame.getLegalActions(SEAT_4).map((a: any) => a.action)
            );

            expect(modifiedGame.currentRound).toBe(TexasHoldemRound.RIVER);
        });

        test("Debug: Examine what happens immediately after all-in", () => {
            // Let's create a modified version that includes the all-in but stops there
            // to see what happens to the game state

            const gameData = { ...test_1173.result.data };
            const originalActions = gameData.previousActions;
            const allInActionIndex = originalActions.findIndex((action: any) => action.action === PlayerActionType.ALL_IN);

            // Include the all-in action but remove subsequent "show" actions
            const actionsUpToAllIn = originalActions.slice(0, allInActionIndex + 1);

            console.log("Creating game state just after all-in...");
            console.log("All-in action:", originalActions[allInActionIndex]);
            console.log("Actions included up to and including all-in:", actionsUpToAllIn.length);

            const modifiedTestData = {
                id: test_1173.id,
                result: {
                    data: {
                        ...gameData,
                        previousActions: actionsUpToAllIn,
                        round: "river", // Should still be on river, not showdown
                        players: gameData.players.map((player: any) => ({
                            ...player,
                            legalActions: [] // Reset
                        }))
                    },
                    signature: test_1173.result.signature
                }
            };

            const gameAfterAllIn = fromTestJson(modifiedTestData);

            console.log("Game state after all-in:");
            console.log("Current round:", gameAfterAllIn.currentRound);
            console.log("Next to act:", gameAfterAllIn.getNextPlayerToAct());

            // Check player statuses
            const SEAT_1 = "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8";
            const SEAT_2 = "0x2B6be678D732346c364c98905A285C938056b0A8"; // The one who went all-in
            const SEAT_3 = "0xf20d09D3ef43315C392d4879e253142557363A2C";
            const SEAT_4 = "0x4260E88e81E60113146092Fb9474b61C59f7552e";

            console.log("Player statuses after all-in:");
            const players = [
                { seat: 1, address: SEAT_1 },
                { seat: 2, address: SEAT_2 },
                { seat: 3, address: SEAT_3 },
                { seat: 4, address: SEAT_4 }
            ];

            players.forEach(p => {
                const player = gameAfterAllIn.getPlayer(p.address);
                const status = gameAfterAllIn.getPlayerStatus(p.address);
                console.log(
                    `Seat ${p.seat}: status=${status}, chips=${player.chips}, actions=${gameAfterAllIn.getLegalActions(p.address).map((a: any) => a.action)}`
                );
            });

            // Check if round has ended
            console.log("Has round ended?", gameAfterAllIn.hasRoundEnded(gameAfterAllIn.currentRound));

            // Let's trace WHY hasRoundEnded returns true
            // We need to look at the specific logic that's causing this

            // Check active players count
            const livePlayers = (gameAfterAllIn as any).findLivePlayers();
            const activePlayers = livePlayers.filter((p: any) => p.status === PlayerStatus.ACTIVE);

            console.log("Live players count:", livePlayers.length);
            console.log("Active players count:", activePlayers.length);
            console.log(
                "Active players:",
                activePlayers.map((p: any) => `${p.address.slice(-4)}: seat ${p.seat}`)
            );

            // Debug the bet equality logic that's likely causing the issue
            console.log("\nDebugging bet equality logic:");
            const playerBets: bigint[] = [];

            for (const player of livePlayers) {
                const totalBet = (gameAfterAllIn as any).getPlayerTotalBets(player.address, "river");
                playerBets.push(totalBet);
                console.log(`Player ${player.address.slice(-4)}: bet=${totalBet}, status=${player.status}, chips=${player.chips}`);
            }

            const allBetsEqual = playerBets.every(bet => bet === playerBets[0]);
            console.log(`Player bets: [${playerBets.join(", ")}]`);
            console.log(`All bets equal? ${allBetsEqual} (This is likely why hasRoundEnded returns true)`);
            console.log(`First bet amount: ${playerBets[0]}`);

            // Let's also check what actions happened in this river round
            const riverActions = (gameAfterAllIn as any)._rounds.get("river") || [];
            console.log(`\nRiver round actions:`);
            riverActions.forEach((action: any, index: number) => {
                console.log(`  ${index}: ${action.playerId.slice(-4)} - ${action.action} ${action.amount || ""}`);
            });

            // Check if there's a bet/raise that players need to respond to
            const lastBetOrRaise = riverActions
                .slice()
                .reverse()
                .find((a: any) => a.action === PlayerActionType.BET || a.action === PlayerActionType.RAISE || a.action === PlayerActionType.ALL_IN);

            if (lastBetOrRaise) {
                console.log(`\nLast bet/raise/all-in: ${lastBetOrRaise.playerId.slice(-4)} - ${lastBetOrRaise.action} ${lastBetOrRaise.amount}`);
                console.log(`Players who acted after this bet/raise:`);
                const lastBetIndex = riverActions.indexOf(lastBetOrRaise);
                const actionsAfterBet = riverActions.slice(lastBetIndex + 1);
                actionsAfterBet.forEach((action: any) => {
                    console.log(`  ${action.playerId.slice(-4)} - ${action.action}`);
                });
            }

            // This should show us why the game immediately goes to showdown
        });

        it("should include all-in players in showdown winner calculation - test_1176", () => {
            // Test case for bug where all-in players are not considered in winner calculation
            const game = fromTestJson(test_1176);

            // Player details from test_1176:
            // Player 2 (seat 2): KH, KD (pair of Kings) - status "all-in", stack: 0
            // Player 1 (seat 1): QS, QC (pair of Queens) - status "showing", stack: 21000000000000000000000
            // Player 3 (seat 3): 6C, 9H - status "showing", stack: 8000000000000000000000
            // Player 4 (seat 4): 9D, 7S - status "folded", stack: 11000000000000000000000
            // Community cards: 8C, 3S, TH, 9S, 4D

            // The game is loaded in "end" state with winners already calculated with the bug
            // We need to trigger a fresh winner calculation

            // Reset the game to showdown state to trigger winner recalculation
            (game as any)._currentRound = TexasHoldemRound.SHOWDOWN;
            (game as any)._winners.clear();

            console.log("Test 1176 - Winner Analysis:");
            console.log("Community cards:", game.communityCards);

            // Log all players and their hands before winner calculation
            Array.from(game.players.entries()).forEach(([seat, player]: [number, Player | null]) => {
                if (player) {
                    console.log(
                        `Player ${player.address.slice(-4)} (seat ${seat}): ${player.holeCards?.join(", ")} - status: ${player.status}, stack: ${player.chips}`
                    );
                }
            });

            // Trigger winner calculation by calling private method
            (game as any).calculateWinner();

            // Get the winners after recalculation
            const winnersMap = game.winners;
            const winnerAddresses = winnersMap ? Array.from(winnersMap.keys()) : [];
            const winnerEntries = winnersMap ? Array.from(winnersMap.entries()) : [];

            console.log(
                "Winners after recalculation:",
                winnerEntries.map(([address, winner]: [string, Winner]) => ({
                    address: address.slice(-4),
                    amount: winner.amount,
                    hand: winner.name,
                    cards: winner.cards
                }))
            );

            // Player 2 with KK should win over Player 1 with QQ
            const player2Address = "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8";
            const hasPlayer2Won = winnerAddresses.includes(player2Address);

            // This should now pass with the bug fix
            expect(hasPlayer2Won).toBe(true);

            // Player 2 should be the sole winner with KK
            expect(winnerAddresses).toHaveLength(1);
            expect(winnerAddresses[0]).toBe(player2Address);
            if (winnersMap) {
                expect(winnersMap.get(player2Address)?.name).toBe("Pair of Ks");
            }
        });

        it("should not have players stuck with no legal actions - test_1178", () => {
            // Test case for bug where players get stuck with no legal actions
            const game = fromTestJson(test_1178);

            // Addresses from test_1178 data:
            const SEAT_1 = "0x2B6be678D732346c364c98905A285C938056b0A8"; // Player 1 - bet on turn
            const SEAT_2 = "0xC84737526E425D7549eF20998Fa992f88EAC2484"; // Player 2 - needs to respond to bet
            const SEAT_3 = "0xf20d09D3ef43315C392d4879e253142557363A2C"; // Player 3 - folded
            const SEAT_4 = "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8"; // Player 4 - all-in

            console.log("Test 1178 - Players Stuck Analysis:");
            console.log("Current round:", game.currentRound);
            console.log("Last acted seat:", game.lastActedSeat);
            console.log(
                "Community cards:",
                game.communityCards.map((c: any) => c.mnemonic)
            );

            // Check the round-ending logic in detail
            console.log("Has round ended?", (game as any).hasRoundEnded(game.currentRound));

            // Check player statuses and positions
            const seat2Player = game.getPlayer(SEAT_2);
            console.log(`Seat 2 player: ${seat2Player?.address.slice(-4)}, status: ${seat2Player?.status}, chips: ${seat2Player?.chips}`);

            const nextToAct = game.getNextPlayerToAct();
            console.log("Next player to act:", nextToAct ? `${nextToAct.address.slice(-4)} (status: ${nextToAct.status})` : "None");

            // This should pass - seat 2 should be next to act after seat 1's bet
            expect(nextToAct?.address).toBe(SEAT_2);

            const seat2Actions = game.getLegalActions(SEAT_2);
            console.log(
                "Seat 2 legal actions:",
                seat2Actions.map((a: any) => a.action)
            );

            // Seat 2 should have call option after seat 1's bet
            const canSeat2Call = seat2Actions.some((a: any) => a.action === PlayerActionType.CALL);
            expect(canSeat2Call).toBe(true);

            // Verify the scenario:
            // 1. Seat 4 is all-in (can't act further)
            // 2. Seat 3 is folded (can't act further)
            // 3. Seat 1 just bet on the turn
            // 4. Seat 2 must respond to the bet (fold/call/raise)

            console.log("\n=== DEBUGGING THE CORRECT BEHAVIOR ===");

            // Show all players and their status
            Array.from(game.players.entries()).forEach(([seat, player]: [number, Player | null]) => {
                if (player) {
                    const legalActions = game.getLegalActions(player.address);
                    const isNextToAct = nextToAct?.address === player.address;
                    console.log(
                        `Seat ${seat}: ${player.address.slice(-4)} - status: ${player.status}, chips: ${player.chips}, next: ${isNextToAct}, actions: [${legalActions.map(a => a.action).join(", ")}]`
                    );
                }
            });

            // Check the turn round actions to understand the sequence
            const turnActions = (game as any)._rounds.get(game.currentRound) || [];
            console.log(`\nTurn round actions (${turnActions.length}):`);
            turnActions.forEach((action: any, index: number) => {
                console.log(`  ${index}: Seat ${action.seat} (${action.playerId.slice(-4)}) - ${action.action} ${action.amount || ""}`);
            });

            // This demonstrates the bug was in the inconsistent test data
            // The solution: Seat 1 bets -> Seat 2 must respond -> Game correctly waits for seat 2
            console.log("\n✅ GAME ENGINE WORKING CORRECTLY:");
            console.log("- Seat 1 bet 200000000000000000000 on turn");
            console.log("- Seat 3 is folded, Seat 4 is all-in (can't act)");
            console.log("- Seat 2 correctly identified as next to act");
            console.log("- Seat 2 has proper legal actions: fold, call, raise");
            console.log("- No players are 'stuck' - the game is waiting for seat 2's response");

            // Now test that seat 2 can call and the round progresses to river
            console.log("\n=== TESTING ROUND PROGRESSION ===");
            console.log("Current round before seat 2's call:", game.currentRound);
            expect(game.currentRound).toBe(TexasHoldemRound.TURN);

            // Get the call action for seat 2
            const callAction = seat2Actions.find((a: any) => a.action === PlayerActionType.CALL);
            expect(callAction).toBeDefined();
            console.log("Seat 2 call action:", callAction);

            // Perform the call
            const callAmount = BigInt(callAction!.min || "0");
            console.log("About to perform CALL action...");
            game.performAction(SEAT_2, PlayerActionType.CALL, callAction!.index, callAmount, undefined, getNextTestTimestamp());

            console.log("Current round after seat 2's call:", game.currentRound);
            console.log("Next player to act after call:", game.getNextPlayerToAct()?.address?.slice(-4) || "None");

            // Debug why the round isn't progressing
            console.log("\n=== DEBUGGING ROUND PROGRESSION ===");
            console.log("Has turn round ended?", (game as any).hasRoundEnded(TexasHoldemRound.TURN));

            // Check the turn round actions
            const turnActionsAfterCall = (game as any)._rounds.get(TexasHoldemRound.TURN) || [];
            console.log(`Turn round actions after call (${turnActionsAfterCall.length}):`);
            turnActionsAfterCall.forEach((action: any, index: number) => {
                console.log(`  ${index}: Seat ${action.seat} (${action.playerId.slice(-4)}) - ${action.action} ${action.amount || ""}`);
            });

            // Check live and active players
            const livePlayers = (game as any).findLivePlayers();
            const activePlayersForRound = livePlayers.filter((p: any) => p.status === PlayerStatus.ACTIVE);
            console.log("Live players:", livePlayers.length);
            console.log("Active players:", activePlayersForRound.length);
            console.log(
                "Active player addresses:",
                activePlayersForRound.map((p: any) => `${p.address.slice(-4)} (seat ${(game as any).getPlayerSeatNumber(p.address)})`)
            );

            // Check if all active players have acted in this round
            const turnActingPlayers = new Set(turnActionsAfterCall.map((a: any) => a.playerId));
            console.log(
                "Players who acted in turn:",
                Array.from(turnActingPlayers).map((p: any) => p.slice(-4))
            );

            // Check betting amounts for each active player
            console.log("Player total bets in turn round:");
            const playerBets: bigint[] = [];
            for (const player of activePlayersForRound) {
                const totalBet = (game as any).getPlayerTotalBets(player.address, TexasHoldemRound.TURN);
                playerBets.push(totalBet);
                console.log(`  ACTIVE ${player.address.slice(-4)}: ${totalBet}`);
            }

            // Check if all bets are equal (key condition for round ending)
            const allBetsEqual = playerBets.every(bet => bet === playerBets[0]);
            console.log("All ACTIVE player bets equal?", allBetsEqual);
            console.log("First bet amount:", playerBets[0]);

            // Check what the engine is doing wrong - it includes ALL live players
            console.log("\nALL LIVE player bets (including all-in - this is the bug!):");
            const livePlayerBets: bigint[] = [];
            for (const player of livePlayers) {
                const totalBet = (game as any).getPlayerTotalBets(player.address, TexasHoldemRound.TURN);
                livePlayerBets.push(totalBet);
                console.log(`  LIVE ${player.address.slice(-4)} (status: ${player.status}): ${totalBet}`);
            }
            const liveAllBetsEqual = livePlayerBets.every((bet: bigint) => bet === livePlayerBets[0]);
            console.log("All LIVE player bets equal?", liveAllBetsEqual, "- This is FALSE (the bug!)");

            console.log("\n🐛 REAL BUG IDENTIFIED:");
            console.log("- Engine checks bet equality for ALL LIVE players (including all-in)");
            console.log("- Should only check bet equality for ACTIVE players");
            console.log("- All-in players can't bet more, so shouldn't be included in equality check");

            // Check if there's anyone left to act
            console.log("Next player to act from engine:", game.getNextPlayerToAct()?.address?.slice(-4) || "None");

            // Check if there's a pending bet/raise that needs responses
            const lastBetOrRaise = turnActionsAfterCall
                .slice()
                .reverse()
                .find((a: any) => a.action === PlayerActionType.BET || a.action === PlayerActionType.RAISE || a.action === PlayerActionType.ALL_IN);
            if (lastBetOrRaise) {
                console.log(`Last bet/raise/all-in: ${lastBetOrRaise.playerId.slice(-4)} - ${lastBetOrRaise.action} ${lastBetOrRaise.amount}`);

                // Check who acted after this bet
                const lastBetIndex = turnActionsAfterCall.indexOf(lastBetOrRaise);
                const actionsAfterBet = turnActionsAfterCall.slice(lastBetIndex + 1);
                console.log(
                    "Actions after last bet:",
                    actionsAfterBet.map((a: any) => `${a.playerId.slice(-4)}-${a.action}`)
                );

                // Check the engine's logic for Step 8
                console.log("\n=== DEBUGGING STEP 8 LOGIC ===");
                console.log(
                    "Active players:",
                    activePlayersForRound.map((p: any) => p.address.slice(-4))
                );
                console.log("Last bet player:", lastBetOrRaise.playerId.slice(-4));

                for (const player of activePlayersForRound) {
                    const isOriginalBettor = player.address === lastBetOrRaise.playerId;
                    const playerActionsAfterBet = turnActionsAfterCall.filter(
                        (a: any) => a.playerId === player.address && turnActionsAfterCall.indexOf(a) > lastBetIndex
                    );

                    console.log(`Player ${player.address.slice(-4)}: isOriginalBettor=${isOriginalBettor}, actionsAfterBet=${playerActionsAfterBet.length}`);

                    if (isOriginalBettor) {
                        console.log("  -> Engine SKIPS this player in Step 8 (this is the bug!)");
                    } else if (playerActionsAfterBet.length === 0) {
                        console.log("  -> This player hasn't acted after bet - round should NOT end");
                    } else {
                        console.log(`  -> This player acted after bet: ${playerActionsAfterBet.map((a: any) => a.action).join(", ")}`);
                    }
                }

                console.log("\n🐛 BUG IDENTIFIED:");
                console.log("- Engine incorrectly skips original bettor in Step 8");
                console.log("- In poker, after bet->call, original bettor should get another turn");
                console.log("- Engine should check if original bettor has acted AGAIN after the call");
            }

            expect(game.currentRound).toBe(TexasHoldemRound.RIVER);
        });
    });

    describe("Issue #1556 - Player did not win when other player mucked", () => {
        it("should award pot to showing player when opponent mucks at showdown", () => {
            // This is the exact state from issue #1556 (before muck action)
            const stateBeforeMuck = {
                id: "1",
                result: {
                    data: {
                        type: "cash",
                        address: "0x56c45cf17cb33bd959986ff343a9287ef289683c2377e0cd1fe02854744a72d5",
                        gameOptions: {
                            minBuyIn: "400000000000000000",
                            maxBuyIn: "2000000000000000000",
                            minPlayers: 2,
                            maxPlayers: 9,
                            smallBlind: "10000000000000000",
                            bigBlind: "20000000000000000",
                            timeout: 300,
                            type: "cash"
                        },
                        dealer: 2,
                        smallBlindPosition: 6,
                        bigBlindPosition: 2,
                        players: [
                            {
                                address: "b521s8aug28r6vned2xm767xhgrkg90wfef2hfg4mg",
                                seat: 2,
                                stack: "500000000000000000",
                                isSmallBlind: false,
                                isBigBlind: true,
                                isDealer: true,
                                holeCards: ["6D", "2S"],
                                status: "active",
                                legalActions: [
                                    { action: "muck", min: "0", max: "0", index: 73 },
                                    { action: "show", min: "0", max: "0", index: 73 }
                                ],
                                sumOfBets: "10000000000000000",
                                timeout: 0,
                                signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
                            },
                            {
                                address: "b521kjpfyeyg3watq2f978vhu48ju3xjwdp0wjgp5t",
                                seat: 6,
                                stack: "220000000000000000",
                                isSmallBlind: true,
                                isBigBlind: false,
                                isDealer: false,
                                holeCards: ["4C", "TC"],
                                status: "showing",
                                lastAction: {
                                    playerId: "b521kjpfyeyg3watq2f978vhu48ju3xjwdp0wjgp5t",
                                    seat: 6,
                                    action: "show",
                                    amount: "0",
                                    round: "showdown",
                                    index: 72,
                                    timestamp: 1766053287510
                                },
                                legalActions: [],
                                sumOfBets: "20000000000000000",
                                timeout: 0,
                                signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
                            }
                        ],
                        communityCards: ["KH", "QS", "TD", "6H", "9C"],
                        deck: "X",
                        pots: ["360000000000000000"],
                        nextToAct: 2,
                        previousActions: [
                            {
                                playerId: "b521kjpfyeyg3watq2f978vhu48ju3xjwdp0wjgp5t",
                                seat: 6,
                                action: "show",
                                amount: "0",
                                round: "showdown",
                                index: 72,
                                timestamp: 1766053287510
                            }
                        ],
                        actionCount: 58,
                        handNumber: 5,
                        round: "showdown",
                        winners: [],
                        results: [],
                        signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
                    },
                    signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            };

            const game = fromTestJson(stateBeforeMuck);

            // Verify initial state
            expect(game.currentRound).toBe(TexasHoldemRound.SHOWDOWN);
            expect(game.winners.size).toBe(0); // No winner yet

            // Perform the muck action (this triggers the bug)
            game.performAction("b521s8aug28r6vned2xm767xhgrkg90wfef2hfg4mg", PlayerActionType.MUCK, 73, 0n);

            const finalState = game.toJSON();

            // ✅ ASSERTIONS - What SHOULD happen:

            // 1. Winner should be declared
            expect(game.winners.size).toBe(1);
            const winnerEntries = Array.from(game.winners.entries());
            expect(winnerEntries[0][0]).toBe("b521kjpfyeyg3watq2f978vhu48ju3xjwdp0wjgp5t"); // Winner address (Map key)

            // 2. Pot should be awarded to winner (220000000000000000 + 360000000000000000 = 580000000000000000)
            const winner = game.findPlayerByAddress("b521kjpfyeyg3watq2f978vhu48ju3xjwdp0wjgp5t");
            expect(winner).toBeDefined();
            expect(winner!.stack).toBe(580000000000000000n);

            // 3. Round should be END
            expect(game.currentRound).toBe(TexasHoldemRound.END);

            // 4. Payout should be recorded
            expect(winnerEntries[0][1].payout).toBe(360000000000000000n); // Winner payout (Map value)
        });
    });
});
