import { PlayerStatus } from "@bitcoinbrisbane/block52";

// Type definitions for better type safety
export interface LegalAction {
    action: string; // "fold", "check", "bet", etc.
    min: string; // Min amount as string (in wei)
    max: string; // Max amount as string (in wei)
    index: number; // Action index
}

export interface PlayerLegalActionsResult {
    legalActions: LegalAction[];
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
