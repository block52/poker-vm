// change this to PlayerAction from the SDK

export enum PlayerStatus {
    Idle = 0,
    Turn = 1,
    Fold = 2,
    AllIn = 3,
    SeatOff = 4
}

// types.ts
export interface Player {
    index: number; // Unique identifier for the player
    balance: number; // Player's current balance
    status: PlayerStatus; // Player's current choice (e.g., "fold", "call")
    pot: number; // Player's contribution to the pot
}

export interface PlayerContextType {
    players: Player[];
    tableSize: number;
    // updatePlayer: (index: number, updatedPlayer: Player) => void;
    // setPlayerBalance: (index: number, balance: number) => void;
    // setPlayerPot: (index: number, balance: number) => void;
    // handleStatusChange: (index: number, choice: number, updatedPlayers: Player[]) => void;
    // moveToNextPlayer: (index: number, updatedPlayers: Player[]) => void;
    // changeToThinkingBeforeTimeout: () => void;
    setPlayerAction: (action: 'fold' | 'check' | 'raise', amount?: number) => void;
    dealerIndex: number;
    lastPot: number;
    playerIndex: number;
    openOneMore: boolean;
    openTwoMore: boolean;
    showThreeCards: boolean

}
