// Consolidated SDK-level types and runtime constants moved from `types.ts` to
// avoid conflicting with generated `types/` folder. Import runtime values from
// this file (e.g. COSMOS_CONSTANTS) and import generated protobuf types from
// the `types/` directory.

// --- Types for explicit return values (from IClient.ts) ---
export type CustomAccountResponse = {
    address: string;
    pub_key?: any;
    account_number: string;
    sequence: string;
    [key: string]: any;
};

export interface TxResponse {
    height: string;
    txhash: string;
    codespace?: string;
    code?: number;
    data?: string;
    raw_log: string;
    logs?: any[];
    info?: string;
    gas_wanted: string;
    gas_used: string;
    tx?: any;
    timestamp: string;
    events?: any[];
    [key: string]: any;
}

export interface BlockResponse {
    block_id: any;
    block: any;
    [key: string]: any;
}

// Poker/game types
export interface GameState {
    // Structure of parsed game state JSON
    [key: string]: any;
}

export interface Game {
    // Structure of parsed game JSON
    [key: string]: any;
}

export interface LegalAction {
    // Structure of parsed legal action JSON
    [key: string]: any;
}

import { Keplr, Window as KeplrWindow } from "@keplr-wallet/types";

declare global {
    interface KeplrIntereactionOptions {
        readonly sign?: KeplrSignOptions;
    }

    export interface KeplrSignOptions {
        readonly preferNoSetFee?: boolean;
        readonly preferNoSetMemo?: boolean;
        readonly disableBalanceCheck?: boolean;
    }
    interface CustomKeplr extends Keplr {
        enable(chainId: string | string[]): Promise<void>;

        defaultOptions: KeplrIntereactionOptions;
    }
    interface Window extends KeplrWindow {
        keplr: CustomKeplr;
    }
}


// Cosmos blockchain constants (matches pokerchain/x/poker/types/types.go)
export const COSMOS_CONSTANTS = {
    CHAIN_ID: "pokerchain",
    ADDRESS_PREFIX: "b52",
    GAS_DENOM: "stake", // Gas token (price = 0, free transactions)
    TOKEN_DENOM: "usdc", // Bridged USDC from Base Chain (playing token)
    USDC_DECIMALS: 6, // 1 USDC = 1,000,000 usdc
    GAME_CREATION_COST: 1, // 1 usdc = 0.000001 USDC
    DEFAULT_GAS_PRICE: "0stake" // Gas is free (price = 0)
} as const;

// Define the game creation parameters interface
export interface CreateGameParams {
    creator: string;
    minBuyIn: string;
    maxBuyIn: string;
    minPlayers: number;
    maxPlayers: number;
    smallBlind: string;
    bigBlind: string;
    timeout: number;
    gameType: string;
}

// Define standard Cosmos types
export interface Coin {
    denom: string;
    amount: string;
}

export interface CosmosConfig {
    rpcEndpoint: string;
    restEndpoint: string;
    chainId: string;
    prefix: string;
    denom: string; // Playing token denomination (e.g., "usdc" - bridged from Base Chain)
    gasPrice: string; // Gas price with denom (e.g., "0stake" for free gas, or "0.025stake")
    mnemonic?: string;
}

// Poker API types based on Swagger
export interface GameStateResponse {
    game_state: string; // JSON string containing the game state
}

export interface GameResponse {
    game: string; // JSON string containing the game info
}

export interface LegalActionsResponse {
    actions: string; // JSON string containing legal actions
}

export interface ListGamesResponse {
    games: string; // JSON string containing list of games
}

export interface PlayerGamesResponse {
    games: string; // JSON string containing player's games
}

// Equity calculation types
export interface EquityHand {
    cards: string[]; // e.g., ["AS", "KS"]
}

export interface EquityResult {
    hand_index: number;
    hand: string[];
    wins: number;
    ties: number;
    losses: number;
    equity: string;      // e.g., "0.7234" (win probability)
    tie_equity: string;  // e.g., "0.0023" (tie probability)
    total: string;       // e.g., "0.7257" (win + tie equity)
}

export interface EquityRequest {
    hands: EquityHand[];
    board?: string[];     // 0-5 community cards
    dead?: string[];      // optional dead/mucked cards
    simulations?: number; // number of Monte Carlo simulations (default 10000)
}

export interface EquityResponse {
    results: EquityResult[];
    simulations: number;
    stage: string;         // e.g., "Preflop", "Flop", "Turn", "River"
    duration_ms: string;
    hands_per_sec: string;
}
