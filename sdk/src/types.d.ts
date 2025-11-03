// --- Types for explicit return values (from IClient.ts) ---
export interface AccountResponse {
  address: string;
  pub_key?: any;
  account_number: string;
  sequence: string;
  [key: string]: any;
}

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
  TOKEN_DENOM: "b52usdc",
  USDC_DECIMALS: 6, // 1 USDC = 1,000,000 b52usdc
  GAME_CREATION_COST: 1, // 1 b52usdc = 0.000001 USDC
  DEFAULT_GAS_PRICE: "0.025b52usdc"
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
  denom: string; // This will be "b52USDC"
  gasPrice: string;
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