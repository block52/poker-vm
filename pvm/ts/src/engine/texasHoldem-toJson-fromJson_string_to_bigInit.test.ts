import { TexasHoldemRound, GameOptions } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { ethers } from "ethers";

// Test game state with actual numbers that need BigInt conversion
const testGameStateJson = {
    "type": "cash",
    "address": "0xdb3de1f034c0dc6b027f408d063bdfe919a47622",
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
            "stack": "1000000000000000000",
            "isSmallBlind": true,
            "isBigBlind": false,
            "isDealer": false,
            "holeCards": ["10H", "10D"],
            "status": "showing",
            "legalActions": [],
            "sumOfBets": "0",
            "timeout": 0,
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        {
            "address": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
            "seat": 2,
            "stack": "940000000000000000",
            "isSmallBlind": false,
            "isBigBlind": true,
            "isDealer": false,
            "holeCards": ["10S", "4H"],
            "status": "showing",
            "legalActions": [],
            "sumOfBets": "0",
            "timeout": 0,
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        }
    ],
    "communityCards": ["JC", "6H", "KH", "JH", "2C"],
    "deck": "10H-10S-10D-4H-AD-3C-5C-JC-6H-KH-2S-JH-JS-2C-[2H]-9D-5H-5D-7H-8C-7S-5S-10C-8D-3S-JD-8S-3D-7D-4S-3H-2D-KD-AH-QC-7C-QS-6S-AS-AC-8H-4D-9S-6C-6D-9H-4C-QH-9C-QD-KS-KC",
    "pots": ["440000000000000000"],
    "lastActedSeat": 2,
    "actionCount": 0,
    "handNumber": 1,
    "nextToAct": 1,
    "previousActions": [
        {
            "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
            "seat": 1,
            "action": "join",
            "amount": "500000000000000000",
            "round": "ante",
            "index": 1,
            "timestamp": 1749520288072
        },
        {
            "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
            "seat": 2,
            "action": "topup",
            "amount": "440000000000000000",
            "round": "ante",
            "index": 2,
            "timestamp": 1749520288072
        }
    ],
    "round": "end",
    "winners": [
        {
            "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
            "amount": "440000000000000000",
            "cards": ["10H", "10D"],
            "name": "Two Pair",
            "description": "Two Pair, J's & 10's"
        }
    ],
    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
};

const gameOptions: GameOptions = {
    minBuyIn: 10000000000000000n,
    maxBuyIn: 1000000000000000000n,
    maxPlayers: 9,
    minPlayers: 2,
    smallBlind: 10000000000000000n,
    bigBlind: 20000000000000000n,
    timeout: 30000
};

describe("Texas Holdem - String to BigInt Conversion", () => {
    describe("toJson and fromJson conversions", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(testGameStateJson, gameOptions);
        });

        it("should convert string values to BigInt in fromJson", () => {
            // Verify game options were converted from strings to BigInt
            expect(game.minBuyIn).toBe(10000000000000000n);
            expect(game.maxBuyIn).toBe(1000000000000000000n);
            expect(game.smallBlind).toBe(10000000000000000n);
            expect(game.bigBlind).toBe(20000000000000000n);

            // Verify player stacks were converted from strings to BigInt
            const players = game.getSeatedPlayers();
            expect(players).toHaveLength(2);
            
            const player1 = players.find(p => p.address === "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C");
            const player2 = players.find(p => p.address === "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD");
            
            expect(player1?.chips).toBe(1000000000000000000n);
            expect(player2?.chips).toBe(940000000000000000n);

            // Verify pot was converted from string to BigInt
            expect(game.pot).toBe(440000000000000000n);
        });

        it("should convert BigInt values to strings in toJson", () => {
            const gameState = game.toJson();

            // Verify game options are converted to strings
            expect(gameState.gameOptions.minBuyIn).toBe("10000000000000000");
            expect(gameState.gameOptions.maxBuyIn).toBe("1000000000000000000");
            expect(gameState.gameOptions.smallBlind).toBe("10000000000000000");
            expect(gameState.gameOptions.bigBlind).toBe("20000000000000000");

            // Verify player stacks are converted to strings
            expect(gameState.players).toHaveLength(2);
            expect(gameState.players[0].stack).toBe("1000000000000000000");
            expect(gameState.players[1].stack).toBe("940000000000000000");

            // Verify pots are converted to strings
            expect(gameState.pots[0]).toBe("440000000000000000");

            // Verify winner amounts are converted to strings
            expect(gameState.winners[0].amount).toBe("440000000000000000");
        });

        it("should maintain precision in round-trip conversion", () => {
            // Original values
            const originalPot = game.pot;
            const originalPlayer1Stack = game.getPlayer("0xE8DE79b707BfB7d8217cF0a494370A9cC251602C").chips;
            const originalPlayer2Stack = game.getPlayer("0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD").chips;

            // Convert to JSON and back
            const gameStateJson = game.toJson();
            const reconstructedGame = TexasHoldemGame.fromJson(gameStateJson, gameOptions);

            // Verify values are identical after round-trip
            expect(reconstructedGame.pot).toBe(originalPot);
            expect(reconstructedGame.getPlayer("0xE8DE79b707BfB7d8217cF0a494370A9cC251602C").chips).toBe(originalPlayer1Stack);
            expect(reconstructedGame.getPlayer("0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD").chips).toBe(originalPlayer2Stack);
        });

        it("should handle action amounts correctly in serialization", () => {
            const gameState = game.toJson();
            
            // Check that action amounts are properly converted to strings
            const joinAction = gameState.previousActions.find(a => a.action === "join");
            const topupAction = gameState.previousActions.find(a => a.action === "topup");
            
            expect(joinAction?.amount).toBe("500000000000000000");
            expect(topupAction?.amount).toBe("440000000000000000");

            // Reconstruct and verify amounts are converted back to BigInt
            const reconstructedGame = TexasHoldemGame.fromJson(gameState, gameOptions);
            const reconstructedActions = reconstructedGame.getPreviousActions();
            
            const reconstructedJoin = reconstructedActions.find(a => a.action === "join");
            const reconstructedTopup = reconstructedActions.find(a => a.action === "topup");
            
            expect(reconstructedJoin?.amount).toBe(500000000000000000n);
            expect(reconstructedTopup?.amount).toBe(440000000000000000n);
        });

        it("should correctly track dealer position", () => {
            expect(game.dealerPosition).toBe(9);
            
            // Verify after round-trip
            const gameState = game.toJson();
            const reconstructedGame = TexasHoldemGame.fromJson(gameState, gameOptions);
            expect(reconstructedGame.dealerPosition).toBe(9);
        });
    });
});
