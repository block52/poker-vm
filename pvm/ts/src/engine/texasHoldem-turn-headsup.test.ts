import { NonPlayerActionType, PlayerActionType, TexasHoldemRound, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, mnemonic, fromTestJson } from "./testConstants";

const test_json = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0x22dfa2150160484310c5163f280f49e23b8fd34326",
            "gameOptions": {
                "minBuyIn": "10000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 9,
                "minPlayers": 2,
                "smallBlind": "100000000000000000",
                "bigBlind": "200000000000000000",
                "timeout": 300
            },
            "smallBlindPosition": 1,
            "bigBlindPosition": 2,
            "dealer": 9,
            "players": [
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "stack": "300000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "deck": "2S-KH-3C-7C-3D-KC-4C-7S-10S-JD-10D-2D-[2C]-6C-6S-QH-7D-9S-5D-7H-5H-8D-9D-JC-QS-8H-6H-KD-5C-AC-4D-JS-10C-AH-AS-10H-KS-8C-8S-JH-9C-3S-4H-4S-3H-6D-9H-5S-AD-QC-2H-QD",
                    "holeCards": [
                        "2S",
                        "3C"
                    ],
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 8
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 2,
                    "stack": "0",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "deck": "2S-KH-3C-7C-3D-KC-4C-7S-10S-JD-10D-2D-[2C]-6C-6S-QH-7D-9S-5D-7H-5H-8D-9D-JC-QS-8H-6H-KD-5C-AC-4D-JS-10C-AH-AS-10H-KS-8C-8S-JH-9C-3S-4H-4S-3H-6D-9H-5S-AD-QC-2H-QD",
                    "holeCards": [
                        "KH",
                        "7C"
                    ],
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 8
                        },
                        {
                            "action": "check",
                            "min": "0",
                            "max": "0",
                            "index": 8
                        },
                        {
                            "action": "bet",
                            "min": "0",
                            "max": "0",
                            "index": 8
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [
                "7S",
                "10S",
                "JD",
                "2D"
            ],
            "deck": "2S-KH-3C-7C-3D-KC-4C-7S-10S-JD-10D-2D-[2C]-6C-6S-QH-7D-9S-5D-7H-5H-8D-9D-JC-QS-8H-6H-KD-5C-AC-4D-JS-10C-AH-AS-10H-KS-8C-8S-JH-9C-3S-4H-4S-3H-6D-9H-5S-AD-QC-2H-QD",
            "pots": [
                "1700000000000000000"
            ],
            "lastToAct": 1,
            "nextToAct": 2,
            "previousActions": [
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "post-small-blind",
                    "amount": "100000000000000000",
                    "round": "ante",
                    "index": 1
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 2,
                    "action": "post-big-blind",
                    "amount": "200000000000000000",
                    "round": "ante",
                    "index": 1
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 2
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "raise",
                    "amount": "300000000000000000",
                    "round": "preflop",
                    "index": 3
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 2,
                    "action": "raise",
                    "amount": "600000000000000000",
                    "round": "preflop",
                    "index": 4
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "call",
                    "amount": "100000000000000000",
                    "round": "preflop",
                    "index": 5
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 2,
                    "action": "all-in",
                    "amount": "200000000000000000",
                    "round": "flop",
                    "index": 6
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "call",
                    "amount": "200000000000000000",
                    "round": "flop",
                    "index": 7
                }
            ],
            "round": "turn",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0x7ad21711ed2e9b07bb993445de702236356f49b70480a99ba52a587cf9c02a7645d2cf4758d109501bc74d97852afb3b780d5874c068489e1bedc4260c166adc1b"
    }
}

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in a heads-up scenario.
describe("Texas Holdem - Thru - Heads Up", () => {
    describe("Turn tests", () => {

        const SEAT_1 = "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C";
        const SEAT_2 = "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD";

        let game: TexasHoldemGame;

        beforeEach(() => {
            game = fromTestJson(test_json);
            // game.performAction(SEAT_1, NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS);
            // game.performAction(SEAT_2, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS);
            // game.performAction(SEAT_1, PlayerActionType.SMALL_BLIND, 2, ONE_TOKEN);
            // game.performAction(SEAT_2, PlayerActionType.BIG_BLIND, 3, TWO_TOKENS);
            // game.performAction(SEAT_1, NonPlayerActionType.DEAL, 4);
            // expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
            // game.performAction(SEAT_1, PlayerActionType.CHECK, 5, 0n);
            // game.performAction(SEAT_2, PlayerActionType.CHECK, 6, 0n);
            // expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
            // game.performAction(SEAT_1, PlayerActionType.CHECK, 7, 0n);
            // game.performAction(SEAT_2, PlayerActionType.CHECK, 8, 0n);
        });

        it("should have correct legal actions after turn", () => {
            // Check the current round
            expect(game.currentRound).toEqual(TexasHoldemRound.TURN);

            // Get legal actions for the next player
            let actual = game.getLegalActions(SEAT_1);
            expect(actual).toBeDefined();
            // expect(actual.length).toEqual(1);
            // expect(actual[0].action).toEqual(PlayerActionType.SMALL_BLIND);
            // expect(actual[1].action).toEqual(PlayerActionType.FOLD);
        });
    });
});
