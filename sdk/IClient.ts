import { Coin, AccountResponse, TxResponse, BlockResponse } from "./types/chain";
import { CosmosConfig, GameState, LegalAction } from "./types/index";

// Note: Using 'any' for Game temporarily to avoid circular dependency
// Game type should be properly defined or we should use a more specific type
export interface IClient {
    getAccount(address: string): Promise<AccountResponse>;
    getAllBalances(address: string): Promise<Coin[]>;
    getBalance(address: string, denom?: string): Promise<bigint>;
    getHeight(): Promise<number>;
    getTx(txHash: string): Promise<TxResponse>;
    getBlock(height: number): Promise<BlockResponse>;
    getLatestBlock(): Promise<BlockResponse>;
    getBlocks(startHeight: number, count?: number): Promise<BlockResponse[]>;
    getLatestBlocks(count?: number): Promise<BlockResponse[]>;
    getGameState(gameId: string): Promise<GameState>;
    getGame(gameId: string): Promise<any>; // Using any for Game to avoid circular dependency
    getLegalActions(gameId: string, playerAddress?: string): Promise<LegalAction[]>;
    listGames(): Promise<any[]>; // Using any[] for Game[] to avoid circular dependency
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
    disconnect(): Promise<void>;
}

