import { LegalActionDTO, PlayerStatus } from "@bitcoinbrisbane/block52";
import { BaseHookReturn } from "../../types/index";

export interface PlayerLegalActionsResult extends BaseHookReturn {
    legalActions: LegalActionDTO[];
    isSmallBlindPosition: boolean;
    isBigBlindPosition: boolean;
    isDealerPosition: boolean;
    isPlayerTurn: boolean;
    playerStatus: PlayerStatus | null;
    playerSeat: number | null;
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

// 
export interface HandParams {
    tableId: string;
    amount: string;
}

export interface StartNewHandOptions {
    privateKey: string | null;
    nonce?: string | number;
    seed?: string;
}

export interface DealOptions {
    privateKey: string | null;
    nonce?: string | number;
    actionIndex?: number | null;
}

export interface FoldOptions {
    privateKey: string | null;
    nonce?: string | number;
    actionIndex?: number | null;
}

export interface JoinTableOptions {
    buyInAmount: string;
    privateKey?: string | null;
    nonce?: string | number;
    actionIndex?: number;
    seatNumber?: number;
}

export interface LeaveTableOptions {
    amount?: string;
    privateKey?: string | null;
    nonce?: string | number;
    actionIndex?: number | null;
}

// Define MuckOptions interface
export interface MuckOptions {
    privateKey: string | null;
    nonce?: string | number;
    actionIndex?: number | null;
}

// Define ShowCardsParams interface
export interface ShowCardsParams {
    privateKey: string | null;
    nonce?: string | number;
    actionIndex?: number | null;
}
