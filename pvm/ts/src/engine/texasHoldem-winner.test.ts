import TexasHoldemGame from "./texasHoldem";

import { fromTestJson } from "./testConstants";

const test_json = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0x7c15f1978e252f1f3293c1d8f06adbb47ce7216a",
            "gameOptions": {
                "minBuyIn": "10000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 9,
                "minPlayers": 2,
                "smallBlind": "10000000000000000",
                "bigBlind": "20000000000000000",
                "timeout": 30000
            },
            "smallBlindPosition": 2,
            "bigBlindPosition": 1,
            "dealer": 1,
            "players": [
                {
                    "address": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "stack": "960000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": true,
                    "holeCards": [
                        "9D",
                        "5D"
                    ],
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "muck",
                            "min": "0",
                            "max": "0",
                            "index": 57
                        },
                        {
                            "action": "show",
                            "min": "0",
                            "max": "0",
                            "index": 57
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "stack": "960000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "3D",
                        "2D"
                    ],
                    "status": "showing",
                    "lastAction": {
                        "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                        "seat": 2,
                        "action": "show",
                        "amount": "0",
                        "round": "showdown",
                        "index": 56,
                        "timestamp": 1750212681379
                    },
                    "legalActions": [],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [
                "9C",
                "4D",
                "QC",
                "KC",
                "6D"
            ],
            "deck": "9D-3D-5D-2D-AS-QD-JC-9C-4D-QC-AD-KC-5S-6D-[8D]-JD-7H-7D-TD-KD-2H-4H-AH-5H-TH-TS-6H-3H-JS-JH-8H-9H-5C-QH-4S-KH-3S-2S-4C-8S-6C-6S-7S-TC-9S-QS-8C-KS-AC-7C-2C-3C",
            "pots": [
                "40000000000000000"
            ],
            "lastActedSeat": 2,
            "actionCount": 44,
            "handNumber": 4,
            "nextToAct": 1,
            "previousActions": [
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "post-small-blind",
                    "amount": "10000000000000000",
                    "round": "ante",
                    "index": 45,
                    "timestamp": 1750212636390
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "post-big-blind",
                    "amount": "20000000000000000",
                    "round": "ante",
                    "index": 46,
                    "timestamp": 1750212636390
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 47,
                    "timestamp": 1750212636390
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "call",
                    "amount": "10000000000000000",
                    "round": "preflop",
                    "index": 48,
                    "timestamp": 1750212651390
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 49,
                    "timestamp": 1750212651390
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 50,
                    "timestamp": 1750212651390
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 51,
                    "timestamp": 1750212651390
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "check",
                    "amount": "",
                    "round": "turn",
                    "index": 52,
                    "timestamp": 1750212666390
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "check",
                    "amount": "",
                    "round": "turn",
                    "index": 53,
                    "timestamp": 1750212666390
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "check",
                    "amount": "",
                    "round": "river",
                    "index": 54,
                    "timestamp": 1750212666390
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "check",
                    "amount": "",
                    "round": "river",
                    "index": 55,
                    "timestamp": 1750212681379
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "show",
                    "amount": "",
                    "round": "showdown",
                    "index": 56,
                    "timestamp": 1750212681379
                }
            ],
            "round": "showdown",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0x6dd98efbd5bdca2542663030a829b35e36d08d8e8756320371061f2b0f093e1e21d287080d2410829049a310f4f42d5ded7761626b0227c493e82056ad3c58641c"
    }
}

describe("Texas Holdem - Winner", () => {

    let game: TexasHoldemGame;

    beforeEach(() => {
        game = fromTestJson(test_json);
    });

    it("should not win with seven duce", () => {
        expect(game).toBeDefined();

        const cards = ["7S", "2C"];
        const won: Boolean = game.findWinners(cards);

        expect(won).toBeFalsy();
    });

    it("should not win with top set", () => {
        expect(game).toBeDefined();

        const cards = ["KC", "KD"];
        const won: Boolean = game.findWinners(cards);

        expect(won).toBeTruthy();
    });
});
