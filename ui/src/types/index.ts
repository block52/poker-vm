import { 
    LegalActionDTO, 
    PlayerActionType, 
    NonPlayerActionType,
    PlayerDTO, 
    GameOptionsDTO, 
    TexasHoldemStateDTO, 
    TexasHoldemRound, 
    GameType, 
    ActionDTO,
    PlayerStatus,
    AccountDTO,
    TransactionDTO,
    PerformActionResponse
} from "@bitcoinbrisbane/block52";

// Base type for all hook returns with common loading and error state
export interface BaseHookReturn {
    isLoading: boolean;
    error: Error | null;
}

// Type for the return value of useGameState hook
export interface GameStateReturn extends BaseHookReturn {
    gameState: TexasHoldemStateDTO | undefined;
    refresh: () => Promise<TexasHoldemStateDTO | undefined>;
    getNestedValue: (path: string) => any;
}

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

export type TableData = {
    smallBlindPosition: number;
    bigBlindPosition: number;
    nextToAct: number;
    dealer: number;
    players: PlayerDTO[];
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
    status: PlayerStatus;
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
export interface GameProgressReturn extends BaseHookReturn {
    isGameInProgress: boolean;
    activePlayers: PlayerDTO[];
    playerCount: number;
    handNumber: number;
    actionCount: number;
    nextToAct: number;
    previousActions: ActionDTO[];
}

// Type for the return value of useCardAnimations hook
export interface CardAnimationsReturn {
    flipped1: boolean;
    flipped2: boolean;
    flipped3: boolean;
    showThreeCards: boolean;
}

// Type for the return value of useTableState hook
export interface TableStateReturn extends BaseHookReturn {
    currentRound: TexasHoldemRound;
    totalPot: string;
    formattedTotalPot: string;
    tableSize: number;
    tableType: GameType;
    roundType: TexasHoldemRound;
    refresh: () => Promise<TexasHoldemStateDTO | undefined>;
}

// Type for the return value of useChipPositions hook
export interface ChipPositionsReturn {
    chipPositionArray: PositionArray[];
    tableSize: number;
}

// Type for the return value of useDealerPosition hook
export interface DealerPositionReturn extends BaseHookReturn {
    dealerButtonPosition: { left: string; top: string };
    isDealerButtonVisible: boolean;
}

// Type for the return value of useFindGames hook
export interface FindGamesReturn extends BaseHookReturn {
    games: GameWithAddress[];
    refetch: () => Promise<void>;
}

// Type for the return value of useMinAndMaxBuyIns hook
export interface MinAndMaxBuyInsReturn extends BaseHookReturn {
    minBuyInWei: string;
    maxBuyInWei: string;
    refresh: () => Promise<void>;
}

// Type for the return value of useNextToActInfo hook
export interface NextToActInfoReturn extends BaseHookReturn {
    seat: number | null;
    player: PlayerDTO | null;
    isCurrentUserTurn: boolean;
    availableActions: LegalActionDTO[];
    timeRemaining: number;
}

// Type for the return value of usePlayerChipData hook
export interface PlayerChipDataReturn extends BaseHookReturn {
    chipDataBySeat: Record<number, {
        stack: string;
        sumOfBets: string;
        formattedSumOfBets: string;
    }>;
    getChipAmount: (seatIndex: number) => number;
}

// Type for the return value of usePlayerData hook
export interface PlayerDataReturn extends BaseHookReturn {
    playerData: PlayerDTO | null;
    stackValue: number;
    isFolded: boolean;
    isAllIn: boolean;
    holeCards: string[];
    round: TexasHoldemRound | null;
    refresh: () => Promise<TexasHoldemStateDTO | undefined>;
}

// Type for the return value of usePlayerSeatInfo hook
export interface PlayerSeatInfoReturn extends BaseHookReturn {
    currentUserSeat: number;
    userDataBySeat: Record<number, PlayerDTO>;
    getUserBySeat: (seat: number) => PlayerDTO | null;
    refresh: () => Promise<TexasHoldemStateDTO | undefined>;
}

// Type for the return value of usePlayerTimer hook
export interface PlayerTimerReturn extends BaseHookReturn {
    playerStatus: PlayerStatus;
    timeoutValue: number;
    progress: number;
    timeRemaining: number;
    isActive: boolean;
}

// Type for showing cards data
export interface ShowingCardData {
    address: string;
    holeCards: string[];
    seat: number;
}

// Type for the return value of useShowingCardsByAddress hook
export interface ShowingCardsByAddressReturn extends BaseHookReturn {
    showingPlayers: ShowingCardData[];
    isShowdown: boolean;
    refresh: () => Promise<TexasHoldemStateDTO | undefined>;
}