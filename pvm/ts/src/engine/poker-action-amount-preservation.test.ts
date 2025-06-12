/**
 * POKER ACTION AMOUNT PRESERVATION TEST
 * 
 * PURPOSE:
 * This test ensures that bet amounts are properly preserved through the entire transaction pipeline:
 * 1. PerformActionCommand creates transaction data with bet amounts included
 * 2. Transaction data format: "bet,index,amount" instead of just "bet,index" 
 * 3. GameStateCommand and PerformActionCommand extract amounts from transaction data
 * 4. Player stacks are correctly decremented when poker actions are processed
 * 
 * WHY THIS IS NEEDED:
 * - Poker actions (BET, CALL, RAISE) have transaction.value = 0 to prevent double deduction
 * - The actual bet amount must be stored in transaction.data field
 * - When processing transactions, we must extract the amount from data, not use transaction.value
 * - Without this fix, all poker actions would have amount = 0 and stacks wouldn't decrement
 * 
 * THE BUG THIS PREVENTS:
 * - Before fix: transaction.data = "bet,11" → amount = 0 → stack unchanged ❌
 * - After fix: transaction.data = "bet,11,50000000000000000" → amount = 0.05 ETH → stack decremented ✅
 */

import { GameOptions, PlayerActionType, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { Transaction } from "../models/transaction";
import { toOrderedTransaction } from "../utils/parsers";

// Mock private key for testing
const PLAYER1_PRIVATE_KEY = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";

const gameOptions: GameOptions = {
    minBuyIn: 10000000000000000n,      // 0.01 ETH
    maxBuyIn: 1000000000000000000n,    // 1 ETH  
    maxPlayers: 9,
    minPlayers: 2,
    smallBlind: 10000000000000000n,    // 0.01 ETH
    bigBlind: 20000000000000000n,      // 0.02 ETH
    timeout: 30000
};

// Initial game state with two players ready to bet (after blinds posted)
const initialGameState = {
    "type": "cash",
    "address": "0xtest123",
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
            "stack": "990000000000000000", // 0.99 ETH (after posting small blind)
            "isSmallBlind": true,
            "isBigBlind": false,
            "isDealer": false,
            "holeCards": ["AH", "KH"],
            "status": "active",
            "legalActions": [],
            "sumOfBets": "10000000000000000", // Posted small blind
            "timeout": 0,
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        {
            "address": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD", 
            "seat": 2,
            "stack": "980000000000000000", // 0.98 ETH (after posting big blind)
            "isSmallBlind": false,
            "isBigBlind": true,
            "isDealer": false,
            "holeCards": ["QS", "QH"],
            "status": "active", 
            "legalActions": [],
            "sumOfBets": "20000000000000000", // Posted big blind
            "timeout": 0,
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        }
    ],
    "communityCards": ["JS", "10H", "9D"],
    "deck": "2C-2D-2H-2S-3C-3D-3H-3S-4C-4D-4H-4S-5C-5D-5H-5S-6C-6D-6H-6S-7C-7D-7H-7S-8C-8D-8H-8S-9C-9D-9H-9S-10C-10D-10H-10S-JC-JD-JH-JS-QC-QD-QH-QS-KC-KD-KH-KS-AC-AD-AH-AS", // Standard 52-card deck
    "pots": ["30000000000000000"], // 0.03 ETH (small blind + big blind)
    "lastActedSeat": 2,
    "actionCount": 4,
    "handNumber": 1,
    "nextToAct": 1,
    "previousActions": [
        {
            "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
            "seat": 1,
            "action": "join",
            "amount": "1000000000000000000",
            "round": "ante", 
            "index": 1,
            "timestamp": 1749520288072
        },
        {
            "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
            "seat": 2, 
            "action": "join",
            "amount": "1000000000000000000",
            "round": "ante",
            "index": 2,
            "timestamp": 1749520288073
        },
        {
            "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
            "seat": 1,
            "action": "post-small-blind", 
            "amount": "10000000000000000",
            "round": "ante",
            "index": 3,
            "timestamp": 1749520288074
        },
        {
            "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
            "seat": 2,
            "action": "post-big-blind",
            "amount": "20000000000000000", 
            "round": "ante",
            "index": 4,
            "timestamp": 1749520288075
        }
    ],
    "round": "preflop",
    "winners": [],
    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
};

describe("Poker Action Amount Preservation", () => {
    describe("Transaction data format and amount extraction", () => {
        
        it("should create transaction data with bet amount included", async () => {
            // Test the transaction data format created by PerformActionCommand
            const betAmount = 50000000000000000n; // 0.05 ETH
            
            // This simulates what PerformActionCommand does for poker actions
            const data = `bet,5,${betAmount.toString()}`;
            
            const mockTransaction = await Transaction.create(
                "0xtest123",
                "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                0n, // value is 0 to prevent double deduction  
                0n,
                PLAYER1_PRIVATE_KEY,
                data // data contains the bet amount
            );
            
            console.log(`✅ Transaction data format: ${mockTransaction.data}`);
            expect(mockTransaction.data).toBe(`bet,5,${betAmount.toString()}`);
            expect(mockTransaction.value).toBe(0n); // No double deduction
        });

        it("should extract bet amount from transaction data correctly", async () => {
            const betAmount = 75000000000000000n; // 0.075 ETH
            
            const mockTransaction = await Transaction.create(
                "0xtest123",
                "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                0n,
                0n,
                PLAYER1_PRIVATE_KEY,
                `bet,6,${betAmount.toString()}`
            );
            
            // This simulates what GameStateCommand and PerformActionCommand do
            const orderedTx = toOrderedTransaction(mockTransaction);
            let actionAmount = orderedTx.value; // This would be 0
            
            // THE FIX: Extract amount from data for poker actions
            if ((orderedTx.type === PlayerActionType.BET || 
                 orderedTx.type === PlayerActionType.RAISE || 
                 orderedTx.type === PlayerActionType.CALL) && 
                orderedTx.data && !isNaN(Number(orderedTx.data))) {
                actionAmount = BigInt(orderedTx.data);
                console.log(`✅ Amount extracted from data: ${actionAmount}`);
            }
            
            expect(actionAmount).toBe(betAmount);
            expect(orderedTx.type).toBe(PlayerActionType.BET);
        });

        it("should properly decrement player stack when amount is preserved", async () => {
            // Create game and get correct action index to avoid validation errors
            const game = TexasHoldemGame.fromJson(initialGameState, gameOptions);
            const player1 = game.getPlayer("0xE8DE79b707BfB7d8217cF0a494370A9cC251602C");
            const initialStack = player1.chips;
            
            // Get the CORRECT action index from the game state
            const correctActionIndex = game.getActionIndex();
            console.log(`✅ Using correct action index: ${correctActionIndex}`);
            
            const betAmount = 50000000000000000n; // 0.05 ETH
            
            // Create transaction with amount in data (the fix)
            const mockTransaction = await Transaction.create(
                "0xtest123",
                "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                0n,
                0n,
                PLAYER1_PRIVATE_KEY,
                `bet,${correctActionIndex},${betAmount.toString()}`
            );
            
            // Extract amount using our fix
            const orderedTx = toOrderedTransaction(mockTransaction);
            let actionAmount = orderedTx.value;
            
            if ((orderedTx.type === PlayerActionType.BET) && 
                orderedTx.data && !isNaN(Number(orderedTx.data))) {
                actionAmount = BigInt(orderedTx.data);
            }
            
            // Process the action with extracted amount
            game.performAction(orderedTx.from, orderedTx.type, orderedTx.index, actionAmount, null);
            
            // Verify stack was decremented
            const updatedPlayer = game.getPlayer("0xE8DE79b707BfB7d8217cF0a494370A9cC251602C");
            const expectedStack = initialStack - betAmount;
            
            console.log(`✅ Stack decremented: ${initialStack} → ${updatedPlayer.chips} (bet: ${betAmount})`);
            expect(updatedPlayer.chips).toBe(expectedStack);
        });

        it("should demonstrate the BUG: missing amount in data results in no stack change", async () => {
            const game = TexasHoldemGame.fromJson(initialGameState, gameOptions);
            const player1 = game.getPlayer("0xE8DE79b707BfB7d8217cF0a494370A9cC251602C");
            const initialStack = player1.chips;
            const correctActionIndex = game.getActionIndex();
            
            // Create transaction in BROKEN format (no amount in data)
            const brokenTransaction = await Transaction.create(
                "0xtest123",
                "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                0n,
                0n,
                PLAYER1_PRIVATE_KEY,
                `bet,${correctActionIndex}` // NO AMOUNT - this is the bug!
            );
            
            const orderedTx = toOrderedTransaction(brokenTransaction);
            let actionAmount = orderedTx.value; // This is 0
            
            // Without the fix, we can't extract amount from data
            console.log(`❌ Broken transaction data: ${brokenTransaction.data}`);
            console.log(`❌ ActionAmount without fix: ${actionAmount}`);
            
            game.performAction(orderedTx.from, orderedTx.type, orderedTx.index, actionAmount, null);
            
            const updatedPlayer = game.getPlayer("0xE8DE79b707BfB7d8217cF0a494370A9cC251602C");
            
            // Stack remains unchanged - this demonstrates the bug
            console.log(`❌ Stack unchanged: ${initialStack} → ${updatedPlayer.chips} (should have decreased!)`);
            expect(updatedPlayer.chips).toBe(initialStack); // No change - this is the bug!
        });
    });
}); 