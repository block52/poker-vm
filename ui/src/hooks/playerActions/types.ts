import { LegalActionDTO, PlayerStatus } from "@bitcoinbrisbane/block52";

export interface PlayerLegalActionsResult {
    legalActions: LegalActionDTO[];
    isSmallBlindPosition: boolean;
    isBigBlindPosition: boolean;
    isDealerPosition: boolean;
    isPlayerTurn: boolean;
    playerStatus: PlayerStatus | null;
    playerSeat: number | null;
    isLoading: boolean;
    error: any;
    refresh: () => void;
    foldActionIndex: number | null;
    actionTurnIndex: number;
    isPlayerInGame: boolean;
}

// Interface for Account data structure
export interface AccountData {
    address: string;
    balance: string;
    nonce: number;
}

// Interface for API response
export interface AccountApiResponse {
    id: string;
    result: {
        data: AccountData;
        signature: string;
    };
}

// Define the parameter type for callHand function
export interface HandParams {
    userAddress: string;
    privateKey: string;
    publicKey: string;
    actionIndex: number;
    amount: string;
}

export interface StartNewHandOptions {
    userAddress: string | null;
    privateKey: string | null;
    publicKey: string | null;
    nonce?: string | number;
    seed?: string;
}

export interface DealOptions {
    userAddress: string | null;
    privateKey: string | null;
    publicKey: string | null;
    nonce?: string | number;
    actionIndex?: number | null;
}

export interface FoldOptions {
    userAddress: string | null;
    privateKey: string | null;
    publicKey: string | null;
    nonce?: string | number;
    actionIndex?: number | null;
}

export interface JoinTableOptions {
    buyInAmount: string;
    userAddress: string | null;
    privateKey: string | null;
    publicKey: string | null;
    nonce?: string | number;
    actionIndex?: number;
    seatNumber?: number;
}

export interface LeaveTableOptions {
    amount?: string;
    userAddress?: string | null;
    privateKey?: string | null;
    publicKey?: string | null;
    nonce?: string | number;
    actionIndex?: number | null;
}
