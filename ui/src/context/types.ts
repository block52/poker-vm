// types.ts
export interface Player {
    index: number;
    address: string;
    seat: number;
    holeCards: string[];
    status: string;
    lastAction: LastActionType;
    actions: string[];
    action: string;
    timeout: number;
    signature: string;
}

export interface LastActionType {
    action: string;
    amount: number;
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
    setPlayerAction: (action: "fold" | "check" | "raise", amount?: number) => void;
    dealerIndex: number;
    lastPot: number;
    playerIndex: number;
    openOneMore: boolean;
    openTwoMore: boolean;
    showThreeCards: boolean;
}
