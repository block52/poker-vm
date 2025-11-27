export enum FunctionName {
    Deposit = "deposit",
    Approve = "approve",
    Allowance = "allowance",
    Decimals = "decimals",
    Balance = "balanceOf",
    Withdraw = "withdraw"
}

export interface GameType {
    type: string;
    variant: GameVariant;
}

// Create an enum of game types
enum GameVariant {
    CASH = "cash",
    TOURNAMENT = "tournament"
}

/**
 * Result returned from player action hooks (bet, call, raise, fold, etc.)
 * All amounts are stored as strings for JSON serialization compatibility.
 */
export interface PlayerActionResult {
    /** Transaction hash from the blockchain */
    hash: string;
    /** The game/table ID where the action was performed */
    gameId: string;
    /** The action that was performed (e.g., "bet", "call", "raise", "fold") */
    action: string;
    /** The amount involved in the action (in micro-units as string), if applicable */
    amount?: string;
}
