// Intentionally avoid importing types from ./types here to prevent the bundler
// from expecting runtime exports for type-only symbols. Use `any` in this
// interface for now — it's safe and avoids Rollup "not exported by" errors.

import type { CosmosConfig } from "./sdkTypes";

export interface IClient {
    // Return type kept as `any` to avoid requiring a runtime export for a type-only symbol during bundling
    getAccount(address: string): Promise<any>;
    getAllBalances(address: string): Promise<any[]>;
    getBalance(address: string, denom?: string): Promise<bigint>;
    getHeight(): Promise<number>;
    getTx(txHash: string): Promise<any>;
    getBlock(height: number): Promise<any>;
    getLatestBlock(): Promise<any>;
    getBlocks(startHeight: number, count?: number): Promise<any[]>;
    getLatestBlocks(count?: number): Promise<any[]>;
    getGameState(gameId: string): Promise<any>;
    getGame(gameId: string): Promise<any>;
    getLegalActions(gameId: string, playerAddress?: string): Promise<any[]>;
    listGames(): Promise<any[]>;
    findGames(min?: number, max?: number): Promise<any[]>;
    getPlayerGames(player: string): Promise<any[]>;
    getB52USDCBalance(address: string): Promise<bigint>;
    b52usdcToUsdc(b52usdcAmount: bigint): number;
    usdcToB52usdc(usdcAmount: number): bigint;
    getWalletAddress(): Promise<string>;
    sendTokens(fromAddress: string, toAddress: string, amount: bigint, memo?: string): Promise<string>;
    sendB52USDC(fromAddress: string, toAddress: string, amount: bigint, memo?: string): Promise<string>;
    performAction(gameId: string, action: string, amount?: bigint): Promise<string>;
    joinGame(gameId: string, seat: number, buyInAmount: bigint): Promise<string>;
    createGame(
        gameType: string,
        minPlayers: number,
        maxPlayers: number,
        minBuyInB52USDC: bigint,
        maxBuyInB52USDC: bigint,
        smallBlindB52USDC: bigint,
        bigBlindB52USDC: bigint,
        timeout: number
    ): Promise<string>;
    initiateWithdrawal(baseAddress: string, amount: bigint): Promise<string>;
    listWithdrawalRequests(cosmosAddress?: string): Promise<any[]>;
    disconnect(): Promise<void>;
}

