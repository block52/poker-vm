/**
 * PHH (Poker Hand History) Format Types
 * Based on https://phh.readthedocs.io/en/stable/
 */

export type PhhVariant =
    | "NT" // No-Limit Texas Hold'em
    | "FT" // Fixed-Limit Texas Hold'em
    | "PO" // Pot-Limit Omaha
    | "FB" // Fixed-Limit Badugi
    | string;

export interface PhhHand {
    variant: PhhVariant;
    anteTrimming: boolean;
    antes: number[];
    blindsOrStraddles: number[];
    minBet: number;
    startingStacks: number[];
    players: string[];
    actions: string[];
    // Optional metadata
    author?: string;
    event?: string;
    year?: number;
    month?: number;
    currency?: string;
}

export type PhhActionType =
    | "deal_hole" // d dh pX CARDS
    | "deal_board" // d db CARDS
    | "fold" // pX f
    | "check" // pX cc (when no bet to call)
    | "call" // pX cc (when there's a bet)
    | "bet" // pX cbr N (first bet in round)
    | "raise" // pX cbr N (raise over existing bet)
    | "show" // pX sm CARDS
    | "muck"; // pX sm (no cards = muck)

export interface PhhAction {
    type: PhhActionType;
    player?: number; // 1-indexed player number
    amount?: number; // Bet/raise amount
    cards?: string[]; // Cards dealt or shown
    raw: string; // Original action string
}

export interface PhhParseResult {
    hand: PhhHand;
    actions: PhhAction[];
}

// Card conversion utilities
export const PHH_SUIT_MAP: Record<string, string> = {
    s: "S", // spades
    h: "H", // hearts
    d: "D", // diamonds
    c: "C" // clubs
};

export const PHH_RANK_MAP: Record<string, string> = {
    A: "A",
    K: "K",
    Q: "Q",
    J: "J",
    T: "T",
    "9": "9",
    "8": "8",
    "7": "7",
    "6": "6",
    "5": "5",
    "4": "4",
    "3": "3",
    "2": "2"
};
