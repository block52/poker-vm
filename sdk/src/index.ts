// Main SDK exports
export { CosmosClient } from "./cosmosClient";
export { getDefaultCosmosConfig } from "./cosmosClient";

// Types exports
export type { CosmosConfig, GameState, GameInfo, LegalAction, PlayerAction } from "./types";

// Chain and RPC types
export * from "./types/chain";
export * from "./types/rpc";
export * from "./types/game";

// Core functionality
export * from "./client";
export * from "./deck";
export * from "./pokerSolver";
export * from "./pokerGameIntegration";

export enum KEYS {
    ACTION_TYPE = "actiontype",
    AMOUNT = "amount",
    DEPOSIT_INDEX = "deposit-index",
    INDEX = "index",
    NONCE = "nonce",
    PUBLIC_KEY = "publickey",
    RECEIVER = "receiver",
    SEAT = "seat",
    SEED = "seed",
    TX_HASH = "txHash",
    VALUE = "value",
    WITHDRAW_NONCE = "withdraw-nonce",
    WITHDRAW_SIGNATURE = "withdraw-signature"
}
