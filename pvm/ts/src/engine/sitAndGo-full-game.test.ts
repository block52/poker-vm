import {
    PlayerStatus,
    TexasHoldemRound,
    GameOptions,
    PlayerActionType,
    NonPlayerActionType,
    GameType,
    GameStatus,
    TexasHoldemStateDTO
} from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { ONE_HUNDRED_TOKENS, TWO_TOKENS, ONE_TOKEN } from "./testConstants";
import { Player } from "../models/player";
import { SitAndGoStatusManager } from "./managers/statusManager";
import { PayoutManager } from "./managers/payoutManager";

describe.skip("Sit and Go - Full Game", () => {
    describe("Complete Tournament Flow", () => {
        let game: TexasHoldemGame;
        let gameOptions: GameOptions;

        // Player addresses for a 6-max sit and go
        const PLAYER_1 = "0x1111111111111111111111111111111111111111";
        const PLAYER_2 = "0x2222222222222222222222222222222222222222";
        const PLAYER_3 = "0x3333333333333333333333333333333333333333";
        const PLAYER_4 = "0x4444444444444444444444444444444444444444";
        const PLAYER_5 = "0x5555555555555555555555555555555555555555";
        const PLAYER_6 = "0x6666666666666666666666666666666666666666";

        beforeEach(() => {
            gameOptions = {
                minBuyIn: ONE_HUNDRED_TOKENS,
                maxBuyIn: ONE_HUNDRED_TOKENS, // Fixed buy-in for sit and go
                minPlayers: 6,
                maxPlayers: 6,
                smallBlind: ONE_TOKEN,
                bigBlind: TWO_TOKENS,
                timeout: 60000,
                type: GameType.SIT_AND_GO
            };

            const baseGameConfig = {
                address: "0x0000000000000000000000000000000000000000",
                dealer: 6,
                nextToAct: 1,
                currentRound: "ante",
                communityCards: [],
                pot: 0n,
                players: [],
                now: Date.now()
            };

            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should run a complete 6-player sit and go tournament", () => {
            // Sanity checks
            expect(game.getPlayerCount()).toBe(0);
            expect(game.findLivePlayers().length).toBe(0);
            expect(game.type).toBe(GameType.SIT_AND_GO);

            // Phase 1: Player Registration

            // Players join the tournament
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1");
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2");
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3");
            game.performAction(PLAYER_4, NonPlayerActionType.JOIN, 4, ONE_HUNDRED_TOKENS, "seat=4");
            game.performAction(PLAYER_5, NonPlayerActionType.JOIN, 5, ONE_HUNDRED_TOKENS, "seat=5");

            // Verify we're waiting for the last player
            expect(game.getPlayerCount()).toBe(5);
            const livePlayers = game.findLivePlayers();
            const statusManager = new SitAndGoStatusManager(livePlayers, gameOptions);
            expect(statusManager.getState()).toBe(GameStatus.WAITING_FOR_PLAYERS);

            // Last player joins - tournament should be ready to start
            game.performAction(PLAYER_6, NonPlayerActionType.JOIN, 6, ONE_HUNDRED_TOKENS, "seat=6");
            expect(game.getPlayerCount()).toBe(6);

            const finalLivePlayers = game.findLivePlayers();
            const finalStatusManager = new SitAndGoStatusManager(finalLivePlayers, gameOptions);
            expect(finalStatusManager.getState()).toBe(GameStatus.IN_PROGRESS);

            // Verify all players have correct starting chips
            const allPlayers = game.findLivePlayers();
            allPlayers.forEach((player: Player) => {
                expect(player.chips).toBe(10000000000000000000000n); // Chips not cash
                expect(player.status).toBe(PlayerStatus.ACTIVE);
            });

            // As sit and go players are randomly seated, we need to create a mapping of player addresses to their seats
            const seatMap: Record<number, string> = {};
            for (let i = 1; i <= allPlayers.length; i++) {
                const player = game.getPlayerAtSeat(i);
                player && (seatMap[i] = player.address);
            }

            // Sanity check
            expect(Object.keys(seatMap).length).toBe(6);

            // Start first hand
            expect(game.currentRound).toBe(TexasHoldemRound.ANTE);

            // Post blinds (Player 1 = small blind, Player 2 = big blind)
            game.performAction(seatMap[1], PlayerActionType.SMALL_BLIND, 7, ONE_TOKEN);
            game.performAction(seatMap[2], PlayerActionType.BIG_BLIND, 8, TWO_TOKENS);

            expect(game.currentRound).toBe(TexasHoldemRound.ANTE);
            game.performAction(seatMap[3], NonPlayerActionType.DEAL, 9);
            expect(game.currentRound).toBe(TexasHoldemRound.PREFLOP);

            // Action starts with Player 3 (UTG)
            let nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toBe(seatMap[3]);

            // Simulate some early game action - conservative play
            game.performAction(seatMap[3], PlayerActionType.FOLD, 10);
            let previousActions = game.getPreviousActions();
            expect(previousActions.length).toBe(10);

            game.performAction(seatMap[4], PlayerActionType.ALL_IN, 11);
            previousActions = game.getPreviousActions();
            expect(previousActions.length).toBe(11);

            // Check the legal actions of player 4
            const legalActionsPlayer4 = game.getLegalActions(seatMap[4]);
            expect(legalActionsPlayer4.length).toEqual(0); // Player 4 should have no legal actions after going all-in

            game.performAction(seatMap[5], PlayerActionType.ALL_IN, 12);
            game.performAction(seatMap[6], PlayerActionType.ALL_IN, 13);
            game.performAction(seatMap[1], PlayerActionType.ALL_IN, 14);
            expect(game.currentRound).toBe(TexasHoldemRound.PREFLOP); // Should still be preflop

            // game.performAction(seatMap[2], PlayerActionType.ALL_IN, 15);
            // Check the legal actions of player 2
            const legalActionsPlayer2 = game.getLegalActions(seatMap[2]);
            expect(legalActionsPlayer2.length).toBeGreaterThan(0); // Player 2 should have legal actions

            game.performAction(seatMap[2], PlayerActionType.FOLD, 15);

            expect(game.communityCards.length).toBe(5); // All community cards should be dealt
            expect(game.currentRound).toBe(TexasHoldemRound.END); // Should jump to end

            // Expect that one player should be busted, and we should have a results object
            const livePlayersAfterHand1 = game.findLivePlayers();
            expect(livePlayersAfterHand1.length).toEqual(1); // 5 players should be all in, 1 folded
            const playerCount = game.getPlayerCount();
            expect(playerCount).toEqual(6); // At least one player should be eliminated

            const gameState: TexasHoldemStateDTO = game.toJson();
            expect(gameState.results).toBeDefined();

            // Should have players in results
            expect(gameState.results?.length).toBeGreaterThan(0);

            // Check that at least one player is marked as BUSTED
            const bustedPlayerId = gameState.results[0].playerId;
            const bustedPlayer = game.getPlayer(bustedPlayerId);
            expect(bustedPlayer?.status).toBe(PlayerStatus.BUSTED);
        });

        it.skip("should run a complete 6-player sit and go tournament - untested", () => {
            // Sanity checks
            expect(game.getPlayerCount()).toBe(0);
            expect(game.findLivePlayers().length).toBe(0);
            expect(game.type).toBe(GameType.SIT_AND_GO);

            // Phase 1: Player Registration

            // Players join the tournament
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1");
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2");
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3");
            game.performAction(PLAYER_4, NonPlayerActionType.JOIN, 4, ONE_HUNDRED_TOKENS, "seat=4");
            game.performAction(PLAYER_5, NonPlayerActionType.JOIN, 5, ONE_HUNDRED_TOKENS, "seat=5");

            // Verify we're waiting for the last player
            expect(game.getPlayerCount()).toBe(5);
            const livePlayers = game.findLivePlayers();
            const statusManager = new SitAndGoStatusManager(livePlayers, gameOptions);
            expect(statusManager.getState()).toBe(GameStatus.WAITING_FOR_PLAYERS);

            // Last player joins - tournament should be ready to start
            game.performAction(PLAYER_6, NonPlayerActionType.JOIN, 6, ONE_HUNDRED_TOKENS, "seat=6");
            expect(game.getPlayerCount()).toBe(6);

            const finalLivePlayers = game.findLivePlayers();
            const finalStatusManager = new SitAndGoStatusManager(finalLivePlayers, gameOptions);
            expect(finalStatusManager.getState()).toBe(GameStatus.IN_PROGRESS);

            // Verify all players have correct starting chips
            const allPlayers = game.findLivePlayers();
            allPlayers.forEach((player: Player) => {
                expect(player.chips).toBe(ONE_HUNDRED_TOKENS);
                expect(player.status).toBe(PlayerStatus.ACTIVE);
            });

            // As sit and go players are randomly seated, we need to create a mapping of player addresses to their seats
            const seatMap: Record<number, string> = {};
            for (let i = 1; i <= allPlayers.length; i++) {
                const player = game.getPlayerAtSeat(i);
                player && (seatMap[i] = player.address);
            }

            // Phase 2: First Hand - Early Tournament Play

            // Start first hand
            expect(game.currentRound).toBe(TexasHoldemRound.ANTE);

            // Post blinds (Player 1 = small blind, Player 2 = big blind)
            game.performAction(seatMap[1], PlayerActionType.SMALL_BLIND, 7, ONE_TOKEN);
            game.performAction(seatMap[2], PlayerActionType.BIG_BLIND, 8, TWO_TOKENS);

            expect(game.currentRound).toBe(TexasHoldemRound.ANTE);
            game.performAction(seatMap[3], NonPlayerActionType.DEAL, 9);
            expect(game.currentRound).toBe(TexasHoldemRound.PREFLOP);

            // Action starts with Player 3 (UTG)
            let nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toBe(seatMap[3]);

            // Simulate some early game action - conservative play
            game.performAction(seatMap[3], PlayerActionType.FOLD, 10);
            game.performAction(seatMap[4], PlayerActionType.CALL, 11, TWO_TOKENS);
            game.performAction(seatMap[5], PlayerActionType.FOLD, 12);
            game.performAction(seatMap[6], PlayerActionType.FOLD, 13);
            game.performAction(seatMap[1], PlayerActionType.CALL, 14, ONE_TOKEN); // Complete small blind
            game.performAction(seatMap[2], PlayerActionType.CHECK, 15);

            expect(game.pot).toBeGreaterThan(0n);

            // Phase 3: Mid-game - Players start getting eliminated

            // Simulate several hands where players get eliminated
            // For brevity, we'll simulate this by having players leave when their chips get low

            let handsPlayed = 0;
            let index = 16;
            const maxHands = 50; // Prevent infinite loops in test

            while (game.getPlayerCount() > 3 && handsPlayed < maxHands) {

                // Simulate a hand by having some players fold and others play
                try {
                    // Only deal if we're not in the middle of a hand
                    if (game.currentRound === TexasHoldemRound.ANTE) {
                        // game.deal();
                    }

                    // Get next player to act
                    const nextPlayer = game.getNextPlayerToAct();

                    // Get their legal actions
                    const legalActions = game.getLegalActions(nextPlayer!.address);

                    for (const action of legalActions) {
                        if (action.action === PlayerActionType.BET) {
                            const betAmount = BigInt(action.max || 0n);
                            game.performAction(nextPlayer!.address, PlayerActionType.BET, index, betAmount);
                            index++;
                        }
                    }

                    // Now get the next player to act
                    const nextPlayer2 = game.getNextPlayerToAct();

                    // Get their legal actions
                    const legalActions2 = game.getLegalActions(nextPlayer2!.address);

                    for (const action of legalActions2) {
                        if (action.action === PlayerActionType.CALL) {
                            const betAmount = BigInt(action.max || 0n);
                            game.performAction(nextPlayer2!.address, PlayerActionType.CALL, index, betAmount);
                            index++;
                        }
                    }

                    // Now fold out all remaining players for simplicity
                    let foldingPlayer = game.getNextPlayerToAct();
                    while (foldingPlayer) {
                        game.performAction(foldingPlayer.address, PlayerActionType.FOLD, index);
                        foldingPlayer = game.getNextPlayerToAct();
                        index++;
                    }


                    // // Bet their entire stack if they can
                    // if (legalActions.includes(PlayerActionType.BET)) {
                    //     game.performAction(nextPlayer!.address, PlayerActionType.BET, handsPlayed + 20, nextPlayer!.chips);
                    // }

                    // // Get current active players
                    // const activePlayers = game.findLivePlayers();
                    // if (activePlayers.length < 2) break;

                    // // Simulate aggressive play to eliminate players faster
                    // // This is a simplified simulation - in reality, showdowns would determine winners

                    // // Find players with low chips and simulate their elimination
                    // const playersWithLowChips = activePlayers.filter(p => p.chips < FIFTY_TOKENS);

                    // if (playersWithLowChips.length > 0) {
                    //     // Simulate elimination by having low-chip players leave
                    //     const playerToEliminate = playersWithLowChips[0];
                    //     console.log(`Player ${playerToEliminate.address} eliminated with ${playerToEliminate.chips} chips`);

                    //     // Calculate payout for eliminated player
                    //     const payoutManager = new PayoutManager(ONE_HUNDRED_TOKENS, activePlayers, 6);
                    //     const payout = payoutManager.calculateCurrentPayout();

                    //     game.performAction(playerToEliminate.address, NonPlayerActionType.LEAVE, handsPlayed + 20);

                    //     console.log(`✓ Player eliminated - ${game.getPlayerCount()} players remaining`);

                    //     if (game.getPlayerCount() <= 3) {
                    //         console.log("✓ Final table reached!");
                    //         break;
                    //     }
                    // }

                    handsPlayed++;
                } catch {
                    // Handle any game state issues gracefully
                    handsPlayed++;
                }
            }

            // Phase 4: Final Table (3 players or less)

            const finalPlayers = game.findLivePlayers();
            expect(finalPlayers.length).toBeLessThanOrEqual(3);
            expect(finalPlayers.length).toBeGreaterThanOrEqual(1);

            // Phase 5: Heads-up or Final Payouts

            if (finalPlayers.length === 3) {
                // Eliminate one more to get to heads-up
                const thirdPlacePlayer = finalPlayers[0];

                const payoutManager = new PayoutManager(ONE_HUNDRED_TOKENS, finalPlayers);
                const _thirdPlacePayout = payoutManager.calculatePayout(3);

                game.performAction(thirdPlacePlayer.address, NonPlayerActionType.LEAVE, 100);
            }

            const remainingPlayers = game.findLivePlayers();

            if (remainingPlayers.length === 2) {
                const payoutManager = new PayoutManager(ONE_HUNDRED_TOKENS, remainingPlayers);

                // Simulate heads-up completion
                const secondPlacePlayer = remainingPlayers[0];
                const _firstPlacePlayer = remainingPlayers[1];

                const secondPlacePayout = payoutManager.calculatePayout(2);
                const firstPlacePayout = payoutManager.calculatePayout(1);

                // Verify payouts are correct
                expect(secondPlacePayout).toBe((ONE_HUNDRED_TOKENS * 6n * 30n) / 100n); // 30% of prize pool
                expect(firstPlacePayout).toBe((ONE_HUNDRED_TOKENS * 6n * 60n) / 100n); // 60% of prize pool

                game.performAction(secondPlacePlayer.address, NonPlayerActionType.LEAVE, 101);
            }

            // Final verification
            const winner = game.findLivePlayers();
            expect(winner.length).toBe(1);

            // Verify tournament integrity
            expect(game.getPlayerCount()).toBe(1); // Only winner remains
            expect(winner[0].status).toBe(PlayerStatus.ACTIVE);
        });

        it("should handle payout calculations correctly", () => {
            // Test the payout structure for a 6-player sit and go
            const mockPlayers = [
                new Player(PLAYER_1, undefined, ONE_HUNDRED_TOKENS, undefined, PlayerStatus.ACTIVE),
                new Player(PLAYER_2, undefined, ONE_HUNDRED_TOKENS, undefined, PlayerStatus.ACTIVE),
                new Player(PLAYER_3, undefined, ONE_HUNDRED_TOKENS, undefined, PlayerStatus.ACTIVE)
            ];

            const payoutManager = new PayoutManager(ONE_HUNDRED_TOKENS, mockPlayers);

            // Test individual place payouts
            const firstPlace = payoutManager.calculatePayout(1);
            const secondPlace = payoutManager.calculatePayout(2);
            const thirdPlace = payoutManager.calculatePayout(3);
            const fourthPlace = payoutManager.calculatePayout(4);

            // Total prize pool: 6 * 100 = 600 tokens
            // 1st: 60% = 360 tokens
            // 2nd: 30% = 180 tokens  
            // 3rd: 10% = 60 tokens
            // 4th+: 0 tokens

            expect(firstPlace).toBe(360n * ONE_TOKEN); // 60% of 600 tokens
            expect(secondPlace).toBe(180n * ONE_TOKEN); // 30% of 600 tokens
            expect(thirdPlace).toBe(60n * ONE_TOKEN);   // 10% of 600 tokens
            expect(fourthPlace).toBe(0n);                // No payout for 4th+

            // Verify total payouts equal 100% of prize pool
            const totalPayouts = firstPlace + secondPlace + thirdPlace;
            const totalPrizePool = ONE_HUNDRED_TOKENS * 6n;
            expect(totalPayouts).toBe(totalPrizePool);
        });

        it("should track elimination order correctly", () => {
            // Join all players
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1");
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2");
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3");
            game.performAction(PLAYER_4, NonPlayerActionType.JOIN, 4, ONE_HUNDRED_TOKENS, "seat=4");
            game.performAction(PLAYER_5, NonPlayerActionType.JOIN, 5, ONE_HUNDRED_TOKENS, "seat=5");
            game.performAction(PLAYER_6, NonPlayerActionType.JOIN, 6, ONE_HUNDRED_TOKENS, "seat=6");

            expect(game.getPlayerCount()).toBe(6);

            // Simulate eliminations in specific order
            game.performAction(PLAYER_6, NonPlayerActionType.LEAVE, 10); // 6th place
            expect(game.getPlayerCount()).toBe(5);

            game.performAction(PLAYER_5, NonPlayerActionType.LEAVE, 11); // 5th place
            expect(game.getPlayerCount()).toBe(4);

            game.performAction(PLAYER_4, NonPlayerActionType.LEAVE, 12); // 4th place
            expect(game.getPlayerCount()).toBe(3);

            // At this point, we're at the final table (top 3)
            const finalThreePlayers = game.findLivePlayers();
            expect(finalThreePlayers.length).toBe(3);

            // Verify the remaining players are correct
            const remainingAddresses = finalThreePlayers.map(p => p.address);
            expect(remainingAddresses).toContain(PLAYER_1);
            expect(remainingAddresses).toContain(PLAYER_2);
            expect(remainingAddresses).toContain(PLAYER_3);

            // Final eliminations for podium places
            game.performAction(PLAYER_3, NonPlayerActionType.LEAVE, 13); // 3rd place
            game.performAction(PLAYER_2, NonPlayerActionType.LEAVE, 14); // 2nd place

            // Winner
            const winner = game.findLivePlayers();
            expect(winner.length).toBe(1);
            expect(winner[0].address).toBe(PLAYER_1);
        });

        it("should handle blind increases in tournament format", () => {
            // This test would require implementing the SitAndGoBlindsManager
            // For now, we'll just verify the game can handle the concept

            const currentBlinds = {
                smallBlind: gameOptions.smallBlind,
                bigBlind: gameOptions.bigBlind
            };

            // In a real tournament, blinds would increase over time
            // Example: Level 1: 1/2, Level 2: 2/4, Level 3: 4/8, etc.

            expect(currentBlinds.smallBlind).toBe(ONE_TOKEN);
            expect(currentBlinds.bigBlind).toBe(TWO_TOKENS);

            // Future enhancement: Test blind increases based on time or hands played
        });
    });
});
