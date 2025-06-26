
import TexasHoldemGame from "./texasHoldem";
import { fromTestJson } from "./testConstants";

const json = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0xe53cf3311b2555c662a834534e71d047dcf22f72",
            "gameOptions": {
                "minBuyIn": "10000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 9,
                "minPlayers": 2,
                "smallBlind": "10000000000000000",
                "bigBlind": "20000000000000000",
                "timeout": 30000
            },
            "smallBlindPosition": 1,
            "bigBlindPosition": 2,
            "dealer": 9,
            "players": [
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "stack": "960000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "AS",
                        "AH"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                        "seat": 1,
                        "action": "raise",
                        "amount": "30000000000000000",
                        "round": "preflop",
                        "index": 6,
                        "timestamp": 1749690879270
                    },
                    "legalActions": [],
                    "sumOfBets": "30000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 2,
                    "stack": "980000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "holeCards": [
                        "KC",
                        "KS"
                    ],
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 7
                        },
                        {
                            "action": "call",
                            "min": "30000000000000000",
                            "max": "30000000000000000",
                            "index": 7
                        },
                        {
                            "action": "raise",
                            "min": "30000000000000000",
                            "max": "980000000000000000",
                            "index": 7
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [],
            "deck": "7H-10S-6D-5S-[AD]-10D-2H-9H-KC-QH-JC-4D-QC-3S-4C-9C-2S-6C-8D-5C-8H-10C-6S-7D-JD-3C-9S-7S-3D-9D-KD-10H-AC-2D-KS-6H-JS-QS-JH-7C-8S-8C-5H-KH-3H-2C-AS-AH-QD-4H-4S-5D",
            "pots": [
                "60000000000000000"
            ],
            "lastActedSeat": 1,
            "actionCount": 0,
            "handNumber": 1,
            "nextToAct": 2,
            "previousActions": [
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 1,
                    "timestamp": 1737763200000
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 2,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 2,
                    "timestamp": 1737763200010
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "post-small-blind",
                    "amount": "10000000000000000",
                    "round": "ante",
                    "index": 3,
                    "timestamp": 1737763200020
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 2,
                    "action": "post-big-blind",
                    "amount": "20000000000000000",
                    "round": "ante",
                    "index": 4,
                    "timestamp": 1737763200030
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 5,
                    "timestamp": 1737763200040
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "raise",
                    "amount": "30000000000000000",
                    "round": "preflop",
                    "index": 6,
                    "timestamp": 1737763200050
                }
            ],
            "round": "preflop",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0xc58e3e799f328953f4984b9413ff6a9bad5304ac84347d96dc2f26db9a10964f52a0c0f5240fb8de47466f449e3548c8f6b4833be96f756c86d63ca633d33e4c1c"
    }
}

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in a heads-up scenario.
describe("Texas Holdem with Previous Actions", () => {

    let game: TexasHoldemGame;

    beforeEach(() => {
        game = fromTestJson(json);
    });

    it("Should load game with correct previous action timestamps", () => {
        expect(game).toBeDefined();
        const json = game.toJson();
        expect(json).toBeDefined();
        expect(json.previousActions).toBeDefined();
        expect(json.previousActions.length).toBe(6);
        expect(json.previousActions[0].timestamp).toBe(1737763200000);
        expect(json.previousActions[1].timestamp).toBe(1737763200010);
        expect(json.previousActions[2].timestamp).toBe(1737763200020);
        expect(json.previousActions[3].timestamp).toBe(1737763200030);
        expect(json.previousActions[4].timestamp).toBe(1737763200040);
        expect(json.previousActions[5].timestamp).toBe(1737763200050);
    });
});
