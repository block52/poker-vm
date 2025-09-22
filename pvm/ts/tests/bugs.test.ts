import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
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

        it.only("should test bug 1126", () => {
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
    });
});
