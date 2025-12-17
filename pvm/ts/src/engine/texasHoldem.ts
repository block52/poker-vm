import {
    ActionDTO,
    Card,
    GameOptions,
    GameOptionsDTO,
    GameType,
    LegalActionDTO,
    NonPlayerActionType,
    PlayerActionType,
    PlayerDTO,
    PlayerStatus,
    RakeConfig,
    RakeConfigDTO,
    TexasHoldemRound,
    TexasHoldemStateDTO,
    WinnerDTO,
    PokerSolver,
    PokerGameIntegration,
    Deck as SDKDeck
} from "@block52/poker-vm-sdk";
import { Player } from "../models/player";
import { Deck } from "../models/deck";

// Import all action types from the actions index
import {
    BetAction,
    BigBlindAction,
    CallAction,
    CheckAction,
    DealAction,
    FoldAction,
    ForfeitAndLeaveAction,
    JoinAction,
    MuckAction,
    NewHandAction,
    RaiseAction,
    ShowAction,
    SmallBlindAction,
    SitOutAction,
    SitInAction,
    TopUpAction
} from "./actions";

import JoinActionSitAndGo from "./actions/sitAndGo/joinAction";
import { IAction, IDealerGameInterface, IDealerPositionManager, IPoker, IUpdate, Result, Turn, TurnWithSeat, Winner } from "./types";
import { ethers } from "ethers";
import { DealerPositionManager } from "./managers/dealerManager";
import { BetManager, CashGameBlindsManager } from "./managers/index";
import { IBlindsManager, SitAndGoBlindsManager } from "./managers/blindsManager";
import { PayoutManager } from "./managers/payoutManager";
import { LoggerFactory } from "../utils/logger";

class TexasHoldemGame implements IDealerGameInterface, IPoker, IUpdate {
    // Private fields
    public readonly dealerManager: IDealerPositionManager;
    private readonly blindsManager: IBlindsManager;

    private readonly _update: IUpdate;
    private readonly _playersMap: Map<number, Player | null>;
    private readonly _rounds = new Map<TexasHoldemRound, TurnWithSeat[]>();
    private readonly _communityCards: Card[] = [];
    private readonly _communityCards2: Card[] = [];
    private readonly _actions: IAction[];
    private readonly _nonPlayerActions: IAction[];
    private readonly _gameOptions: GameOptions;
    private readonly _address: string;
    private _deck: Deck;
    private _pots: [bigint] = [0n];
    private _sidePots = new Map<string, bigint>();
    private _winners = new Map<string, Winner>();
    private _currentRound: TexasHoldemRound;
    private readonly _autoExpire: number = Number(process.env.AUTO_EXPIRE || 0);
    // Stores the current action's timestamp during performAction for deterministic consensus
    private _actionTimestamp?: number;

    // Constructor
    constructor(
        address: string,
        gameOptions: GameOptions,
        private _dealer: number,
        previousActions: ActionDTO[] = [],
        private _handNumber: number = 1,
        private _actionCount: number = 0,
        currentRound: TexasHoldemRound = TexasHoldemRound.ANTE,
        communityCards: string[] = [],
        pots: bigint[] = [0n],
        playerStates: Map<number, Player | null> = new Map(),
        deck: string = "",
        winners: WinnerDTO[] = [],
        private readonly _now: number = Date.now(),
        dealerManager?: IDealerPositionManager,
        private readonly _results: Result[] = []
    ) {
        this._address = address;
        this._playersMap = new Map<number, Player | null>(playerStates);
        this._deck = new Deck(deck);
        this._currentRound = currentRound;

        // Force casting
        this._gameOptions = {
            minBuyIn: BigInt(gameOptions.minBuyIn),
            maxBuyIn: BigInt(gameOptions.maxBuyIn),
            minPlayers: gameOptions.minPlayers,
            maxPlayers: gameOptions.maxPlayers,
            smallBlind: BigInt(gameOptions.smallBlind),
            bigBlind: BigInt(gameOptions.bigBlind),
            timeout: gameOptions.timeout,
            type: gameOptions.type,
            rake: gameOptions.rake ? {
                rakeFreeThreshold: BigInt(gameOptions.rake.rakeFreeThreshold),
                rakePercentage: gameOptions.rake.rakePercentage,
                rakeCap: BigInt(gameOptions.rake.rakeCap),
                owner: gameOptions.rake.owner || gameOptions.owner || ""
            } : undefined,
            owner: gameOptions.owner
        };

        // Validate rake configuration
        if (this._gameOptions.rake) {
            const { rakeFreeThreshold, rakePercentage, rakeCap } = this._gameOptions.rake;
            
            if (rakeFreeThreshold < 0n) {
                throw new Error("Rake-free threshold must be non-negative");
            }
            
            if (rakePercentage < 0 || rakePercentage > 100) {
                throw new Error("Rake percentage must be between 0 and 100");
            }
            
            if (rakeCap < 0n) {
                throw new Error("Rake cap must be non-negative");
            }
        }

        // Hack for old test data
        if (this.handNumber === 0) this._handNumber = 1;

        // Initialize winners
        for (const winner of winners) {
            const _winner: Winner = {
                amount: BigInt(winner.amount),
                cards: winner.cards,
                name: winner.name,
                description: winner.description
            };
            this._winners.set(winner.address, _winner);
        }

        // Initialize community cards
        if (communityCards) {
            for (let i = 0; i < communityCards?.length; i++) {
                const card: Card = Deck.fromString(communityCards[i]);
                this._communityCards.push(card);
            }
        }

        // Initialize pots
        //this._pots = new Array<bigint>(pots.length).fill(0n) as [bigint];
        if (pots) {
            for (let i = 0; i < pots?.length; i++) {
                this._pots[i] = BigInt(pots[i]);
            }
        }

        // Initialize rounds map
        this._rounds.set(TexasHoldemRound.ANTE, []);

        // Load previous actions
        this.loadPreviousActions(previousActions);

        // Initialize update handler
        this._update = new (class implements IUpdate {
            constructor(public game: TexasHoldemGame) { }
            addAction(_action: Turn): void { }
        })(this);

        // Initialize action handlers
        this._actions = [
            new DealAction(this, this._update),
            new SmallBlindAction(this, this._update),
            new BigBlindAction(this, this._update),
            new FoldAction(this, this._update),
            new CheckAction(this, this._update),
            new BetAction(this, this._update),
            new CallAction(this, this._update),
            new RaiseAction(this, this._update),
            new MuckAction(this, this._update),
            new ShowAction(this, this._update),
            new NewHandAction(this, this._update, ""),
            new SitInAction(this, this._update)
        ];

        // Initialize non-player action handlers that can be returned in getLegalActions
        this._nonPlayerActions = [
            new SitOutAction(this, this._update),
            new TopUpAction(this, this._update)
        ];

        this.dealerManager = dealerManager || new DealerPositionManager(this);

        switch (this.type) {
            case GameType.SIT_AND_GO:
            case GameType.TOURNAMENT: // Change once sit and go package is published
                // Initialize Sit and Go specific managers if needed
                // this.statusManager = new SitAndGoStatusManager(this.getSeatedPlayers(), this._gameOptions);
                const gameOptions: GameOptions = {
                    minBuyIn: BigInt(this._gameOptions.minBuyIn),
                    maxBuyIn: BigInt(this._gameOptions.maxBuyIn),
                    minPlayers: this._gameOptions.minPlayers,
                    maxPlayers: this._gameOptions.maxPlayers,
                    smallBlind: BigInt(this._gameOptions.smallBlind),
                    bigBlind: BigInt(this._gameOptions.bigBlind),
                    timeout: this._gameOptions.timeout,
                    type: this._gameOptions.type,
                    rake: this._gameOptions.rake,
                    owner: this._gameOptions.owner
                };
                this.blindsManager = new SitAndGoBlindsManager(10, gameOptions);
                break;
            case GameType.CASH:
            default:
                this.blindsManager = new CashGameBlindsManager(this._gameOptions);
                break;
        }
    }

    // ==================== INITIALIZATION METHODS ====================

    /**
     * Loads previous actions when initializing the game state
     */
    private loadPreviousActions(previousActions: ActionDTO[]): void {
        if (!previousActions || previousActions.length === 0) {
            return;
        }

        for (const action of previousActions) {
            // Create TurnWithSeat directly, preserving the original seat number
            const turnWithSeat: TurnWithSeat = {
                playerId: action.playerId,
                action: action.action,
                amount: action.amount ? BigInt(action.amount) : undefined,
                index: action.index,
                seat: action.seat,
                timestamp: action.timestamp
            };

            // Check if the round already exists in the map
            if (this._rounds.has(action.round)) {
                // Get the existing actions array
                const actions = this._rounds.get(action.round)!;
                // Push the new turn to it
                actions.push(turnWithSeat);
                this._rounds.set(action.round, actions);
            } else {
                // Create a new array with this turn as the first element
                this._rounds.set(action.round, [turnWithSeat]);
            }
        }
    }

    /**
     * Reinitializes the game state for a new hand.
     */
    public reInit(deck: string): void {
        // Cache action count
        // This is the action count before reinit, so we can use it to determine the next action index
        const actionCount = this.getPreviousActions().length + 1; // This is the next count, so need to add 1

        // Reset all players
        for (const player of this.getSeatedPlayers()) {
            player.reinit();

            // Players with 0 chips should be marked as BUSTED
            if (player.chips === 0n) {
                player.updateStatus(PlayerStatus.BUSTED);
            }

            // Activate players who were SITTING_OUT (waiting for next hand)
            if (player.status === PlayerStatus.SITTING_OUT) {
                player.updateStatus(PlayerStatus.ACTIVE);
            }
        }

        const newDealerPosition: number = this.dealerManager.handleNewHand();
        this.setDealerPosition(newDealerPosition);

        // Reset game state
        this._rounds.clear();
        this._rounds.set(TexasHoldemRound.ANTE, []);
        this._deck = new Deck(deck);
        this._pots = [0n];
        this._communityCards.length = 0;
        this._communityCards2.length = 0;
        this._currentRound = TexasHoldemRound.ANTE;
        this._winners.clear();
        this._handNumber += 1;
        this._actionCount += actionCount;
    }

    // ==================== GAME STATE PROPERTIES ====================
    get type(): GameType {
        return this._gameOptions.type;
    }

    // Core game state getters
    get players(): Map<number, Player | null> {
        return this._playersMap;
    }

    get currentRound(): TexasHoldemRound {
        return this._currentRound;
    }

    get handNumber(): number {
        return this._handNumber;
    }

    get communityCards(): Card[] {
        return [...this._communityCards];
    }

    get winners(): Map<string, Winner> | undefined {
        return this._winners;
    }

    get currentPlayerId(): string {
        const player = this.getPlayerAtSeat(this.lastActedSeat);
        return player?.address ?? ethers.ZeroAddress;
    }

    get lastActedSeat(): number {
        let previousActions = this.getPreviousActions();

        // Filter out deal actions
        previousActions = previousActions.filter(action => action.action !== NonPlayerActionType.DEAL);

        if (previousActions.length === 0) {
            return this.dealerPosition; // If no actions, return dealer position
        }

        // Get the last action's seat
        const lastAction = previousActions[previousActions.length - 1];
        if (lastAction && lastAction.seat) {
            return lastAction.seat;
        }

        // If no seat found, return dealer position
        return this.dealerPosition;
    }

    // Game configuration getters
    get minBuyIn(): bigint {
        return this._gameOptions.minBuyIn;
    }

    get maxBuyIn(): bigint {
        return this._gameOptions.maxBuyIn;
    }

    /**
     * Calculate maximum allowed top-up amount for a player
     * @param playerAddress The address of the player
     * @returns The maximum amount the player can add to their stack
     */
    getMaxTopUpAmount(playerAddress: string): bigint {
        const player = this.getPlayer(playerAddress);
        if (!player) return 0n;

        // Cannot top up while in active hand
        if (player.status === PlayerStatus.ACTIVE || player.status === PlayerStatus.ALL_IN) {
            return 0n;
        }

        // Maximum top-up is the difference between max buy-in and current chips
        const maxTopUp = this.maxBuyIn - player.chips;
        return maxTopUp > 0n ? maxTopUp : 0n;
    }

    /**
     * Check if a player can top up their stack
     * @param playerAddress The address of the player
     * @returns True if the player can add chips to their stack
     */
    canTopUp(playerAddress: string): boolean {
        return this.getMaxTopUpAmount(playerAddress) > 0n;
    }

    get minPlayers(): number {
        return this._gameOptions.minPlayers;
    }

    get maxPlayers(): number {
        return this._gameOptions.maxPlayers;
    }

    get bigBlind(): bigint {
        const { bigBlind } = this.blindsManager.getBlinds();
        return bigBlind;
    }

    get smallBlind(): bigint {
        const { smallBlind } = this.blindsManager.getBlinds();
        return smallBlind;
    }

    get rake(): RakeConfig | undefined {
        return this._gameOptions.rake;
    }

    get owner(): string | undefined {
        return this._gameOptions.owner;
    }

    // Position getters
    get dealerPosition(): number {
        // Do not get from the dealer manager, this creates a circular dependency!
        return this._dealer;
    }

    private setDealerPosition(seat: number): void {
        this._dealer = seat; // todo?
    }

    get bigBlindPosition(): number {
        return this.dealerManager.getBigBlindPosition();
    }

    get smallBlindPosition(): number {
        return this.dealerManager.getSmallBlindPosition();
    }

    // Pot getters
    get pot(): bigint {
        return this.getPot();
    }

    // ==================== PLAYER MANAGEMENT METHODS ====================

    /**
     * Checks if a player exists in the game
     */
    exists(playerId: string): boolean {
        const normalizedPlayerId = playerId.toLowerCase();
        for (const [_, player] of this._playersMap.entries()) {
            if (player?.address.toLowerCase() === normalizedPlayerId) {
                return true;
            }
        }
        return false;
    }

    /**
     * Gets the total number of players in the game
     */
    getPlayerCount(): number {
        return Array.from(this._playersMap.values()).filter((player): player is Player => player !== null).length;
    }

    /**
     * Gets the number of active players in the game
     */
    getActivePlayerCount(): number {
        return this.findActivePlayers().length;
    }

    /**
     * Gets all seated players (excluding empty seats)
     */
    getSeatedPlayers(): Player[] {
        return Array.from(this._playersMap.values()).filter((player): player is Player => player !== null);
    }

    /**
     * Finds players with ACTIVE status
     */
    findActivePlayers(): Player[] {
        return Array.from(this._playersMap.values()).filter((player): player is Player => player !== null && player.status === PlayerStatus.ACTIVE);
    }

    /**
     * Finds players who are still in the hand (not folded, busted, or sitting out)
     */
    findLivePlayers(): Player[] {
        return Array.from(this._playersMap.values()).filter(
            (player): player is Player =>
                player !== null &&
                ![PlayerStatus.FOLDED, PlayerStatus.BUSTED, PlayerStatus.SITTING_OUT].includes(player.status) &&
                // In tournament games, exclude players with 0 chips unless they are all-in
                // All-in players should be eligible for showdown even with 0 chips
                (this._gameOptions.type === GameType.CASH || player.chips > 0n || player.status === PlayerStatus.ALL_IN)
        );
    }

    /**
     * Gets a player by their address
     */
    getPlayer(address: string): Player {
        if (!this.exists(address)) {
            throw new Error("Player not found.");
        }

        const normalizedAddress = address.toLowerCase();
        for (const [_, player] of this._playersMap.entries()) {
            if (player?.address.toLowerCase() === normalizedAddress) {
                return player;
            }
        }

        throw new Error("Player not found.");
    }

    /**
     * Gets a player at a specific seat
     */
    getPlayerAtSeat(seat: number): Player | undefined {

        return this._playersMap.get(seat) ?? undefined;
    }

    /**
     * Gets a player's seat number by their ID
     */
    getPlayerSeatNumber(playerId: string): number {
        for (const [seat, player] of this._playersMap.entries()) {
            if (player && player.address === playerId) {
                return seat;
            }
        }
        return -1; // check this?
    }

    /**
     * Gets a player's current status
     */
    getPlayerStatus(address: string): PlayerStatus {
        return this.getPlayer(address).status;
    }

    /**
     * Finds the next empty seat available
     */
    findNextEmptySeat(start: number = 1): number {
        const maxSeats = this.maxPlayers;

        // Search from start to max seats
        for (let seatNumber = start; seatNumber <= maxSeats; seatNumber++) {
            if (!this._playersMap.has(seatNumber) || this._playersMap.get(seatNumber) === null) {
                return seatNumber;
            }
        }

        // Wrap around and search from beginning to start
        for (let seatNumber = 1; seatNumber < start; seatNumber++) {
            if (!this._playersMap.has(seatNumber) || this._playersMap.get(seatNumber) === null) {
                return seatNumber;
            }
        }

        return -1; // No seats available
    }

    getAvailableSeats(): number[] {
        const availableSeats: number[] = [];
        for (let seat = 1; seat <= this.maxPlayers; seat++) {
            if (this.getPlayerAtSeat(seat) === undefined || this.getPlayerAtSeat(seat) === null) {
                availableSeats.push(seat);
            }
        }
        return availableSeats;
    }

    /**
     * Checks if a hand is currently in progress
     * A hand is in progress if:
     * 1. We're past ANTE but haven't reached END, OR
     * 2. We're in ANTE but blinds have been posted (hand has started)
     */
    private isHandInProgress(): boolean {
        // If we're past ANTE but not at END, hand is definitely in progress
        if (this._currentRound !== TexasHoldemRound.ANTE &&
            this._currentRound !== TexasHoldemRound.END) {
            return true;
        }

        // If we're at END, hand is not in progress
        if (this._currentRound === TexasHoldemRound.END) {
            return false;
        }

        // We're in ANTE - check if blinds have been posted
        const actions = this._rounds.get(TexasHoldemRound.ANTE) || [];
        const hasBlinds = actions.some(
            a => a.action === PlayerActionType.SMALL_BLIND ||
                 a.action === PlayerActionType.BIG_BLIND
        );

        return hasBlinds;
    }

    /**
     * Adds a player to the game at a specific seat
     * If a hand is in progress, player is set to SITTING_OUT and will join the next hand
     */
    joinAtSeat(player: Player, seat: number): void {
        // Ensure the seat is valid
        if (seat === -1) {
            throw new Error("Table full.");
        }

        // Add player to the table
        this._playersMap.set(seat, player);

        // If a hand is in progress, set player to SITTING_OUT
        // They will become ACTIVE when the next hand starts
        if (this.isHandInProgress()) {
            player.updateStatus(PlayerStatus.SITTING_OUT);
        } else {
            player.updateStatus(PlayerStatus.ACTIVE);
        }
    }

    /**
     * Removes a player from the game
     */
    removePlayer(playerAddress: string): void {
        const seat = this.getPlayerSeatNumber(playerAddress);
        if (seat === -1) {
            throw new Error("Player not found.");
        }

        this._playersMap.delete(seat);
    }

    /**
     * Checks if a player's turn has expired
     */
    private expired(address: string): boolean {
        const nextToAct = this.findNextPlayerToAct();
        if (!nextToAct || nextToAct.address !== address) {
            return false;
        }

        const lastAction = this.getPlayersLastAction(address);
        if (!lastAction) {
            return false;
        }

        return this._now - lastAction.timestamp > this._now + this._autoExpire * 1000; // Auto expire time
    }

    // ==================== GAME FLOW METHODS ====================

    /**
     * Deals cards to all players
     */
    deal(): void {
        // // Check minimum players: TODO change this to use gameStatus
        // if (this.getActivePlayerCount() < this._gameOptions.minPlayers) {
        //     throw new Error("Not enough active players");
        // }

        // This is all done in the verify method of DealAction

        // Validate current round
        if (this.currentRound !== TexasHoldemRound.ANTE) {
            throw new Error("Can only deal in ante round.");
        }

        // Initialize blinds manager for Sit and Go
        // Bit of a hack.  Another option would be to get the last join action timestamp
        if (this.type === GameType.SIT_AND_GO && this.blindsManager instanceof SitAndGoBlindsManager) {
            this.blindsManager.setStartTime(new Date());
        }

        // // Check if cards have already been dealt
        // const anyPlayerHasCards = this.getSeatedPlayers().some(p => p.holeCards !== undefined);
        // if (anyPlayerHasCards) {
        //     throw new Error("Cards have already been dealt for this hand.");
        // }

        // Only deal to ACTIVE players (excludes SITTING_OUT/waiting players)
        const players = this.findActivePlayers();

        // Deal first card to each player
        for (const player of players) {
            const firstCard = this._deck.getNext();
            if (!player.holeCards) {
                player.holeCards = [firstCard, firstCard]; // Temporarily assign same card twice
            } else {
                player.holeCards[0] = firstCard; // Replace first card if holeCards already exists
            }
        }

        // Deal second card to each player
        for (const player of players) {
            const secondCard = this._deck.getNext();
            if (player.holeCards) {
                player.holeCards[1] = secondCard; // Replace second card
            }
        }

        // Deal community cards
        this._communityCards2.push(...this._deck.deal(5));
    }

    /**
     * Advances to the next round and handles end-of-round logic
     */
    private nextRound(): void {
        this.calculateSidePots();

        // Deal community cards based on the current round
        this.dealCommunityCards();

        // Advance to next round
        this.setNextRound();

        // Initialize the new round's action list if needed
        if (!this._rounds.has(this.currentRound)) {
            this._rounds.set(this.currentRound, []);
        }
    }

    /**
     * Deals appropriate community cards based on current round
     */
    private dealCommunityCards(): void {
        if (this.currentRound === TexasHoldemRound.PREFLOP) {
            // Moving to FLOP - deal 3 community cards
            this._communityCards.push(...this._deck.deal(3));
        } else if (this.currentRound === TexasHoldemRound.FLOP) {
            // Moving to TURN - deal 1 card
            this._communityCards.push(...this._deck.deal(1));
        } else if (this.currentRound === TexasHoldemRound.TURN) {
            // Moving to RIVER - deal 1 card
            this._communityCards.push(...this._deck.deal(1));
        } else if (this.currentRound === TexasHoldemRound.RIVER) {
            // Moving to SHOWDOWN
        }
    }

    private getCommunityCards(): Card[] {
        const cards: Card[] = [];
        if (this.currentRound === TexasHoldemRound.FLOP) {
            // Moving to FLOP - deal 3 community cards
            cards.push(...this._communityCards2.slice(0, 3));
        }
        if (this.currentRound === TexasHoldemRound.TURN) {
            // Moving to TURN - deal 1 card
            cards.push(...this._communityCards2.slice(0, 4));
        }
        if (this.currentRound === TexasHoldemRound.RIVER) {
            // Moving to RIVER - deal 1 card
            cards.push(...this._communityCards2.slice(0, 5));
        }
        return cards;
    }

    /**
     * Gets the next round in the sequence
     */
    private getNextRound(): TexasHoldemRound {
        switch (this.currentRound) {
            case TexasHoldemRound.ANTE:
                return TexasHoldemRound.PREFLOP;
            case TexasHoldemRound.PREFLOP:
                return TexasHoldemRound.FLOP;
            case TexasHoldemRound.FLOP:
                return TexasHoldemRound.TURN;
            case TexasHoldemRound.TURN:
                return TexasHoldemRound.RIVER;
            case TexasHoldemRound.RIVER:
                return TexasHoldemRound.SHOWDOWN;
            case TexasHoldemRound.SHOWDOWN:
                return TexasHoldemRound.END;
            default:
                return TexasHoldemRound.ANTE;
        }
    }

    /**
     * Sets the current round to the next round
     */
    private setNextRound(): void {
        this._currentRound = this.getNextRound();
    }

    /**
     * Gets the next player who should act
     */
    getNextPlayerToAct(): Player | undefined {
        const round = this.currentRound;
        return this.findNextPlayerToActForRound(round);
    }

    /**
     * Finds the next player to act for a round
     */
    private findNextPlayerToActForRound(round: TexasHoldemRound): Player | undefined {
        const actions: TurnWithSeat[] = [];
        actions.push(...(this._rounds.get(round) || []));

        // Special logic for ante round - prioritize blind posting order
        if (round === TexasHoldemRound.ANTE) {
            const hasSmallBlind = actions.some(a => a.action === PlayerActionType.SMALL_BLIND);

            // If small blind hasn't been posted yet, small blind player should act
            if (!hasSmallBlind) {
                const smallBlindPosition = this.dealerManager.getSmallBlindPosition();
                const smallBlindPlayer = this.getPlayerAtSeat(smallBlindPosition);

                // The statuses are covered in the dealer manager
                // if (smallBlindPlayer && (smallBlindPlayer.status === PlayerStatus.ACTIVE || smallBlindPlayer.status === PlayerStatus.NOT_ACTED)) {
                if (smallBlindPlayer) {
                    return smallBlindPlayer;
                }
            }

            const hasBigBlind = actions.some(a => a.action === PlayerActionType.BIG_BLIND);

            // If small blind posted but big blind hasn't, big blind player should act
            if (hasSmallBlind && !hasBigBlind) {
                const bigBlindPosition = this.dealerManager.getBigBlindPosition();
                const bigBlindPlayer = this.getPlayerAtSeat(bigBlindPosition);
                if (bigBlindPlayer) {
                    return bigBlindPlayer;
                }
            }
        }

        if (round === TexasHoldemRound.PREFLOP) {
            const blinds = this._rounds.get(TexasHoldemRound.ANTE) || [];
            actions.push(...blinds);
        }

        // Filter out any non player actions
        const filteredActions = actions.filter(a => a.action !== NonPlayerActionType.JOIN && a.action !== NonPlayerActionType.DEAL);

        let start = filteredActions.sort((a, b) => b.index - a.index)[0]?.seat + 1 || this.lastActedSeat + 1;
        if (filteredActions.length === 0) {
            // If no actions yet, start from dealer position
            start = this.dealerPosition + 1 > this.maxPlayers ? 1 : this.dealerPosition + 1;
        }

        // Search from start position to end
        for (let i = start; i <= this.maxPlayers; i++) {
            const player = this.getPlayerAtSeat(i);

            // if they dont have chips and the round is not show down, skip them
            if (player && player.chips === 0n && round !== TexasHoldemRound.SHOWDOWN) {
                continue;
            }

            // During SHOWDOWN, both ACTIVE and ALL_IN players can act (show/muck)
            if (player && player.status === PlayerStatus.ACTIVE) {
                return player;
            }
            if (round === TexasHoldemRound.SHOWDOWN && player && player.status === PlayerStatus.ALL_IN) {
                return player;
            }
        }

        // Wrap around and search from beginning to start
        for (let i = 1; i < start; i++) {
            const player = this.getPlayerAtSeat(i);

            // if they dont have chips and the round is not show down, skip them
            if (player && player.chips === 0n && round !== TexasHoldemRound.SHOWDOWN) {
                continue;
            }

            // During SHOWDOWN, both ACTIVE and ALL_IN players can act (show/muck)
            if (player && player.status === PlayerStatus.ACTIVE) {
                return player;
            }
            if (round === TexasHoldemRound.SHOWDOWN && player && player.status === PlayerStatus.ALL_IN) {
                return player;
            }
        }

        return undefined;
    }

    /**
     * Finds the next player to act, starting from a specified position
     */
    private findNextPlayerToAct(start: number = this.lastActedSeat + 1): Player | undefined {
        // Special logic for ante round - prioritize blind posting order
        if (this.currentRound === TexasHoldemRound.ANTE) {
            const actions = this._rounds.get(this.currentRound) || [];
            const hasSmallBlind = actions.some(a => a.action === PlayerActionType.SMALL_BLIND);
            const hasBigBlind = actions.some(a => a.action === PlayerActionType.BIG_BLIND);

            // If small blind hasn't been posted yet, small blind player should act
            if (!hasSmallBlind) {
                const smallBlindPlayer = this.getPlayerAtSeat(this.smallBlindPosition);
                if (smallBlindPlayer && smallBlindPlayer.status === PlayerStatus.ACTIVE) {
                    return smallBlindPlayer;
                }
            }

            // If small blind posted but big blind hasn't, big blind player should act
            if (hasSmallBlind && !hasBigBlind) {
                const bigBlindPlayer = this.getPlayerAtSeat(this.bigBlindPosition);
                if (bigBlindPlayer && bigBlindPlayer.status === PlayerStatus.ACTIVE) {
                    return bigBlindPlayer;
                }
            }
        }

        if (start > this.maxPlayers) {
            start = 1;
        }

        // Search from start position to end
        for (let i = start; i <= this.maxPlayers; i++) {
            const player = this.getPlayerAtSeat(i);
            if (player && player.status === PlayerStatus.ACTIVE) {
                return player;
            }
        }

        // Wrap around and search from beginning to start
        for (let i = 1; i < start; i++) {
            const player = this.getPlayerAtSeat(i);
            if (player && player.status === PlayerStatus.ACTIVE) {
                return player;
            }
        }

        return undefined;
    }

    /**
     * Determines if game should auto-runout remaining streets
     * This happens when no more betting action is possible
     */
    private shouldAutoRunout(): boolean {
        const livePlayers = this.findLivePlayers();
        const allInPlayers = livePlayers.filter(player => player.status === PlayerStatus.ALL_IN);
        const activePlayers = livePlayers.filter(player => player.status === PlayerStatus.ACTIVE);

        // Case 1: All remaining live players are all-in (2 or more players)
        // No more betting action possible - auto-runout remaining streets
        if (allInPlayers.length >= 2 && allInPlayers.length === livePlayers.length) {
            return true;
        }

        // Case 2: Heads-up or multi-way with one or more all-in and one active player who has matched the bet
        // If there's only 1 active player left and others are all-in, check if active player has matched the largest all-in
        if (allInPlayers.length >= 1 && activePlayers.length === 1) {
            // IMPORTANT: Check ALL rounds, not just current round
            // After advancing from FLOP to TURN, the TURN round has no actions yet
            // But we still need to detect auto-runout based on previous betting
            const allActions: Turn[] = [];
            for (const [, actions] of this._rounds.entries()) {
                allActions.push(...actions);
            }
            const betManager = new BetManager(allActions);

            const activePlayer = activePlayers[0];
            const activePlayerBet = betManager.getTotalBetsForPlayer(activePlayer.address);

            // Find the largest all-in bet
            let largestAllInBet = 0n;
            for (const allInPlayer of allInPlayers) {
                const allInBet = betManager.getTotalBetsForPlayer(allInPlayer.address);
                if (allInBet > largestAllInBet) {
                    largestAllInBet = allInBet;
                }
            }

            // If active player has matched or exceeded the largest all-in, no more betting possible
            if (activePlayerBet >= largestAllInBet) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determines if the current betting round has ended
     */
    hasRoundEnded(round: TexasHoldemRound): boolean {
        // Step 1: Get live players (excludes folded and sitting out players, includes all-in players)
        const livePlayers = this.findLivePlayers();

        // Step 2: If only one live player remains, they win - move to showdown
        // IMPORTANT: In ANTE round, we must wait for both blinds to be posted even if only one player is live
        // This prevents the game from advancing to PREFLOP prematurely in heads-up scenarios
        // Also don't force SHOWDOWN if we're already at or past SHOWDOWN
        if (livePlayers.length <= 1 && round !== TexasHoldemRound.ANTE) {
            if (this.currentRound !== TexasHoldemRound.ANTE &&
                this.currentRound !== TexasHoldemRound.SHOWDOWN &&
                this.currentRound !== TexasHoldemRound.END &&
                livePlayers.length === 1) {
                // Check community cards, deal the remaining
                this._currentRound = TexasHoldemRound.SHOWDOWN;
                this.dealCommunityCards();
                this.calculateWinner();
            }
            return true;
        }

        // Step 3: Check if we should auto-runout (all live players all-in, 2+)
        // Don't auto-runout during ANTE round - must wait for blinds and deal
        if (this.shouldAutoRunout() && round !== TexasHoldemRound.ANTE && round !== TexasHoldemRound.SHOWDOWN && round !== TexasHoldemRound.END) {
            // Auto-runout: round ends immediately to trigger automatic progression
            // The nextRound() method will be called repeatedly until we reach showdown
            return true;
        }

        // Step 4: Get active players (can still act - excludes all-in players)
        // Skip this check if we're already at SHOWDOWN or END - those rounds have their own logic
        const activePlayers = livePlayers.filter(player => player.status === PlayerStatus.ACTIVE);
        if (activePlayers.length === 0 && round !== TexasHoldemRound.SHOWDOWN && round !== TexasHoldemRound.END) {
            // No active players remain, round ends
            this._currentRound = TexasHoldemRound.SHOWDOWN;
            this.dealCommunityCards();
            this.calculateWinner();
            return true;
        }

        // Get actions for this round
        const actions = this._rounds.get(round) || [];

        // Step 5: Special case for ANTE round
        if (round === TexasHoldemRound.ANTE) {
            const hasSmallBlind = actions.some(a => a.action === PlayerActionType.SMALL_BLIND);
            const hasBigBlind = actions.some(a => a.action === PlayerActionType.BIG_BLIND);
            const hasDealt = actions.some(a => a.action === NonPlayerActionType.DEAL);

            // Round ends when both blinds are posted AND cards are dealt
            return hasSmallBlind && hasBigBlind && hasDealt;
        }

        // Special case for SHOWDOWN round
        if (round === TexasHoldemRound.SHOWDOWN) {
            // If only one player remains (everyone else folded), no need to show - advance to END
            if (livePlayers.length <= 1) {
                return true;
            }

            // Check if all live players have either shown or mucked
            const showdownActions = actions.filter(a => a.action === PlayerActionType.SHOW || a.action === PlayerActionType.MUCK);
            const playersWhoActedInShowdown = new Set(showdownActions.map(a => a.playerId));

            // If all live players have either shown or mucked, the round ends
            const allPlayersActed = livePlayers.every(player => playersWhoActedInShowdown.has(player.address));

            if (allPlayersActed) {
                this.calculateWinner();
                return true;
            }
            return false;
        }

        // Step 6: If all live players are all-in, skip to showdown
        const allInPlayers = livePlayers.filter(player => player.status === PlayerStatus.ALL_IN);
        if (allInPlayers.length === livePlayers.length && livePlayers.length > 1) {
            // All remaining players are all-in, round ends immediately
            return true;
        }

        // Step 7: If no active players remain (all are all-in), round ends
        if (activePlayers.length === 0) {
            return true;
        }

        // Check if cards have been dealt
        const hasDealt = actions.some(a => a.action === NonPlayerActionType.DEAL);
        const anyPlayerHasCards = this.getSeatedPlayers().some(p => p.holeCards !== undefined);

        // Get betting actions (excluding blinds and deal)
        const bettingActions = actions.filter(
            a => a.action !== PlayerActionType.SMALL_BLIND && a.action !== PlayerActionType.BIG_BLIND && a.action !== NonPlayerActionType.DEAL
        );

        // If cards dealt but no betting actions yet, round is not over
        if ((hasDealt || anyPlayerHasCards) && bettingActions.length === 0) {
            return false;
        }

        // Step 8: Check that all active players have acted
        const playersWhoActed = new Set(bettingActions.map(a => a.playerId));

        for (const player of activePlayers) {
            if (!playersWhoActed.has(player.address)) {
                return false; // Player hasn't acted yet
            }
        }

        // Step 9: Check if all players have acted AFTER the last bet/raise/all-in
        let lastBetOrRaiseIndex = -1;
        let lastBetOrRaisePlayerId = "";
        for (let i = actions.length - 1; i >= 0; i--) {
            if (actions[i].action === PlayerActionType.BET || actions[i].action === PlayerActionType.RAISE || actions[i].action === PlayerActionType.ALL_IN) {
                lastBetOrRaiseIndex = i;
                lastBetOrRaisePlayerId = actions[i].playerId;
                break;
            }
        }

        if (lastBetOrRaiseIndex >= 0) {
            // If there was a bet/raise/all-in, ensure all OTHER active players have acted after it
            for (const player of activePlayers) {
                // Skip the player who made the bet/raise/all-in - they don't need to act again
                if (player.address === lastBetOrRaisePlayerId) {
                    continue;
                }

                const playerActionsAfterBet = actions.filter(a => a.playerId === player.address && actions.indexOf(a) > lastBetOrRaiseIndex);

                if (playerActionsAfterBet.length === 0) {
                    return false; // Player hasn't responded to the bet/raise/all-in yet
                }
            }
        }

        // Step 10: For PREFLOP, check if it's just checks/calls (no bets/raises)
        if (round === TexasHoldemRound.PREFLOP) {
            const preflopBetsOrRaises = bettingActions.filter(a => a.action === PlayerActionType.BET || a.action === PlayerActionType.RAISE);

            if (preflopBetsOrRaises.length === 0) {
                // No bets/raises in PREFLOP, just checks/calls - round can end
                return true;
            }

            // If there were bets/raises, fall through to normal logic below
            // (don't return here - let it continue to Steps 5 and 7)
        }

        // Step 11: Calculate each active player's total bets and check if they're equal
        // Note: We only check active players, not all live players, because all-in players
        // cannot contribute more to the current round and shouldn't be included in equality check
        const playerBets: bigint[] = [];

        for (const player of activePlayers) {
            // For PREFLOP, include blind bets from ANTE round
            const totalBet =
                round === TexasHoldemRound.PREFLOP
                    ? this.getPlayerTotalBets(player.address, round, true) // includeBlinds = true
                    : this.getPlayerTotalBets(player.address, round);

            playerBets.push(totalBet);

            // Debug logging for PREFLOP
            if (round === TexasHoldemRound.PREFLOP) {
                LoggerFactory.getInstance().log(`Player ${player.address} PREFLOP total bet: ${totalBet}`, "debug");
                LoggerFactory.getInstance().log(`  - ANTE bets: ${this.getPlayerTotalBets(player.address, TexasHoldemRound.ANTE)}`, "debug");
                LoggerFactory.getInstance().log(`  - PREFLOP bets: ${this.getPlayerTotalBets(player.address, TexasHoldemRound.PREFLOP)}`, "debug");
            }
        }

        // Step 11: If all active player bets are equal, round has concluded
        const allBetsEqual = playerBets.every(bet => bet === playerBets[0]);

        if (round === TexasHoldemRound.PREFLOP) {
            LoggerFactory.getInstance().log(`PREFLOP bet equality check: ${allBetsEqual}, bets: [${playerBets.join(", ")}]`, "debug");
        }

        return allBetsEqual;
    }

    // ==================== ACTION HANDLING METHODS ====================

    /**
     * Returns the current turn index
     */
    getActionIndex(): number {
        // plus the last count
        return this._actionCount + this.getPreviousActions().length + 1; // +1 for the next action
    }

    /**
     * Gets legal actions for a specific player
     */
    getLegalActions(address: string): LegalActionDTO[] {
        const player = this.getPlayer(address);

        const verifyAction = (action: IAction): LegalActionDTO | undefined => {
            try {
                const range = action.verify(player);
                return {
                    action: action.type,
                    min: range.minAmount.toString(),
                    max: range.maxAmount.toString(),
                    index: this.getActionIndex()
                };
            } catch {
                return undefined;
            }
        };

        // Get all valid player actions
        const playerActions = this._actions.map(verifyAction).filter((a): a is LegalActionDTO => !!a);

        // Get all valid non-player actions (SIT_OUT, TOP_UP, etc.)
        const nonPlayerActions = this._nonPlayerActions.map(verifyAction).filter((a): a is LegalActionDTO => !!a);

        // Combine and return all legal actions
        return [...playerActions, ...nonPlayerActions];
    }

    /**
     * Gets the last action taken in the current round
     */
    getLastRoundAction(): TurnWithSeat | undefined {
        const actions = this._rounds.get(this.currentRound);

        if (!actions || actions.length === 0) {
            return undefined;
        }

        return actions.at(-1);
    }

    /**
     * Gets a player's last action
     */
    getPlayersLastAction(address: string): TurnWithSeat | undefined {
        const player = this.getPlayer(address);
        return this.getPlayerActions(player).at(-1);
    }

    /**
     * Gets all actions for a specific player in a round
     */
    private getPlayerActions(player: Player, round: TexasHoldemRound = this.currentRound): TurnWithSeat[] {
        const actions = this._rounds.get(round);

        if (!actions) {
            return [];
        }

        return actions.filter(action => action.playerId === player.address);
    }

    /**
     * Performs a poker action for a specific player
     */
    performAction(address: string, action: PlayerActionType | NonPlayerActionType, index: number, amount?: bigint, data?: string, timestamp?: number): void {
        // Check action index for replay protection
        const actionIndex = this.getActionIndex();
        if (index !== actionIndex) {
            throw new Error("Invalid action index.");
        }

        // Store timestamp for use by addAction/addNonPlayerAction during this action
        // Timestamp must be provided from Cosmos block time for deterministic consensus
        if (timestamp === undefined) {
            throw new Error("Timestamp is required for deterministic consensus. Blockchain timestamp must be provided.");
        }
        
        this._actionTimestamp = timestamp;

        // Convert amount to BigInt if provided
        const _amount: bigint = amount ? BigInt(amount) : 0n;

        // Handle non-player actions first
        switch (action) {
            case NonPlayerActionType.JOIN:
                const player = new Player(address, undefined, _amount, undefined, PlayerStatus.SITTING_OUT);
                // Hack
                if (this.type === GameType.SIT_AND_GO || this.type === GameType.TOURNAMENT) {
                    new JoinActionSitAndGo(this, this._update).execute(player, index, _amount, data);
                    return;
                }
                if (this.type === GameType.CASH) {
                    new JoinAction(this, this._update).execute(player, index, _amount, data);
                }
                return;
            case NonPlayerActionType.LEAVE:
                // Use ForfeitAndLeaveAction to allow leaving at any time (folds if in active hand)
                new ForfeitAndLeaveAction(this, this._update).execute(this.getPlayer(address), index);
                return;
            case NonPlayerActionType.DEAL:
                new DealAction(this, this._update).execute(this.getPlayer(address), index);
                this.setNextRound();
                return;
            case NonPlayerActionType.NEW_HAND:
                new NewHandAction(this, this._update, data || "").execute(this.getPlayer(address), index);
                return;
            case NonPlayerActionType.TOP_UP:
                if (!this.exists(address)) {
                    throw new Error("Player not found.");
                }
                new TopUpAction(this, this._update).execute(this.getPlayer(address), index, _amount);
                return;
            case NonPlayerActionType.SIT_OUT:
                if (!this.exists(address)) {
                    throw new Error("Player not found.");
                }
                new SitOutAction(this, this._update).execute(this.getPlayer(address), index);
                return;
        }

        if (amount !== undefined && amount < 0n) {
            throw new Error("Amount cannot be negative or undefined for these action types.");
        }

        // Verify player exists in the game
        if (!this.exists(address)) {
            throw new Error("Player not found.");
        }

        // Get player and seat information
        const player = this.getPlayer(address);

        // Execute the specific player action
        switch (action) {
            case PlayerActionType.SMALL_BLIND:
                // Allow partial small blind if player is short-stacked
                const sbAmount = player.chips < this.smallBlind ? player.chips : this.smallBlind;
                new SmallBlindAction(this, this._update).execute(player, index, sbAmount);
                break;
            case PlayerActionType.BIG_BLIND:
                // Allow partial big blind if player is short-stacked
                const bbAmount = player.chips < this.bigBlind ? player.chips : this.bigBlind;
                new BigBlindAction(this, this._update).execute(player, index, bbAmount);
                break;
            case PlayerActionType.FOLD:
                new FoldAction(this, this._update).execute(player, index);
                break;
            case PlayerActionType.CHECK:
                new CheckAction(this, this._update).execute(player, index, 0n);
                break;
            case PlayerActionType.ALL_IN: // Should use bet from the SDK
                const amount = player.chips;
                new BetAction(this, this._update).execute(player, index, amount);
                break;
            case PlayerActionType.BET:
                new BetAction(this, this._update).execute(player, index, _amount);
                break;
            case PlayerActionType.CALL:
                new CallAction(this, this._update).execute(player, index, _amount);
                break;
            case PlayerActionType.RAISE:
                new RaiseAction(this, this._update).execute(player, index, _amount);
                break;
            case PlayerActionType.MUCK:
                new MuckAction(this, this._update).execute(player, index, _amount);
                break;
            case PlayerActionType.SHOW:
                new ShowAction(this, this._update).execute(player, index);
                break;
            case NonPlayerActionType.SIT_IN:
                player.updateStatus(PlayerStatus.ACTIVE);
                break;
        }

        // Record the action in the player's history
        // Use _actionTimestamp which was set at the start of performAction (from Cosmos block time or Date.now() fallback)
        player.addAction({ playerId: address, action, amount, index }, this._actionTimestamp!);

        // Check if the round has ended and advance if needed
        // Loop through remaining rounds if auto-runout is triggered (all-in scenario)
        // Continue until we reach END round
        // Safety counter prevents infinite loops (max 6 advances / 7 rounds: ANTE->PREFLOP->FLOP->TURN->RIVER->SHOWDOWN->END)
        let safetyCounter = 0;
        const MAX_ROUND_ADVANCES = 6;
        while (this.hasRoundEnded(this.currentRound) && this._currentRound !== TexasHoldemRound.END && safetyCounter < MAX_ROUND_ADVANCES) {
            this.nextRound();
            safetyCounter++;
        }
        if (safetyCounter >= MAX_ROUND_ADVANCES && this._currentRound !== TexasHoldemRound.END) {
            LoggerFactory.getInstance().log(
                `Safety counter reached ${MAX_ROUND_ADVANCES} advances in round ${this._currentRound}. Possible infinite loop.`,
                "error"
            );
        }
    }

    /**
     * Adds a player action to the game state
     */
    addAction(turn: Turn, round: TexasHoldemRound = this.currentRound): void {
        const seat = this.getPlayerSeatNumber(turn.playerId);
        // Use stored action timestamp from performAction for deterministic consensus
        if (this._actionTimestamp === undefined) {
            throw new Error("Action timestamp not set. performAction must be called with a timestamp.");
        }
        const turnWithSeat: TurnWithSeat = { ...turn, seat, timestamp: this._actionTimestamp };

        this.setAction(turnWithSeat, round);
    }

    /**
     * Adds a non-player action to the game state
     */
    addNonPlayerAction(turn: Turn, data?: string): void {
        // Use stored action timestamp from performAction for deterministic consensus
        if (this._actionTimestamp === undefined) {
            throw new Error("Action timestamp not set. performAction must be called with a timestamp.");
        }
        const seat = data ? Number(data) : this.getPlayerSeatNumber(turn.playerId);
        const turnWithSeat: TurnWithSeat = { ...turn, seat, timestamp: this._actionTimestamp };

        this.setAction(turnWithSeat, this.currentRound);
    }

    /**
     * Sets the action timestamp for testing purposes.
     * In production, this is set automatically by performAction from the blockchain timestamp.
     * @internal For testing only
     */
    setActionTimestamp(timestamp: number): void {
        this._actionTimestamp = timestamp;
    }

    /**
     * Stores an action in the appropriate round's action list
     */
    private setAction(turn: TurnWithSeat, round: TexasHoldemRound): void {
        // Check if the round already exists in the map
        if (this._rounds.has(round)) {
            const actions = this._rounds.get(round)!;
            actions.push(turn);
            this._rounds.set(round, actions);
        } else {
            this._rounds.set(round, [turn]);
        }
    }

    /**
     * Gets all previous actions across all rounds
     */
    getPreviousActions(): TurnWithSeat[] {
        const actions: TurnWithSeat[] = [];

        for (const [_, turns] of this._rounds) {
            for (const turn of turns) {
                const action: TurnWithSeat = {
                    playerId: turn.playerId,
                    seat: turn.seat,
                    action: turn.action,
                    amount: turn.amount ? BigInt(turn.amount) : undefined,
                    index: turn.index,
                    timestamp: turn.timestamp
                };
                actions.push(action);
            }
        }

        return actions;
    }

    /**
     * Gets all actions as DTOs for serialization
     */
    getActionDTOs(): ActionDTO[] {
        const actions: ActionDTO[] = [];

        for (const [round, turns] of this._rounds) {
            for (const turn of turns) {
                const action: ActionDTO = {
                    playerId: turn.playerId,
                    seat: turn.seat,
                    action: turn.action,
                    amount: turn.amount ? turn.amount.toString() : "",
                    round: round,
                    index: turn.index,
                    timestamp: turn.timestamp
                };
                actions.push(action);
            }
        }

        return actions;
    }

    /**
     * Gets all actions for a specific round
     */
    getActionsForRound(round: TexasHoldemRound): TurnWithSeat[] {
        return [...(this._rounds.get(round) || [])];
    }

    // ==================== POT AND BETTING METHODS ====================

    /**
     * Gets all bets across all rounds
     */
    getAllBets(): Map<string, bigint> {
        const bets = new Map<string, bigint>();

        for (const round of this._rounds.keys()) {
            const roundBets = this.getBets(round);

            for (const [playerId, amount] of roundBets) {
                const currentTotal = bets.get(playerId) || 0n;
                bets.set(playerId, currentTotal + amount);
            }
        }

        return bets;
    }

    /**
     * Gets all bets for a specific round:  Note, deprecated, use betManager instead
     */
    getBets(round: TexasHoldemRound = this.currentRound): Map<string, bigint> {
        const bets = new Map<string, bigint>();
        const actions = this.getActionsForRound(round);

        if (!actions || actions.length === 0) {
            return bets;
        }

        for (const action of actions) {
            // Skip actions without an amount, JOIN actions, or LEAVE actions
            // JOIN/LEAVE amounts represent buy-in/stack values, not bets
            if (action.amount === undefined ||
                action.action === NonPlayerActionType.JOIN ||
                action.action === NonPlayerActionType.LEAVE) {
                continue;
            }

            const currentTotal = bets.get(action.playerId) || 0n;
            bets.set(action.playerId, currentTotal + action.amount);
        }

        return bets;
    }

    /**
     * Gets a player's total bets for a specific round.
     */
    getPlayerTotalBets(playerId: string, round: TexasHoldemRound = this.currentRound, includeBlinds: boolean = false): bigint {
        const actions = this.getActionsForRound(round);
        let newActions = [...actions];
        // Only add ante actions if includeBlinds is true AND we're not already in the ANTE round
        // to avoid double-counting
        if (includeBlinds && round !== TexasHoldemRound.ANTE) {
            const anteActions = this.getActionsForRound(TexasHoldemRound.ANTE);
            newActions.push(...anteActions);
        }
        const betManager = new BetManager(newActions);
        return betManager.getTotalBetsForPlayer(playerId);
    }

    /**
     * Gets the total pot amount
     */
    getPot(): bigint {
        const bets = this.getAllBets();
        let pot: bigint = 0n;

        for (const [_, value] of bets) {
            pot += value;
        }

        return pot;
    }

    /**
     * Calculates the rake amount for a given pot
     * Returns 0 if rake is not configured
     */
    private calculateRake(pot: bigint): bigint {
        // If no rake config, return 0
        if (!this._gameOptions.rake) {
            return 0n;
        }

        const { rakeFreeThreshold, rakePercentage, rakeCap } = this._gameOptions.rake;

        // If pot is below rake-free threshold, no rake
        if (pot < rakeFreeThreshold) {
            return 0n;
        }

        // Calculate rake as percentage of pot
        // rakePercentage is a whole number (e.g., 5 for 5%)
        const calculatedRake = (pot * BigInt(rakePercentage)) / 100n;

        // Apply cap if calculated rake exceeds it
        const rake = calculatedRake > rakeCap ? rakeCap : calculatedRake;

        return rake;
    }

    /**
     * Calculates side pots for all-in situations
     */
    private calculateSidePots(): void {
        // Placeholder for side pot calculation logic
        // This would handle multiple all-in players with different stack sizes
    }

    findWinners(cards: string[]): boolean {
        const players = this.getSeatedPlayers();

        if (players.length === 0) {
            return false;
        }

        // Check if we have enough community cards for evaluation (need 5 for Texas Hold'em)
        const communityCards = this.getCommunityCards();
        if (communityCards.length < 5) {
            // Use the actual community cards from _communityCards if available
            const actualCommunityCards = this._communityCards.length >= 5 ?
                this._communityCards.slice(0, 5) :
                this._communityCards2.slice(0, 5);

            const playerCards = players.map(p =>
                actualCommunityCards.concat(p.holeCards!)
            );

            const heroCards = cards.map(cardStr => SDKDeck.fromString(cardStr)).concat(actualCommunityCards);

            // Ensure we have exactly 7 cards for hand evaluation
            if (heroCards.length !== 7) {
                return false;
            }

            // Prepare all player hands for comparison
            const allPlayerHands = playerCards
                .filter(cards => cards.length === 7)
                .map(cards => cards.map(c => c.mnemonic));

            // Find the hero player in the current players list
            const heroHandStr = cards.join(',');
            let heroPlayerIndex = -1;

            for (let i = 0; i < players.length; i++) {
                const playerHandStr = players[i].holeCards?.map(c => c.mnemonic).join(',');
                if (playerHandStr === heroHandStr) {
                    heroPlayerIndex = i;
                    break;
                }
            }

            // If hero is one of the current players, just use that index
            if (heroPlayerIndex >= 0) {
                const showdownResult = PokerGameIntegration.exampleShowdown(allPlayerHands);
                return showdownResult.winners.includes(heroPlayerIndex);
            } else {
                // Hero is not currently in the game, compare as additional hand
                const heroHand = heroCards.map(c => c.mnemonic);
                const allHands = [...allPlayerHands, heroHand];
                const showdownResult = PokerGameIntegration.exampleShowdown(allHands);
                return showdownResult.winners.includes(allHands.length - 1);
            }
        }        // Convert strings to Card objects using Deck.fromString
        const playerCards = players.map(p =>
            communityCards.concat(p.holeCards!)
        );

        const heroCards = cards.map(cardStr => SDKDeck.fromString(cardStr)).concat(communityCards);

        // Ensure we have exactly 7 cards for hand evaluation
        if (heroCards.length !== 7) {
            return false;
        }

        const _heroEvaluation = PokerSolver.findBestHand(heroCards);

        // Evaluate all player hands - ensure each has exactly 7 cards
        const _playerEvaluations = playerCards
            .filter(cards => cards.length === 7)
            .map(cards => PokerSolver.findBestHand(cards));

        // Find winners using PokerGameIntegration
        const allPlayerHands = playerCards
            .filter(cards => cards.length === 7)
            .map(cards => cards.map(c => c.mnemonic));

        // Find the hero player in the current players list
        const heroHandStr = cards.join(',');
        let heroPlayerIndex = -1;

        LoggerFactory.getInstance().log(`Debug: Hero cards: ${heroHandStr}`, "debug");

        for (let i = 0; i < players.length; i++) {
            const playerHandStr = players[i].holeCards?.map(c => c.mnemonic).join(',');
            LoggerFactory.getInstance().log(`Debug: Player ${i} cards: ${playerHandStr}`, "debug");
            if (playerHandStr === heroHandStr) {
                heroPlayerIndex = i;
                break;
            }
        }

        LoggerFactory.getInstance().log(`Debug: Hero player index: ${heroPlayerIndex}`, "debug");

        // If hero is one of the current players, just use that index
        if (heroPlayerIndex >= 0) {
            const showdownResult = PokerGameIntegration.exampleShowdown(allPlayerHands);
            LoggerFactory.getInstance().log(`Debug: Showdown result: ${JSON.stringify(showdownResult.winners)}, checking index ${heroPlayerIndex}`, "debug");
            return showdownResult.winners.includes(heroPlayerIndex);
        } else {
            // Hero is not currently in the game, compare as additional hand
            const heroHand = heroCards.map(c => c.mnemonic);
            const allHands = [...allPlayerHands, heroHand];
            const showdownResult = PokerGameIntegration.exampleShowdown(allHands);
            return showdownResult.winners.includes(allHands.length - 1);
        }
    }

    /**
     * Calculates the winner(s) at showdown
     */
    private calculateWinner(): void {

        const livePlayers = this.findLivePlayers();

        // If only one player is active, they win the pot
        if (livePlayers.length === 1) {
            // Winner by default - no hand evaluation needed
            const totalPot = this.getPot();
            const rake = this.calculateRake(totalPot);
            const netPot = totalPot - rake;
            
            const _winner: Winner = {
                amount: netPot,
                cards: livePlayers[0].holeCards?.map(card => card.mnemonic),
                name: "Winner by default (others folded)",
                description: "Winner by default (others folded)"
            };

            this._winners = new Map<string, Winner>();
            this._winners.set(livePlayers[0].id, _winner);
            livePlayers[0].chips += netPot;
            
            // Allocate rake to owner if configured
            if (rake > 0n && this._gameOptions.owner) {
                const owner = this.getPlayer(this._gameOptions.owner);
                if (owner) {
                    owner.chips += rake;
                }
            }
            return;
        }

        // Set all in players to SHOWING
        livePlayers.filter(p => p.status === PlayerStatus.ALL_IN).map(p => {
            p.updateStatus(PlayerStatus.SHOWING);
        });

        // Calculate winners for multiple active players
        this._winners = new Map<string, Winner>();
        const showingPlayers = livePlayers.filter(p => this.getPlayerStatus(p.address) === PlayerStatus.SHOWING);
        const pot: bigint = this.getPot();
        const rake = this.calculateRake(pot);
        const netPot = pot - rake;

        // Check if we have enough community cards for proper evaluation
        const communityCards = this.getCommunityCards();
        if (communityCards.length < 5) {
            // When showdown happens early (like preflop all-in), we need all 5 community cards
            // Deal the remaining community cards for proper hand evaluation
            LoggerFactory.getInstance().log(`Dealing remaining community cards for showdown (currently have ${communityCards.length})`, "debug");

            // Use the actual community cards from _communityCards if available, fall back to _communityCards2  
            const actualCommunityCards = this._communityCards.length >= 5 ?
                this._communityCards.slice(0, 5) :
                this._communityCards2.slice(0, 5);

            // Use our PokerGameIntegration for showdown evaluation
            const playerHands = showingPlayers.map(p =>
                actualCommunityCards.concat(p.holeCards!).map(c => c.mnemonic)
            );

            const showdownResult = PokerGameIntegration.exampleShowdown(playerHands);
            const winnersCount = BigInt(showdownResult.winners.length);

            // Award prizes to winners
            for (let i = 0; i < showingPlayers.length; i++) {
                const player = showingPlayers[i];
                const result = showdownResult.results[i];

                if (result.isWinner) {
                    const winAmount = netPot / winnersCount;
                    const _winner: Winner = {
                        amount: winAmount,
                        cards: player.holeCards?.map(card => card.mnemonic),
                        name: result.handDescription,
                        description: result.handDescription
                    };

                    this._winners.set(player.id, _winner);
                    player.chips += winAmount;
                }
            }
            
            // Allocate rake to owner if configured
            if (rake > 0n && this._gameOptions.owner) {
                const owner = this.getPlayer(this._gameOptions.owner);
                if (owner) {
                    owner.chips += rake;
                }
            }
            return;
        }

        // Normal case: we have all 5 community cards
        // Use our PokerGameIntegration for showdown evaluation  
        const playerHands = showingPlayers.map(p =>
            communityCards.concat(p.holeCards!).map(c => c.mnemonic)
        );

        const showdownResult = PokerGameIntegration.exampleShowdown(playerHands);
        const winnersCount = BigInt(showdownResult.winners.length);

        // Award prizes to winners
        for (let i = 0; i < showingPlayers.length; i++) {
            const player = showingPlayers[i];
            const result = showdownResult.results[i];

            if (result.isWinner) {
                const winAmount = netPot / winnersCount;
                const _winner: Winner = {
                    amount: winAmount,
                    cards: player.holeCards?.map(card => card.mnemonic),
                    name: result.handDescription,
                    description: result.handDescription
                };
                player.chips += winAmount;
                this._winners.set(player.address, _winner);
            }
        }

        // Allocate rake to owner if configured
        if (rake > 0n && this._gameOptions.owner) {
            const owner = this.getPlayer(this._gameOptions.owner);
            if (owner) {
                owner.chips += rake;
            }
        }

        // Check all players, if they have no chips left, set them to SITTING_OUT
        const players: Player[] = this.getSeatedPlayers();
        if (this.type === GameType.CASH) {
            players.filter(p => p.chips === 0n).map(p => {
                p.updateStatus(PlayerStatus.SITTING_OUT);
            });
        }

        if (this.type === GameType.SIT_AND_GO || this.type === GameType.TOURNAMENT) {
            for (const player of players) {
                if (player.chips === 0n) {
                    // The player is now BUSTED after the pots awarded.
                    const place = this._gameOptions.minPlayers - this._results.length;

                    // Get payouts from the payout manager
                    const payoutManager = new PayoutManager(this._gameOptions.minBuyIn, players);
                    const payout = payoutManager.calculatePayout(place);

                    // Need to do transfer back to player here
                    LoggerFactory.getInstance().log(`Player ${player.address} is busted but has a payout of ${payout}. Transfer needed.`, "info");
                    this._results.push({ place, playerId: player.id, payout });

                    player.updateStatus(PlayerStatus.BUSTED);
                }
            }
        }
    }

    // ==================== SERIALIZATION METHODS ====================

    /**
     * Converts the game state to a DTO for serialization
     */
    toJson(_caller?: string): TexasHoldemStateDTO {
        // Create player DTOs
        const players: PlayerDTO[] = Array.from(this._playersMap.entries())
            .filter(([_, player]) => player !== null)
            .map(([seat, player]) => {
                const _player = player!;

                // Get player's last action
                let lastAction: ActionDTO | undefined;
                const turn = this.getPlayersLastAction(_player.address);

                if (turn) {
                    lastAction = {
                        playerId: turn.playerId,
                        seat: seat,
                        action: turn.action,
                        amount: (turn.amount ?? 0n).toString(),
                        round: this.currentRound,
                        index: turn.index,
                        timestamp: turn.timestamp
                    };
                }

                // Get legal actions for this player
                const legalActions: LegalActionDTO[] = this.getLegalActions(_player.address);

                // Handle hole cards visibility
                // 🎴 TEMPORARY: Always send all hole cards to everyone (for testing)
                // TODO: Restore privacy logic once game is working
                let holeCardsDto: string[] | undefined = undefined;
                if (_player.holeCards) {
                    holeCardsDto = _player.holeCards.map(card => card.mnemonic);
                }

                // OLD PRIVACY LOGIC (commented out for now):
                // if (
                //     (caller && _player.address.toLowerCase() === caller.toLowerCase()) ||
                //     caller === ethers.ZeroAddress ||
                //     _player.status === PlayerStatus.SHOWING
                // ) {
                //     if (_player.holeCards) {
                //         holeCardsDto = _player.holeCards.map(card => card.mnemonic);
                //     }
                // } else {
                //     if (_player.holeCards) {
                //         holeCardsDto = _player.holeCards.map(() => "??");
                //     }
                // }

                // Handle timeout
                if (this._autoExpire > 0 && _player.status === PlayerStatus.ACTIVE && this.expired(_player.address)) {
                    _player.updateStatus(PlayerStatus.SITTING_OUT);
                    _player.holeCards = undefined;
                }

                return {
                    address: _player.address,
                    seat: seat,
                    stack: _player.chips.toString(),
                    isSmallBlind: seat === this.smallBlindPosition,
                    isBigBlind: seat === this.bigBlindPosition,
                    isDealer: seat === this.dealerPosition,
                    holeCards: holeCardsDto,
                    status: _player.status,
                    lastAction: lastAction,
                    legalActions: legalActions,
                    sumOfBets: this.getPlayerTotalBets(_player.address, this.currentRound, true).toString(), // Include blinds in JSON output
                    timeout: 0,
                    signature: ethers.ZeroHash
                };
            });

        // Prepare winners array
        const winners: WinnerDTO[] = [];
        if (this._winners) {
            for (const [address, winner] of this._winners.entries()) {
                winners.push({
                    address: address,
                    amount: winner.amount.toString(),
                    cards: winner.cards,
                    name: winner.name,
                    description: winner.description
                });
            }
        }

        // Create game options DTO
        const gameOptions: GameOptionsDTO = {
            minBuyIn: this._gameOptions.minBuyIn.toString(),
            maxBuyIn: this._gameOptions.maxBuyIn.toString(),
            maxPlayers: this._gameOptions.maxPlayers,
            minPlayers: this._gameOptions.minPlayers,
            smallBlind: this.blindsManager.getBlinds().smallBlind.toString(),
            bigBlind: this.blindsManager.getBlinds().bigBlind.toString(),
            timeout: this._gameOptions.timeout,
            type: this.type,
            rake: this._gameOptions.rake ? {
                rakeFreeThreshold: this._gameOptions.rake.rakeFreeThreshold.toString(),
                rakePercentage: this._gameOptions.rake.rakePercentage,
                rakeCap: this._gameOptions.rake.rakeCap.toString()
            } : undefined,
            owner: this._gameOptions.owner
        };

        const nextPlayerToAct = this.findNextPlayerToActForRound(this.currentRound);

        // Return the complete state DTO
        const state: TexasHoldemStateDTO = {
            type: this.type, // Todo remove this duplication
            address: this._address,
            gameOptions: gameOptions,
            smallBlindPosition: this.smallBlindPosition,
            bigBlindPosition: this.bigBlindPosition,
            dealer: this.dealerPosition,
            players: players,
            communityCards: this._communityCards.map(card => card.mnemonic),
            deck: this._deck.toString(),
            pots: [this.getPot().toString()],
            lastActedSeat: this.lastActedSeat,
            actionCount: this._actionCount,
            handNumber: this.handNumber,
            nextToAct: nextPlayerToAct ? this.getPlayerSeatNumber(nextPlayerToAct.address) : 1,
            previousActions: this.getActionDTOs(),
            round: this.currentRound,
            winners: winners,
            results: this._results.map(r => ({ place: r.place, playerId: r.playerId, payout: r.payout.toString() })),
            signature: ethers.ZeroHash
        };

        return state;
    }

    /**
     * Creates a game instance from a JSON object
     */
    public static fromJson(json: Record<string, unknown>, gameOptions: GameOptions): TexasHoldemGame {
        const players = new Map<number, Player | null>();

        // Parse game options
        if (gameOptions) {
            gameOptions.minBuyIn = BigInt(gameOptions?.minBuyIn);
            gameOptions.maxBuyIn = BigInt(gameOptions?.maxBuyIn);
            gameOptions.maxPlayers = Number(gameOptions?.maxPlayers);
            gameOptions.minPlayers = Number(gameOptions?.minPlayers);
            gameOptions.smallBlind = BigInt(gameOptions?.smallBlind);
            gameOptions.bigBlind = BigInt(gameOptions?.bigBlind);
            gameOptions.timeout = gameOptions?.timeout ?? 30; // Default to 30 seconds if not provided
            gameOptions.type = gameOptions?.type;
            
            // Parse rake config if present
            if (gameOptions.rake) {
                gameOptions.rake = {
                    rakeFreeThreshold: BigInt(gameOptions.rake.rakeFreeThreshold),
                    rakePercentage: gameOptions.rake.rakePercentage,
                    rakeCap: BigInt(gameOptions.rake.rakeCap),
                    owner: gameOptions.rake.owner || gameOptions.owner || ""
                };
            }
            // Owner is already a string, no conversion needed
        }

        // Parse players
        if (json.players && Array.isArray(json.players) && json.players.length > 0) {
            json?.players.map((p: Record<string, unknown>) => {
                const stack: bigint = BigInt(p.stack as string | number | bigint);

                // Create hole cards if they exist in the JSON
                let holeCards: [Card, Card] | undefined = undefined;

                if (p.holeCards && Array.isArray(p.holeCards) && p.holeCards.length === 2) {
                    // Skip parsing if cards are obscured ("??") - this happens when UI sends back game state
                    // with opponent cards hidden
                    if (p.holeCards[0] !== "??" && p.holeCards[1] !== "??") {
                        try {
                            const card1 = Deck.fromString(p.holeCards[0] as string);
                            const card2 = Deck.fromString(p.holeCards[1] as string);
                            holeCards = [card1, card2] as [Card, Card];
                        } catch (e) {
                            LoggerFactory.getInstance().log(`Failed to parse hole cards: ${p.holeCards} - ${String(e)}`, "error");
                        }
                    }
                }

                const player: Player = new Player(p.address as string, p.lastAction as Turn | undefined, stack, holeCards, p.status as PlayerStatus);
                players.set(p.seat as number, player);
            });
        }

        const dealer = json.dealer as number || 1;
        if (!dealer || dealer < 1 || dealer > gameOptions.maxPlayers) {
            throw new Error("Invalid dealer position in game state.");
        }

        // Create winners array
        const winners: WinnerDTO[] = (json.winners as WinnerDTO[]) || [];

        const results: Result[] = (json.results as Record<string, unknown>[] | undefined)?.map((r: Record<string, unknown>) => ({
            place: r.place as number,
            playerId: r.playerId as string,
            payout: BigInt(r.payout as string | number | bigint) || 0n
        })) || [];

        // Create and return new game instance
        const response: TexasHoldemGame = new TexasHoldemGame(
            json.address as string,
            gameOptions,
            dealer,
            json.previousActions as ActionDTO[] | undefined,
            json.handNumber as number | undefined,
            json.actionCount as number | undefined,
            json.round as TexasHoldemRound,
            json.communityCards as string[],
            json.pots as bigint[],
            players,
            json.deck as string,
            winners,
            json.now ? (json.now as number) : Date.now(),
            undefined,
            results
        );
        return response;
    }
}

export default TexasHoldemGame;
