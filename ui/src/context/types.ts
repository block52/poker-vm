import { PlayerActionType, PlayerDTO } from "@bitcoinbrisbane/block52";

// types.ts
export interface LastActionType {
    action: string;
    amount: number;
}

export interface PlayerContextType {
    players: PlayerDTO[];
    pots: string[];
    tableSize: number;
    seat: number;
    totalPot: number;
    bigBlind: string;
    smallBlind: string;
    roundType: string;
    tableType: string;
    gamePlayers: PlayerDTO[];
    nextToAct: number;
    playerSeats: number[];
    // updatePlayer: (index: number, updatedPlayer: Player) => void;
    // setPlayerBalance: (index: number, balance: number) => void;
    // setPlayerPot: (index: number, balance: number) => void;
    // handleStatusChange: (index: number, choice: number, updatedPlayers: Player[]) => void;
    // moveToNextPlayer: (index: number, updatedPlayers: Player[]) => void;
    // changeToThinkingBeforeTimeout: () => void;
    setPlayerAction: (action: PlayerActionType, amount?: number) => void;
    dealerIndex: number;
    lastPot: number;
    playerIndex: number;
    openOneMore: boolean;
    openTwoMore: boolean;
    showThreeCards: boolean;
}
