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
