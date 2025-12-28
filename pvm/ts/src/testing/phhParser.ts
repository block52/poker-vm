/**
 * PHH (Poker Hand History) Parser
 * Parses PHH format files into structured objects for testing
 */

import { PhhHand, PhhAction, PhhActionType, PhhParseResult, PHH_SUIT_MAP, PHH_RANK_MAP } from "./phhTypes";

export class PhhParser {
    /**
     * Parse a PHH file content string into structured data
     */
    parse(content: string): PhhParseResult {
        const hand = this.parseHand(content);
        const actions = this.parseActions(hand.actions, hand.blindsOrStraddles);
        return { hand, actions };
    }

    /**
     * Parse the hand metadata from PHH content
     */
    private parseHand(content: string): PhhHand {
        const lines = content.split("\n");

        const hand: PhhHand = {
            variant: "",
            anteTrimming: true,
            antes: [],
            blindsOrStraddles: [],
            minBet: 0,
            startingStacks: [],
            players: [],
            actions: []
        };

        let inActions = false;
        let actionsBuffer: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();

            // Skip comments and empty lines
            if (trimmed.startsWith("#") || trimmed === "") continue;

            // Handle actions array (both single-line and multi-line)
            if (trimmed.startsWith("actions = [")) {
                // Check if entire array is on one line
                if (trimmed.endsWith("]")) {
                    // Single-line array: actions = ['a', 'b', 'c']
                    const arrayContent = trimmed.substring("actions = [".length, trimmed.length - 1);
                    const matches = arrayContent.matchAll(/["']([^"']+)["']/g);
                    for (const match of matches) {
                        actionsBuffer.push(match[1]);
                    }
                    hand.actions = actionsBuffer;
                } else {
                    // Multi-line array
                    inActions = true;
                }
                continue;
            }

            if (inActions) {
                if (trimmed === "]") {
                    inActions = false;
                    hand.actions = actionsBuffer;
                    continue;
                }
                // Extract action string from quotes (support both single and double quotes)
                const match = trimmed.match(/["']([^"']+)["']/);
                if (match) {
                    actionsBuffer.push(match[1]);
                }
                continue;
            }

            // Parse key-value pairs
            const kvMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
            if (kvMatch) {
                const [, key, value] = kvMatch;
                this.setHandValue(hand, key, value);
            }
        }

        return hand;
    }

    /**
     * Set a value on the hand object based on key
     */
    private setHandValue(hand: PhhHand, key: string, value: string): void {
        switch (key) {
            case "variant":
                hand.variant = value.replace(/["']/g, "");
                break;
            case "ante_trimming_status":
                hand.anteTrimming = value === "true";
                break;
            case "antes":
                hand.antes = this.parseNumberArray(value);
                break;
            case "blinds_or_straddles":
                hand.blindsOrStraddles = this.parseNumberArray(value);
                break;
            case "min_bet":
                hand.minBet = parseFloat(value);
                break;
            case "starting_stacks":
                hand.startingStacks = this.parseNumberArray(value);
                break;
            case "players":
                hand.players = this.parseStringArray(value);
                break;
            case "author":
                hand.author = value.replace(/["']/g, "");
                break;
            case "event":
                hand.event = value.replace(/["']/g, "");
                break;
            case "year":
                hand.year = parseInt(value);
                break;
            case "month":
                hand.month = parseInt(value);
                break;
            case "currency":
                hand.currency = value.replace(/["']/g, "");
                break;
        }
    }

    /**
     * Parse a number array like [500, 1000, 0]
     */
    private parseNumberArray(value: string): number[] {
        const match = value.match(/\[([\d.,\s]+)\]/);
        if (!match) return [];
        return match[1].split(",").map(s => parseFloat(s.trim()));
    }

    /**
     * Parse a string array like ["Player 1", "Player 2"]
     */
    private parseStringArray(value: string): string[] {
        const match = value.match(/\[([^\]]+)\]/);
        if (!match) return [];
        return match[1].split(",").map(s => s.trim().replace(/["']/g, ""));
    }

    /**
     * Parse action strings into structured PhhAction objects
     */
    parseActions(actionStrings: string[], blinds: number[] = []): PhhAction[] {
        const actions: PhhAction[] = [];
        // Initialize current bet to big blind (blinds[1]) for preflop
        const bigBlind = blinds.length > 1 ? blinds[1] : 0;
        let currentBet = bigBlind;

        // Track each player's bet amount for the current round
        const playerBets = new Map<number, number>();
        // Initialize with blinds - player 1 has small blind, player 2 has big blind
        if (blinds.length > 0) {
            playerBets.set(1, blinds[0] || 0);
        }
        if (blinds.length > 1) {
            playerBets.set(2, blinds[1] || 0);
        }

        for (const raw of actionStrings) {
            const action = this.parseAction(raw, currentBet, playerBets);
            if (action) {
                actions.push(action);

                // Update current bet and player bet tracking
                if (action.type === "bet" || action.type === "raise") {
                    currentBet = action.amount || 0;
                    if (action.player) {
                        playerBets.set(action.player, currentBet);
                    }
                } else if (action.type === "call") {
                    if (action.player) {
                        playerBets.set(action.player, currentBet);
                    }
                } else if (action.type === "deal_board") {
                    // Reset on new street
                    currentBet = 0;
                    playerBets.clear();
                }
            }
        }

        return actions;
    }

    /**
     * Parse a single action string
     */
    private parseAction(raw: string, currentBet: number, playerBets: Map<number, number> = new Map()): PhhAction | null {
        const parts = raw.trim().split(/\s+/);

        if (parts.length < 2) return null;

        // Deal actions
        if (parts[0] === "d") {
            if (parts[1] === "dh") {
                // Deal hole cards: d dh p1 Ah3sKsKh
                const playerMatch = parts[2]?.match(/p(\d+)/);
                const player = playerMatch ? parseInt(playerMatch[1]) : undefined;
                const cards = parts[3] ? this.parseCards(parts[3]) : undefined;
                return { type: "deal_hole", player, cards, raw };
            } else if (parts[1] === "db") {
                // Deal board: d db 4s5c2h
                const cards = parts[2] ? this.parseCards(parts[2]) : undefined;
                return { type: "deal_board", cards, raw };
            }
        }

        // Player actions: pX action [amount]
        const playerMatch = parts[0].match(/p(\d+)/);
        if (playerMatch) {
            const player = parseInt(playerMatch[1]);
            const actionCode = parts[1];

            switch (actionCode) {
                case "f":
                    return { type: "fold", player, raw };

                case "cc":
                    // Check if this player needs to call or can check
                    // Player can check if they've already matched the current bet
                    const playerBet = playerBets.get(player) || 0;
                    const type: PhhActionType = (currentBet > 0 && playerBet < currentBet) ? "call" : "check";
                    return { type, player, raw };

                case "cbr":
                    // Check/Bet/Raise - determine based on current bet
                    const amount = parts[2] ? parseFloat(parts[2]) : undefined;
                    const betType: PhhActionType = currentBet > 0 ? "raise" : "bet";
                    return { type: betType, player, amount, raw };

                case "sm":
                    // Show/Muck
                    const showCards = parts[2] ? this.parseCards(parts[2]) : undefined;
                    return { type: "show", player, cards: showCards, raw };
            }
        }

        return null;
    }

    /**
     * Parse PHH card notation to array of card strings
     * PHH: "Ah3sKsKh" -> ["AH", "3S", "KS", "KH"]
     */
    parseCards(cardStr: string): string[] {
        if (cardStr === "????" || cardStr.startsWith("?")) {
            return []; // Hidden cards
        }

        const cards: string[] = [];
        // Cards are 2 characters each: rank + suit
        for (let i = 0; i < cardStr.length; i += 2) {
            const rank = cardStr[i];
            const suit = cardStr[i + 1];

            if (PHH_RANK_MAP[rank] && PHH_SUIT_MAP[suit]) {
                cards.push(PHH_RANK_MAP[rank] + PHH_SUIT_MAP[suit]);
            }
        }

        return cards;
    }

    /**
     * Convert PHH cards to our engine format
     * Our format uses: "AS" for Ace of Spades
     */
    convertCard(phhCard: string): string {
        if (phhCard.length !== 2) return phhCard;
        const rank = phhCard[0];
        const suit = phhCard[1];
        return (PHH_RANK_MAP[rank] || rank) + (PHH_SUIT_MAP[suit] || suit);
    }
}

export default PhhParser;
