/**
 * PHH Runner - Replays PHH hands through the Texas Holdem engine
 */

import { GameOptions, GameType, PlayerActionType, NonPlayerActionType, TexasHoldemRound, PlayerStatus } from "@block52/poker-vm-sdk";
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

            // Post blinds and deal before executing PHH actions
            this.postBlindsAndDeal(game, hand);

            // Execute actions
            let actionsExecuted = 0;
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                try {
                    this.executeAction(game, action);
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

        // Guard against empty startingStacks (Math.max(...[]) returns -Infinity)
        const maxStack = hand.startingStacks.length > 0
            ? Math.max(...hand.startingStacks)
            : 0;

        const gameOptions: GameOptions = {
            minBuyIn: 0n,
            maxBuyIn: BigInt(maxStack) * CHIP_MULTIPLIER * 2n,
            minPlayers: 2,
            maxPlayers: Math.max(hand.players.length, 2),
            smallBlind,
            bigBlind,
            timeout: 60000,
            type: GameType.CASH
        };

        // Create base game config for fromJson
        const baseGameConfig = {
            id: ethers.ZeroAddress,
            options: gameOptions,
            dealer: hand.players.length, // Dealer is typically last player
            previousActions: [],
            handNumber: 1,
            actionCount: 0,
            currentRound: TexasHoldemRound.ANTE,
            communityCards: [],
            pots: [0n],
            playerStates: new Map(),
            deckSeed: ""
        };

        // Create the game
        const game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);

        // Join players to the game
        for (let i = 0; i < hand.players.length; i++) {
            const playerNum = i + 1;
            const address = this.playerAddress(playerNum);
            const stack = BigInt(hand.startingStacks[i] || 0) * CHIP_MULTIPLIER;
            const seat = playerNum;

            game.performAction(
                address,
                NonPlayerActionType.JOIN,
                game.getActionIndex(),
                stack,
                `seat=${seat}`,
                this.getNextTimestamp()
            );
        }

        return game;
    }

    /**
     * Post blinds and deal cards to get game into PREFLOP state
     * PHH format assumes blinds are already posted
     */
    private postBlindsAndDeal(game: TexasHoldemGame, hand: PhhHand): void {
        // PHH format convention: player 1 posts SB, player 2 posts BB
        // This follows standard PHH/dealer position conventions
        const smallBlind = BigInt(hand.blindsOrStraddles[0] || 0);
        const bigBlind = BigInt(hand.blindsOrStraddles[1] || 0);

        // Post small blind (player 1)
        const sbPlayer = 1;
        game.performAction(
            this.playerAddress(sbPlayer),
            PlayerActionType.SMALL_BLIND,
            game.getActionIndex(),
            smallBlind,
            undefined,
            this.getNextTimestamp()
        );

        // Post big blind (player 2)
        const bbPlayer = 2;
        game.performAction(
            this.playerAddress(bbPlayer),
            PlayerActionType.BIG_BLIND,
            game.getActionIndex(),
            bigBlind,
            undefined,
            this.getNextTimestamp()
        );

        // Deal cards
        game.performAction(
            this.playerAddress(sbPlayer),
            NonPlayerActionType.DEAL,
            game.getActionIndex(),
            undefined,
            undefined,
            this.getNextTimestamp()
        );
    }

    /**
     * Execute a single PHH action on the game
     */
    private executeAction(game: TexasHoldemGame, action: PhhAction): void {
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
                if (action.player) {
                    this.performPlayerAction(game, action.player, PlayerActionType.FOLD, undefined, timestamp);
                }
                break;

            case "check":
                if (action.player) {
                    this.performPlayerAction(game, action.player, PlayerActionType.CHECK, undefined, timestamp);
                }
                break;

            case "call":
                if (action.player) {
                    // Get the call amount from legal actions
                    const callAmount = this.getCallAmount(game, action.player);
                    this.performPlayerAction(game, action.player, PlayerActionType.CALL, callAmount, timestamp);
                }
                break;

            case "bet":
                if (action.player) {
                    // BET amount in PHH is the total bet amount
                    this.performPlayerAction(game, action.player, PlayerActionType.BET, BigInt(action.amount || 0), timestamp);
                }
                break;

            case "raise":
                if (action.player) {
                    // PHH raise amount is TOTAL bet amount, engine expects ADDITIONAL amount
                    // Get the player's current bet this round and calculate difference
                    const raiseTotal = BigInt(action.amount || 0);
                    const raiseAdditional = this.getRaiseAdditionalAmount(game, action.player, raiseTotal);
                    this.performPlayerAction(game, action.player, PlayerActionType.RAISE, raiseAdditional, timestamp);
                }
                break;

            case "show":
                if (action.player) {
                    this.performPlayerAction(game, action.player, PlayerActionType.SHOW, undefined, timestamp);
                }
                break;
        }
    }

    /**
     * Perform a player action on the game
     */
    private performPlayerAction(
        game: TexasHoldemGame,
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
     * Get the call amount for a player from the game's legal actions
     */
    private getCallAmount(game: TexasHoldemGame, playerNumber: number): bigint {
        const address = this.playerAddress(playerNumber);
        const legalActions = game.getLegalActions(address);

        const callAction = legalActions.find(a => a.action === PlayerActionType.CALL);
        if (callAction && callAction.min) {
            return BigInt(callAction.min);
        }

        // Fallback: if no call action found, return 0 (will likely fail validation)
        return 0n;
    }

    /**
     * Calculate the additional amount needed to raise to a total amount
     * PHH uses total amounts, engine uses additional amounts
     */
    private getRaiseAdditionalAmount(game: TexasHoldemGame, playerNumber: number, totalAmount: bigint): bigint {
        const address = this.playerAddress(playerNumber);

        // Get player's current bet this round using the game's method
        // Include blinds for preflop calculations
        const includeBlinds = game.currentRound === TexasHoldemRound.PREFLOP;
        const playerBetThisRound = game.getPlayerTotalBets(address, game.currentRound, includeBlinds);

        // PHH totalAmount is the total the player wants to have in for this round
        // Engine expects additional chips to put in
        const additionalAmount = totalAmount - playerBetThisRound;

        // Ensure we don't return negative (shouldn't happen with valid PHH data)
        return additionalAmount > 0n ? additionalAmount : totalAmount;
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
        const players: Array<{ address: string; stack: bigint; status: PlayerStatus }> = [];

        for (let seat = 1; seat <= 9; seat++) {
            const player = game.getPlayerAtSeat(seat);
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
            communityCards: game.communityCards.map(card => card.toString()),
            players
        };
    }
}

export default PhhRunner;
