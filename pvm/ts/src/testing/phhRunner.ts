/**
 * PHH Runner - Replays PHH hands through the Texas Holdem engine
 */

import { GameOptions, GameType, PlayerActionType, TexasHoldemRound, PlayerStatus } from "@block52/poker-vm-sdk";
import { ethers } from "ethers";
import TexasHoldemGame from "../engine/texasHoldem";
import { Player } from "../models/player";
import { PhhParser } from "./phhParser";
import { PhhHand, PhhAction } from "./phhTypes";

export interface PhhRunResult {
    success: boolean;
    hand: PhhHand;
    actionsExecuted: number;
    totalActions: number;
    finalPot: bigint;
    error?: string;
    errorAtAction?: number;
    gameState?: {
        round: TexasHoldemRound;
        pot: bigint;
        communityCards: string[];
        players: Array<{
            address: string;
            stack: bigint;
            status: PlayerStatus;
        }>;
    };
}

export class PhhRunner {
    private parser: PhhParser;
    private timestampCounter: number = 1700000000000;

    constructor() {
        this.parser = new PhhParser();
    }

    /**
     * Run a PHH hand through the engine
     */
    async runHand(phhContent: string): Promise<PhhRunResult> {
        const { hand, actions } = this.parser.parse(phhContent);

        // Validate it's a No-Limit Hold'em hand
        if (hand.variant !== "NT") {
            return {
                success: false,
                hand,
                actionsExecuted: 0,
                totalActions: actions.length,
                finalPot: 0n,
                error: `Unsupported variant: ${hand.variant}. Only NT (No-Limit Texas Hold'em) is supported.`
            };
        }

        try {
            // Create game from PHH hand
            const game = this.createGame(hand);

            // Execute actions
            let actionsExecuted = 0;
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                try {
                    this.executeAction(game, hand, action, i);
                    actionsExecuted++;
                } catch (err) {
                    return {
                        success: false,
                        hand,
                        actionsExecuted,
                        totalActions: actions.length,
                        finalPot: game.pot,
                        error: `Action ${i} failed: ${err instanceof Error ? err.message : String(err)}`,
                        errorAtAction: i,
                        gameState: this.getGameState(game)
                    };
                }
            }

            return {
                success: true,
                hand,
                actionsExecuted,
                totalActions: actions.length,
                finalPot: game.pot,
                gameState: this.getGameState(game)
            };
        } catch (err) {
            return {
                success: false,
                hand,
                actionsExecuted: 0,
                totalActions: actions.length,
                finalPot: 0n,
                error: `Game setup failed: ${err instanceof Error ? err.message : String(err)}`
            };
        }
    }

    /**
     * Create a TexasHoldemGame from PHH hand metadata
     */
    private createGame(hand: PhhHand): TexasHoldemGame {
        // Convert stacks to bigint (PHH uses cents/chips, we use wei-like values)
        // For simplicity, treat PHH values as direct chip amounts
        const CHIP_MULTIPLIER = 1n; // 1:1 mapping for now

        const smallBlind = BigInt(hand.blindsOrStraddles[0] || 0) * CHIP_MULTIPLIER;
        const bigBlind = BigInt(hand.blindsOrStraddles[1] || 0) * CHIP_MULTIPLIER;

        const gameOptions: GameOptions = {
            minBuyIn: 0n,
            maxBuyIn: BigInt(Math.max(...hand.startingStacks)) * CHIP_MULTIPLIER * 2n,
            minPlayers: 2,
            maxPlayers: hand.players.length,
            smallBlind,
            bigBlind,
            timeout: 60000,
            type: GameType.CASH
        };

        // Create player map
        const playerStates = new Map<number, Player | null>();

        for (let i = 0; i < hand.players.length; i++) {
            // Generate deterministic addresses for players
            const address = this.playerAddress(i + 1);
            const stack = BigInt(hand.startingStacks[i] || 0) * CHIP_MULTIPLIER;

            const player = new Player(
                address,
                stack,
                i + 1, // seat (1-indexed)
                PlayerStatus.ACTIVE
            );

            playerStates.set(i + 1, player);
        }

        // Create the game
        // Dealer is typically last player in PHH format
        const dealerSeat = hand.players.length;

        const game = new TexasHoldemGame(
            ethers.ZeroAddress,
            gameOptions,
            dealerSeat,
            [], // previousActions
            1, // handNumber
            0, // actionCount
            TexasHoldemRound.ANTE,
            [], // communityCards
            [0n], // pots
            playerStates,
            "" // deck seed - will be overridden
        );

        return game;
    }

    /**
     * Execute a single PHH action on the game
     */
    private executeAction(game: TexasHoldemGame, hand: PhhHand, action: PhhAction, _actionIndex: number): void {
        const timestamp = this.getNextTimestamp();

        switch (action.type) {
            case "deal_hole":
                // Deal is handled by posting blinds in our engine
                // Skip for now - the game auto-deals after blinds
                break;

            case "deal_board":
                // Board dealing happens automatically on round advancement
                // Skip - engine handles this
                break;

            case "fold":
                this.performPlayerAction(game, hand, action.player!, PlayerActionType.FOLD, undefined, timestamp);
                break;

            case "check":
                this.performPlayerAction(game, hand, action.player!, PlayerActionType.CHECK, undefined, timestamp);
                break;

            case "call":
                this.performPlayerAction(game, hand, action.player!, PlayerActionType.CALL, undefined, timestamp);
                break;

            case "bet":
                this.performPlayerAction(game, hand, action.player!, PlayerActionType.BET, BigInt(action.amount || 0), timestamp);
                break;

            case "raise":
                this.performPlayerAction(game, hand, action.player!, PlayerActionType.RAISE, BigInt(action.amount || 0), timestamp);
                break;

            case "show":
                this.performPlayerAction(game, hand, action.player!, PlayerActionType.SHOW, undefined, timestamp);
                break;
        }
    }

    /**
     * Perform a player action on the game
     */
    private performPlayerAction(
        game: TexasHoldemGame,
        hand: PhhHand,
        playerNumber: number,
        actionType: PlayerActionType,
        amount: bigint | undefined,
        timestamp: number
    ): void {
        const address = this.playerAddress(playerNumber);
        const actionIndex = game.getActionIndex();

        game.performAction(address, actionType, actionIndex, amount, undefined, timestamp);
    }

    /**
     * Get deterministic player address from player number
     */
    private playerAddress(playerNumber: number): string {
        // Generate deterministic addresses: 0x0001..., 0x0002..., etc.
        return ethers.zeroPadValue(ethers.toBeHex(playerNumber), 20);
    }

    /**
     * Get next timestamp for action
     */
    private getNextTimestamp(): number {
        return this.timestampCounter++;
    }

    /**
     * Extract game state for reporting
     */
    private getGameState(game: TexasHoldemGame): PhhRunResult["gameState"] {
        const players: PhhRunResult["gameState"]!["players"] = [];

        for (let seat = 1; seat <= 9; seat++) {
            const player = game.getPlayerBySeat(seat);
            if (player) {
                players.push({
                    address: player.address,
                    stack: player.chips,
                    status: player.status
                });
            }
        }

        return {
            round: game.currentRound,
            pot: game.pot,
            communityCards: game.communityCards,
            players
        };
    }
}

export default PhhRunner;
