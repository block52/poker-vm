import { TexasHoldemRound, Card, GameType } from "./game";

/**
 * Cosmos Configuration
 */
export interface CosmosConfig {
    rpcEndpoint: string;
    restEndpoint: string;
    chainId: string;
    prefix: string;
    denom: string;
    gasPrice: string;
    mnemonic?: string;
}

/**
 * Cosmos blockchain constants (matches pokerchain/x/poker/types/types.go)
 */
export const COSMOS_CONSTANTS = {
    CHAIN_ID: "pokerchain",
    ADDRESS_PREFIX: "b52",
    TOKEN_DENOM: "b52usdc",
    USDC_DECIMALS: 6, // 1 USDC = 1,000,000 b52usdc
    GAME_CREATION_COST: 1, // 1 b52usdc = 0.000001 USDC
    DEFAULT_GAS_PRICE: "0.025b52usdc"
} as const;

/**
 * Game creation parameters interface
 */
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

/**
 * Game State and Player Types
 */
export interface GameState {
    gameId: string;
    players: Player[];
    currentPlayer: number;
    pot: bigint;
    communityCards: Card[];
    stage: TexasHoldemRound;
    isActive: boolean;
}

export interface GameInfo {
    gameId: string;
    maxPlayers: number;
    buyIn: bigint;
    smallBlind: bigint;
    bigBlind: bigint;
    createdAt: string;
    status: string;
}

export interface Player {
    address: string;
    seat: number;
    chips: bigint;
    cards: Card[];
    isActive: boolean;
    hasActed: boolean;
}

export interface LegalAction {
    action: string;
    minAmount?: bigint;
    maxAmount?: bigint;
}

export interface PlayerAction {
    action: string;
    amount?: bigint;
}