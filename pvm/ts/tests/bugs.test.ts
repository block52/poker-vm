import { GameOptions, NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "../src/engine/texasHoldem";
import { fromTestJson, ONE_TOKEN, PLAYER_1_ADDRESS, TWO_TOKENS } from "../src/engine/testConstants";
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
    test_1111,
    test_1137,
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

        it.only("should test bug 735 3", () => {
            game = fromTestJson(test_735_3);
            // Check the current round
            expect(game.currentPlayerId).toEqual("0xC84737526E425D7549eF20998Fa992f88EAC2484"); // Seat 2 has checked
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual("0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8"); // Seat 1 is next to act
        });

        // it.only("should test bug 753", () => {
        //     const SEAT_1 = "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C";
        //     // const SEAT_2 = "0xc264FEDe83B081C089530BA0b8770C98266d058a";

        //     game = fromTestJson(test_753);
        //     // Check who is next to act (seat 2 after dealing)
        //     expect(game.currentPlayerId).toEqual(SEAT_1);
        //     expect(game.smallBlindPosition).toEqual(2);
        //     expect(game.bigBlindPosition).toEqual(1);

        //     const actual = game.getLegalActions(SEAT_1);
        //     expect(actual).toBeDefined();
        // });

        it("should test bug 792", () => {
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
            expect(actual.length).toEqual(3);
            expect(actual[0].action).toEqual("fold");
            expect(actual[1].action).toEqual("call");
            expect(actual[2].action).toEqual("raise");
        });

        it("should test bug 873", () => {
            const SEAT_1 = "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8";
            const SEAT_2 = "0xC84737526E425D7549eF20998Fa992f88EAC2484";

            game = fromTestJson(test_873);
            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);
            expect(game.lastActedSeat).toEqual(2);
            const actual = game.getLegalActions(SEAT_1);
            expect(actual).toBeDefined();
            // Should be able to fold, call, or raise
            expect(actual.length).toEqual(3);
            expect(actual[0].action).toEqual("fold");
            expect(actual[1].action).toEqual("call");
            expect(actual[2].action).toEqual("raise");
        });

        it("should test bug 873 second test", () => {
            const SEAT_1 = "0xC84737526E425D7549eF20998Fa992f88EAC2484";

            game = fromTestJson(test_873_2);
            const actual = game.getLegalActions(SEAT_1);
            expect(actual).toBeDefined();
            expect(game.smallBlindPosition).toEqual(1);
            expect(game.bigBlindPosition).toEqual(2);
        });

        it("should test bug 877", () => {
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
            expect(actual.length).toEqual(3);
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
            expect(actual.length).toEqual(3);
            expect(actual[1].action).toEqual("call");
            expect(actual[1].min).toEqual("20000000000000000");
            expect(actual[1].max).toEqual("20000000000000000");
            expect(actual[2].action).toEqual("raise");
        });

        it("should test bug 902", () => {
            const SEAT_1 = "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C";
            const SEAT_2 = "0x4260E88e81E60113146092Fb9474b61C59f7552e";

            game = fromTestJson(test_902);
            // Game state should be end
            const actual = game.getLegalActions(SEAT_2);
            expect(actual).toBeDefined();
            expect(actual.length).toEqual(3);
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
            expect(actual.length).toEqual(3);
        });

        // it("should test bug 954", () => {
        //     game = fromTestJson(test_954);

        //     let previousActions = game.getPreviousActions();
        //     expect(previousActions.length).toEqual(5);
        //     expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

        //     // Player 1 to call
        //     const nextToAct = game.getNextPlayerToAct();
        //     expect(nextToAct?.address).toEqual("0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8");

        //     game.performAction("0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8", PlayerActionType.CALL, 6, ONE_TOKEN);
        //     previousActions = game.getPreviousActions();
        //     expect(previousActions.length).toEqual(6);
        // });

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
            expect(legalActions.length).toEqual(3);
        });

        it("should test bug 949", () => {
            game = fromTestJson(test_949);

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual("0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8");

            const legalActions = game.getLegalActions("0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8");
            expect(legalActions).toBeDefined();
            expect(legalActions.length).toEqual(3);

            expect(legalActions[0].action).toEqual("fold");
            expect(legalActions[1].action).toEqual("call");
            expect(legalActions[2].action).toEqual("raise");
            expect(legalActions[2].min).toEqual("60000000000000000");
        });

        it("should test bug 984 second test", () => {
            game = fromTestJson(test_984);

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual("0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8");

            const legalActions = game.getLegalActions("0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8");
            expect(legalActions).toBeDefined();
            expect(legalActions.length).toEqual(3);
            expect(legalActions[1].min).toEqual("20000000000000000");
            expect(legalActions[2].min).toEqual("40000000000000000");
        });

        it.only("should test bug 1006 second test", () => {
            game = fromTestJson(test_1006);

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual("0x4260E88e81E60113146092Fb9474b61C59f7552e");

            const legalActions = game.getLegalActions("0x4260E88e81E60113146092Fb9474b61C59f7552e");
            expect(legalActions).toBeDefined();
            expect(legalActions.length).toEqual(3);
            expect(legalActions[0].action).toEqual(NonPlayerActionType.DEAL);
            expect(legalActions[1].action).toEqual(PlayerActionType.FOLD);
            expect(legalActions[2].action).toEqual(PlayerActionType.SIT_OUT);
        });

        it("should test bug 1103", () => {
            game = fromTestJson(test_1103);

            // Player 4
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).not.toEqual("0xE8DE79b707BfB7d8217cF0a494370A9cC251602C");

            const legalActions = game.getLegalActions("0x4260E88e81E60113146092Fb9474b61C59f7552e");
            expect(legalActions).toBeDefined();

            game.performAction("0xE8DE79b707BfB7d8217cF0a494370A9cC251602C", PlayerActionType.CHECK, 0, ONE_TOKEN);
        });

        it("should test bug 1103 next to act", () => {
            game = fromTestJson(test_1103_2);

            // Player 4
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).not.toEqual("0xE8DE79b707BfB7d8217cF0a494370A9cC251602C");

            const legalActions = game.getLegalActions("0x4260E88e81E60113146092Fb9474b61C59f7552e");
            expect(legalActions).toBeDefined();

            game.performAction("0xE8DE79b707BfB7d8217cF0a494370A9cC251602C", PlayerActionType.CHECK, 0, ONE_TOKEN);
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
            expect(legalActions.length).toEqual(3);

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

        it.skip("should test bug 1130", () => {
            game = fromTestJson(test_1130);
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
        });

        it("should test bug 1111 - sumOfBets should include blinds in JSON", () => {
            // Use test_1130_edited as the basis since it has blind posting setup
            game = fromTestJson(test_1130_edited);

            // Verify internal game state has correct totals including blinds
            expect(game.getPlayerTotalBets("0xC84737526E425D7549eF20998Fa992f88EAC2484", TexasHoldemRound.ANTE, true)).toBe(100000000000000000000n); // Small blind
            expect(game.getPlayerTotalBets("0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD", TexasHoldemRound.ANTE, true)).toBe(200000000000000000000n); // Big blind

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

            game.performAction("0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD", PlayerActionType.CHECK, 27, 0n);

            console.log("\n=== AFTER CHECK ACTION ===");
            console.log("Current round:", game.currentRound);
            console.log("Has round ended after action:", (game as any).hasRoundEnded(TexasHoldemRound.PREFLOP));

            expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
        });

        it("should test bug 1111 - sumOfBets values for blinds", () => {
            game = fromTestJson(test_1111);

            console.log("=== BUG 1111: sumOfBets for Blinds ===");
            console.log("Current round:", game.currentRound);
            console.log("Pot total:", game.pot.toString());

            // Define player addresses
            const SEAT_1_SMALL_BLIND = "0xC84737526E425D7549eF20998Fa992f88EAC2484";
            const SEAT_2_BIG_BLIND = "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C";
            const SEAT_3_CALLER = "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8";
            const SEAT_4_DEALER = "0x4260E88e81E60113146092Fb9474b61C59f7552e";

            // Expected values from the data
            const SMALL_BLIND_AMOUNT = BigInt("100000000000000000000"); // 100 tokens
            const BIG_BLIND_AMOUNT = BigInt("200000000000000000000");   // 200 tokens
            const CALL_AMOUNT = BigInt("200000000000000000000");        // 200 tokens

            // Check game state
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
            expect(game.pot).toEqual(BigInt("500000000000000000000")); // 100 + 200 + 200 = 500

            // Test JSON output to verify sumOfBets property
            console.log("=== TESTING JSON OUTPUT ===");
            const gameJson = game.toJson();
            console.log("Game JSON players with sumOfBets:");

            // Find each player in the JSON and verify their sumOfBets
            const jsonSmallBlindPlayer = gameJson.players.find((p: any) => p.address === SEAT_1_SMALL_BLIND);
            const jsonBigBlindPlayer = gameJson.players.find((p: any) => p.address === SEAT_2_BIG_BLIND);
            const jsonCallerPlayer = gameJson.players.find((p: any) => p.address === SEAT_3_CALLER);
            const jsonDealerPlayer = gameJson.players.find((p: any) => p.address === SEAT_4_DEALER);

            // Verify JSON objects have sumOfBets property
            expect(jsonSmallBlindPlayer).toBeDefined();
            expect(jsonSmallBlindPlayer?.sumOfBets).toBeDefined();
            expect(jsonBigBlindPlayer).toBeDefined();
            expect(jsonBigBlindPlayer?.sumOfBets).toBeDefined();
            expect(jsonCallerPlayer).toBeDefined();
            expect(jsonCallerPlayer?.sumOfBets).toBeDefined();
            expect(jsonDealerPlayer).toBeDefined();
            expect(jsonDealerPlayer?.sumOfBets).toBeDefined();

            // Check sumOfBets values in JSON
            console.log(`JSON SEAT_1 (Small Blind): sumOfBets=${jsonSmallBlindPlayer?.sumOfBets}`);
            console.log(`JSON SEAT_2 (Big Blind): sumOfBets=${jsonBigBlindPlayer?.sumOfBets}`);
            console.log(`JSON SEAT_3 (Caller): sumOfBets=${jsonCallerPlayer?.sumOfBets}`);
            console.log(`JSON SEAT_4 (Dealer): sumOfBets=${jsonDealerPlayer?.sumOfBets}`);

            // Assert JSON sumOfBets values match expectations
            // These should be the CORRECT values - test will fail showing the bug
            expect(jsonSmallBlindPlayer?.sumOfBets).toEqual("100000000000000000000"); // Should be 100 tokens
            expect(jsonBigBlindPlayer?.sumOfBets).toEqual("200000000000000000000");   // Should be 200 tokens  
            expect(jsonCallerPlayer?.sumOfBets).toEqual("200000000000000000000");     // ✅ Correct: Call bet is tracked
            expect(jsonDealerPlayer?.sumOfBets).toEqual("0");                         // ✅ Correct: No bets

            // Get all players
            const smallBlindPlayer = game.getPlayer(SEAT_1_SMALL_BLIND);
            const bigBlindPlayer = game.getPlayer(SEAT_2_BIG_BLIND);
            const callerPlayer = game.getPlayer(SEAT_3_CALLER);
            const dealerPlayer = game.getPlayer(SEAT_4_DEALER);

            console.log("=== PLAYER STACKS AND BETS ===");

            // Get total bets using game's method - check all rounds
            const smallBlindTotalBets = game.getPlayerTotalBets(SEAT_1_SMALL_BLIND, game.currentRound, true); // includeBlinds = true
            const bigBlindTotalBets = game.getPlayerTotalBets(SEAT_2_BIG_BLIND, game.currentRound, true); // includeBlinds = true  
            const callerTotalBets = game.getPlayerTotalBets(SEAT_3_CALLER, game.currentRound, true); // includeBlinds = true
            const dealerTotalBets = game.getPlayerTotalBets(SEAT_4_DEALER, game.currentRound, true); // includeBlinds = true

            // Check small blind player
            console.log(`SEAT_1 (Small Blind): Stack=${smallBlindPlayer.chips.toString()}, TotalBets=${smallBlindTotalBets.toString()}`);
            expect(smallBlindPlayer.chips).toEqual(BigInt("9900000000000000000000")); // 10000 - 100 = 9900
            // VERIFIED: This is correctly tracking 100000000000000000000 (100 tokens)
            expect(smallBlindTotalBets).toEqual(SMALL_BLIND_AMOUNT); // This assertion passes - blind bets ARE tracked correctly

            // Check big blind player  
            console.log(`SEAT_2 (Big Blind): Stack=${bigBlindPlayer.chips.toString()}, TotalBets=${bigBlindTotalBets.toString()}`);
            expect(bigBlindPlayer.chips).toEqual(BigInt("9800000000000000000000")); // 10000 - 200 = 9800
            // VERIFIED: This is correctly tracking 200000000000000000000 (200 tokens)
            expect(bigBlindTotalBets).toEqual(BIG_BLIND_AMOUNT); // This assertion passes - blind bets ARE tracked correctly

            // Check caller player (this should work correctly)
            console.log(`SEAT_3 (Caller): Stack=${callerPlayer.chips.toString()}, TotalBets=${callerTotalBets.toString()}`);
            expect(callerPlayer.chips).toEqual(BigInt("9800000000000000000000")); // 10000 - 200 = 9800
            expect(callerTotalBets).toEqual(CALL_AMOUNT); // This should work correctly

            // Check dealer player (no bets yet)
            console.log(`SEAT_4 (Dealer): Stack=${dealerPlayer.chips.toString()}, TotalBets=${dealerTotalBets.toString()}`);
            expect(dealerPlayer.chips).toEqual(BigInt("10000000000000000000000")); // No change
            expect(dealerTotalBets).toEqual(BigInt(0)); // Should be 0

            console.log("=== BLIND BET TRACKING ===");
            console.log("✅ Small blind bet IS correctly tracked by game.getPlayerTotalBets()");
            console.log("✅ Big blind bet IS correctly tracked by game.getPlayerTotalBets()");
            console.log("✅ Small blind bet IS now correctly tracked in JSON sumOfBets!");
            console.log("✅ Big blind bet IS now correctly tracked in JSON sumOfBets!");
            console.log("✅ Total pot equals sum of all bets: 100 + 200 + 200 = 500");

            // Additional verification: total bets should equal pot
            const totalPlayerBets = smallBlindTotalBets + bigBlindTotalBets + callerTotalBets + dealerTotalBets;
            console.log(`Total player bets: ${totalPlayerBets.toString()}`);
            expect(totalPlayerBets).toEqual(game.pot);

            console.log("=== BUG 1111 RESULT: FIXED! JSON sumOfBets now includes blind bets! ===");
        });
    });

    describe.only("Bug 1137 - Should allow seat 1 to start new hand after tournament end", () => {
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

        // it("should have busted players marked correctly", () => {
        //     const players = game.getPlayers();
        //     const seat2Player = players.find(p => p.seat === 2);
        //     const seat3Player = players.find(p => p.seat === 3);

        //     expect(seat2Player?.status).toBe(PlayerStatus.BUSTED);
        //     expect(seat3Player?.status).toBe(PlayerStatus.BUSTED);
        //     expect(seat2Player?.stack).toBe(0n);
        //     expect(seat3Player?.stack).toBe(0n);
        // });

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
            const players = game.g

            // Seat 1 should have remaining chips
            const seat1Player = players.find(p => p.seat === 1);
            expect(seat1Player?.stack).toBe(BigInt("9200000000000000000000"));

            // Seat 4 (winner) should have most chips
            const seat4Player = players.find(p => p.seat === 4);
            expect(seat4Player?.stack).toBe(BigInt("30800000000000000000000"));

            // Seats 2 and 3 should be busted
            const seat2Player = players.find(p => p.seat === 2);
            const seat3Player = players.find(p => p.seat === 3);
            expect(seat2Player?.stack).toBe(0n);
            expect(seat3Player?.stack).toBe(0n);
        });

        it("should execute new-hand action successfully", () => {
            const seat1Address = "0xc264FEDe83B081C089530BA0b8770C98266d058a";

            expect(() => {
                game.performAction(seat1Address, NonPlayerActionType.NEW_HAND, 17);
            }).not.toThrow();

            // After new hand, the game should reset for heads-up play
            expect(game.currentRound).toBe(TexasHoldemRound.ANTE);
        });
    });
});
