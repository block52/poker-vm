import { TexasHoldemRound, Card } from "./game";

// Re-export RPC types
export * from "./rpc";

export interface CosmosConfig {
    rpcEndpoint: string;
    restEndpoint: string;
    chainId: string;
    prefix: string;
    denom: string;
    gasPrice: string;
    mnemonic?: string;
}

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