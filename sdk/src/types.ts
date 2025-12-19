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

// BlockResponse is defined in ./types/game.ts with proper typing

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