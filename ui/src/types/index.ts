import { LegalActionDTO, PlayerActionType, PlayerDTO, GameOptionsDTO, TexasHoldemStateDTO, TexasHoldemRound, GameType, ActionDTO } from "@bitcoinbrisbane/block52";

// Type for the return value of useGameState hook
export interface GameStateReturn {
    gameState: TexasHoldemStateDTO | undefined;
    error: Error | null;
    isLoading: boolean;
    refresh: () => Promise<TexasHoldemStateDTO | undefined>;
    getNestedValue: (path: string) => any;
}

// Type for action log entries
export type ActionsLogPokerAction = {
    action: string;
    playerId?: string;
    address?: string;
    amount?: string;
    seat?: number;
    timestamp?: string;
    round?: string;
    index?: number;
    [key: string]: any; // For any other properties
};

// Type for error logs
export interface ErrorLog {
    id: string;
    message: string;
    timestamp: Date;
    severity: "error" | "warning" | "info";
    source: "API" | "UI" | "System";
    details?: any;
}

export interface LastActionType {
    action: string;
    amount: number;
}

export interface StartNewHandParams {
    nonce?: number | string;
    seed?: string;
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
    communityCards: string[];
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
    isLoading: boolean;
    error: Error | null;
}

export type Player = {
    address: string;
    seat: number;
    legalActions: LegalActionDTO[];
    timeout: number;
}

export type TableData = {
    smallBlindPosition: number;
    bigBlindPosition: number;
    nextToAct: number;
    dealer: number;
    players: Player[];
    round: string;
    pots: string[];
}

type Limits = {
    min: string;
    max: string;
}

//todo tidy up this type
export type TableStatus = {
    isInTable: boolean;
    isPlayerTurn: boolean;
    seat: number;
    stack: string;
    status: string;
    availableActions: LegalActionDTO[];
    canPostSmallBlind: boolean;
    canPostBigBlind: boolean;
    canCheck: boolean;
    canCall: boolean;
    canBet: boolean;
    canRaise: boolean;
    canFold: boolean;
    betLimits: Limits | null;
    raiseLimits: Limits | null;
    callAmount: string;
    smallBlindAmount: string;
    bigBlindAmount: string;
    isSmallBlindPosition: boolean;
}

// Type for PositionArray component props
export interface PositionArray {
    left?: string;
    top?: string;
    bottom?: string;
    right?: string;
    color?: string;
}


export interface LeaveTableOptions {
    amount: string;
    actionIndex?: number;
    nonce?: number;
}

// Type for game objects returned by findGames
// The 'address' comes from the SDK's findGames() method return
export interface GameWithAddress {
    address: string;
    gameOptions: GameOptionsDTO;
}

// Type for VacantPlayer component props
export interface VacantPlayerProps {
    index: number;
    left: string;
    top: string;
    onJoin?: () => void;
}

// Type for PlayerCard component props
export type PlayerCardProps = {
    id: number;
    label: string;
    color?: string;
    isVacant?: boolean;  // Whether this is a vacant seat
    onClose: () => void;
    setStartIndex: (index: number) => void;
};

export interface PlayerProps {
    left?: string;
    top?: string;
    index: number;
    currentIndex: number;
    color?: string;
    status?: string;
}

export interface TurnAnimationProps {
    index: number;
}

// Type for the return value of useGameProgress hook
export interface GameProgressType {
    isGameInProgress: boolean;
    activePlayers: PlayerDTO[];
    playerCount: number;
    handNumber: number;
    actionCount: number;
    nextToAct: number;
    previousActions: Array<{
        action: string;
        playerId?: string;
        address?: string;
        amount?: string;
        seat?: number;
        timestamp?: string;
        round?: string;
        index?: number;
        [key: string]: any;
    }>;
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<TexasHoldemStateDTO | undefined>;
}

// Type for the return value of useCardAnimations hook
export interface CardAnimationsReturn {
    flipped1: boolean;
    flipped2: boolean;
    flipped3: boolean;
    showThreeCards: boolean;
}

// Type for the return value of useTableState hook
export interface TableStateReturn {
    currentRound: TexasHoldemRound;
    totalPot: string;
    formattedTotalPot: string;
    tableSize: number;
    tableType: GameType;
    roundType: TexasHoldemRound;
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<TexasHoldemStateDTO | undefined>;
}

// Type for the return value of useChipPositions hook
export interface ChipPositionsReturn {
    chipPositionArray: PositionArray[];
    tableSize: number;
}

// Type for the return value of useDealerPosition hook
export interface DealerPositionReturn {
    dealerButtonPosition: { left: string; top: string };
    isDealerButtonVisible: boolean;
    isLoading: boolean;
    error: Error | null;
}

// Type for the return value of useFindGames hook
export interface FindGamesReturn {
    games: GameWithAddress[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

// Type for the return value of useGameProgress hook
export interface GameProgressReturn {
    isGameInProgress: boolean;
    activePlayers: PlayerDTO[];
    playerCount: number;
    handNumber: number;
    actionCount: number;
    nextToAct: number;
    previousActions: ActionDTO[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<TexasHoldemStateDTO | undefined>;
}

// Type for the return value of useMinAndMaxBuyIns hook
export interface MinAndMaxBuyInsReturn {
    minBuyInWei: string;
    maxBuyInWei: string;
    minBuyInFormatted: string;
    maxBuyInFormatted: string;
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

// Type for next-to-act information
export interface NextToActInfo {
    seat: number;
    player: PlayerDTO;
    isCurrentUserTurn: boolean;
    availableActions: LegalActionDTO[];
    timeRemaining: number;
}

// Type for the return value of useNextToActInfo hook
export interface NextToActInfoReturn {
    nextToActInfo: NextToActInfo | null;
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<TexasHoldemStateDTO | undefined>;
}