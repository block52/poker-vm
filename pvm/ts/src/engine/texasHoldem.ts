import {
    ActionDTO,
    Card,
    GameOptions,
    GameOptionsDTO,
    LegalActionDTO,
    NonPlayerActionType,
    PlayerActionType,
    PlayerDTO,
    PlayerStatus,
    Positions,
    TexasHoldemRound,
    TexasHoldemStateDTO,
    WinnerDTO
} from "@bitcoinbrisbane/block52";
import { Player } from "../models/player";
import { Deck } from "../models/deck";

// Import all action types
import BetAction from "./actions/betAction";
import BigBlindAction from "./actions/bigBlindAction";
import CallAction from "./actions/callAction";
import CheckAction from "./actions/checkAction";
import DealAction from "./actions/dealAction";
import FoldAction from "./actions/foldAction";
import JoinAction from "./actions/joinAction";
import LeaveAction from "./actions/leaveAction";
import MuckAction from "./actions/muckAction";
import RaiseAction from "./actions/raiseAction";
import ShowAction from "./actions/showAction";
import SmallBlindAction from "./actions/smallBlindAction";

// @ts-ignore
import PokerSolver from "pokersolver";
import { IAction, IPoker, IUpdate, Turn, TurnWithSeat } from "./types";
import { ethers } from "ethers";

type Winner = {
    amount: bigint;
    cards: string[] | undefined;
    name: string | undefined;
    description: string | undefined;
};

class TexasHoldemGame implements IPoker, IUpdate {
    // Private fields
    private readonly _update: IUpdate;
    private readonly _playersMap: Map<number, Player | null>;
    private readonly _rounds = new Map<TexasHoldemRound, TurnWithSeat[]>();
    private readonly _communityCards: Card[] = [];
    private readonly _actions: IAction[];
    private readonly _gameOptions: GameOptions;
    private readonly _address: string;

    private _lastActedSeat: number;
    private _deck: Deck;
    private _pots: [bigint] = [0n];
    private _sidePots = new Map<string, bigint>();
    private _winners = new Map<string, Winner>();
    private _currentRound: TexasHoldemRound;
    private _handNumber = 0;

    // Constructor
    constructor(
        address: string,
        gameOptions: GameOptions,
        private _positions: Positions,
        lastActedSeat: number,
        previousActions: ActionDTO[] = [],
        currentRound: TexasHoldemRound = TexasHoldemRound.ANTE,
        communityCards: string[] = [],
        pots: bigint[] = [0n],
        playerStates: Map<number, Player | null> = new Map(),
        deck: string = "",
        winners: WinnerDTO[] = [],
        private readonly _now: number = Date.now()
    ) {
        this._address = address;
        this._playersMap = new Map<number, Player | null>(playerStates);
        this._deck = new Deck(deck);
        this._currentRound = currentRound;
        this._gameOptions = gameOptions;
        this._lastActedSeat = lastActedSeat;

        // Initialize winners
        for (const winner of winners) {
            const _winner: Winner = {
                amount: BigInt(winner.amount),
                cards: winner.cards,
                name: winner.name,
                description: winner.description
            }
            this._winners.set(winner.address, _winner);
        }

        // Initialize community cards
        for (let i = 0; i < communityCards.length; i++) {
            const card: Card = Deck.fromString(communityCards[i]);
            this._communityCards.push(card);
        }

        // Initialize pots
        for (let i = 0; i < pots.length; i++) {
            this._pots[i] = BigInt(pots[i]);
        }

        // Initialize rounds map
        this._rounds.set(TexasHoldemRound.ANTE, []);

        // Load previous actions
        this.loadPreviousActions(previousActions);

        // Initialize update handler
        this._update = new (class implements IUpdate {
            constructor(public game: TexasHoldemGame) {}
            addAction(action: Turn): void {}
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
            new ShowAction(this, this._update)
        ];
    }

    // ==================== INITIALIZATION METHODS ====================

    /**
     * Loads previous actions when initializing the game state
     */
    private loadPreviousActions(previousActions: ActionDTO[]): void {
        for (const action of previousActions) {
            const timestamp = Date.now();
            // Create TurnWithSeat directly, preserving the original seat number
            const turnWithSeat: TurnWithSeat = {
                playerId: action.playerId,
                action: action.action,
                amount: action.amount ? BigInt(action.amount) : undefined,
                index: action.index,
                seat: action.seat,
                timestamp
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
     * Reinitializes the game state for a new hand
     */
    reInit(deck: string): void {
        // Reset all players
        for (const player of this.getSeatedPlayers()) {
            player.reinit();
        }

        // Rotate dealer position
        const nextToAct = this.findNextPlayerToAct(this.dealerPosition);
        if (nextToAct) {
            this._positions.dealer = this.getPlayerSeatNumber(nextToAct.address);   
        } else {
            this._positions.dealer = this.findNextEmptySeat();
        }

        // Reset game state
        this._rounds.clear();
        this._rounds.set(TexasHoldemRound.ANTE, []);
        this._lastActedSeat = this.dealerPosition;
        this._deck = new Deck(deck);
        this._pots = [0n];
        this._communityCards.length = 0;
        this._currentRound = TexasHoldemRound.ANTE;
        this._winners.clear();
        this._handNumber += 1;
    }

    // ==================== GAME STATE PROPERTIES ====================

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
        return this._lastActedSeat;
    }

    
    setLastActedSeat(seat: number): void {
        this._lastActedSeat = seat;
    }

    // Game configuration getters
    get minBuyIn(): bigint {
        return this._gameOptions.minBuyIn;
    }

    get maxBuyIn(): bigint {
        return this._gameOptions.maxBuyIn;
    }

    get maxPlayers(): number {
        return this._gameOptions.maxPlayers;
    }

    get bigBlind(): bigint {
        return this._gameOptions.bigBlind;
    }

    get smallBlind(): bigint {
        return this._gameOptions.smallBlind;
    }

    // Position getters
    get dealerPosition(): number {
        return this._positions.dealer ?? this.maxPlayers;
    }

    get bigBlindPosition(): number {
        return this.findBBPosition();
    }

    get smallBlindPosition(): number {
        return this.findSBPosition();
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
    private findActivePlayers(): Player[] {
        return Array.from(this._playersMap.values()).filter((player): player is Player => player !== null && player.status === PlayerStatus.ACTIVE);
    }

    /**
     * Finds players who are still in the hand (not folded)
     */
    private findLivePlayers(): Player[] {
        return Array.from(this._playersMap.values()).filter(
            (player): player is Player => player !== null && [PlayerStatus.SHOWING, PlayerStatus.ACTIVE, PlayerStatus.ALL_IN].includes(player.status)
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
        return -1;
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

    /**
     * Adds a player to the game at a specific seat
     */
    joinAtSeat(player: Player, seat: number): void {
        // Check if the player is already in the game
        if (this.exists(player.address)) {
            throw new Error("Player already joined.");
        }

        // Ensure the seat is valid
        if (seat === -1) {
            throw new Error("Table full.");
        }

        // Check buy-in limits
        if (player.chips < this.minBuyIn || player.chips > this.maxBuyIn) {
            throw new Error("Player does not have enough or too many chips to join.");
        }

        // Add player to the table
        this._playersMap.set(seat, player);
        player.updateStatus(PlayerStatus.ACTIVE);
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

        return this._now - lastAction.timestamp > this._now + 60 * 1000; // 60 seconds
    }

    // ==================== GAME FLOW METHODS ====================

    /**
     * Deals cards to all players
     */
    deal(): void {
        // Check minimum players
        if (this.getActivePlayerCount() < this._gameOptions.minPlayers) {
            throw new Error("Not enough active players");
        }

        // Validate current round
        if (this.currentRound !== TexasHoldemRound.ANTE) {
            throw new Error("Can only deal in preflop round.");
        }

        // Check if cards have already been dealt
        const anyPlayerHasCards = this.getSeatedPlayers().some(p => p.holeCards !== undefined);
        if (anyPlayerHasCards) {
            throw new Error("Cards have already been dealt for this hand.");
        }

        const players = this.getSeatedPlayers();

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
        return this.findNextPlayerToAct();
    }

    /**
     * Finds the small blind position based on dealer position
     */
    private findSBPosition(): number {
        const sb = this.findNextPlayerToAct(this.dealerPosition + 1); // Start scan from the next player after the dealer
        if (sb) {
            const seat = this.getPlayerSeatNumber(sb.address);
            return seat;
        }

        if (this.dealerPosition === this.maxPlayers) {
            return 1;
        }

        return this.dealerPosition + 1;
    }

    /**
     * Finds the big blind position based on dealer position
     */
    private findBBPosition(): number {
        const sb = this.findSBPosition();
        const start = sb === this.maxPlayers ? 1 : sb + 1; // Start scan from the next player after the small blind
        const bb = this.findNextPlayerToAct(start);

        if (bb) {
            return this.getPlayerSeatNumber(bb.address);
        }
        
        if (this.dealerPosition + 2 > this.maxPlayers) {
            return 2;
        }

        if (this.dealerPosition === this.maxPlayers) {
            return 2;
        }

        return 2;
    }

    /**
     * Finds the next player to act, starting from a specified position
     */
    private findNextPlayerToAct(start: number = this.lastActedSeat + 1): Player | undefined {
        if (start > this.maxPlayers) {
            start = 1;
        }

        // Search from start position to end
        for (let i = start; i <= this.maxPlayers; i++) {
            const player = this.getPlayerAtSeat(i);
            if (player && (player.status === PlayerStatus.ACTIVE || player.status === PlayerStatus.NOT_ACTED)) {
                return player;
            }
        }

        // Wrap around and search from beginning to start
        for (let i = 1; i < start; i++) {
            const player = this.getPlayerAtSeat(i);
            if (player && (player.status === PlayerStatus.ACTIVE || player.status === PlayerStatus.NOT_ACTED)) {
                return player;
            }
        }

        return undefined;
    }

    /**
     * Determines if the current betting round has ended
     */
    hasRoundEnded(round: TexasHoldemRound): boolean {
        const players = this.getSeatedPlayers();

        // Only consider players who are active and not all-in
        const notFoldedPlayers = players.filter(p => {
            const status = this.getPlayerStatus(p.address);
            return status !== PlayerStatus.FOLDED && status !== PlayerStatus.SITTING_OUT;
        });

        // If no active players left (all folded or all-in), the round ends
        if (notFoldedPlayers.length === 0) {
            return true;
        }

        // Get the live players for this round
        const livePlayers = this.findLivePlayers();

        // If all players are folded or all-in except one, advance to showdown
        if (livePlayers.length === 1 && this.currentRound !== TexasHoldemRound.ANTE) {
            this._currentRound = TexasHoldemRound.SHOWDOWN;
        }

        // Get actions for this round
        const actions = this._rounds.get(round);
        if (!actions) {
            return false;
        }

        // Special case for ANTE round
        if (round === TexasHoldemRound.ANTE) {
            const hasSmallBlind = actions.some(a => a.action === PlayerActionType.SMALL_BLIND);
            const hasBigBlind = actions.some(a => a.action === PlayerActionType.BIG_BLIND);
            const hasDealt = actions.some(a => a.action === NonPlayerActionType.DEAL);

            // Round is over when blinds are posted AND cards are dealt
            return hasSmallBlind && hasBigBlind && hasDealt;
        }

        // Special case for SHOWDOWN round
        if (round === TexasHoldemRound.SHOWDOWN) {
            // If everyone else has folded, the round is over
            if (livePlayers.length === 1) {
                this.calculateWinner();
                return true;
            }

            // If all players have shown their cards, the round is over
            const players = this.getSeatedPlayers();
            const showingPlayers = players.filter(p => this.getPlayerStatus(p.address) === PlayerStatus.SHOWING);
            if (showingPlayers.length === players.length) {
                this.calculateWinner();
                return true;
            }
        }

        // Check if cards have been dealt
        const hasDealt = actions.some(a => a.action === NonPlayerActionType.DEAL);
        const anyPlayerHasCards = this.getSeatedPlayers().some(p => p.holeCards !== undefined);

        // If cards dealt but no betting actions yet, round is not over
        const bettingActions = actions.filter(
            a => a.action !== PlayerActionType.SMALL_BLIND && a.action !== PlayerActionType.BIG_BLIND && a.action !== NonPlayerActionType.DEAL
        );

        if ((hasDealt || anyPlayerHasCards) && bettingActions.length === 0) {
            return false;
        }

        const largestBet = this.getLargestBet(round);

        // Find the last bet or raise action
        let lastBetOrRaiseIndex = -1;
        for (let i = actions.length - 1; i >= 0; i--) {
            if (actions[i].action === PlayerActionType.BET || actions[i].action === PlayerActionType.RAISE) {
                lastBetOrRaiseIndex = i;
                break;
            }
        }

        // Check that all remaining active players have acted and matched the highest bet
        for (const player of livePlayers) {
            // Get this player's actions in this round
            const playerActions = actions.filter(a => a.playerId === player.address);

            // If a player hasn't acted yet, round is not over
            if (playerActions.length === 0) {
                return false;
            }

            // Get the player's last action in this round
            const lastAction = playerActions[playerActions.length - 1];

            // Skip players who have checked, called, or folded as their final action
            if (lastAction.action === PlayerActionType.CALL || lastAction.action === PlayerActionType.CHECK || lastAction.action === PlayerActionType.FOLD) {
                // Check if they acted after the last bet/raise
                if (lastBetOrRaiseIndex >= 0) {
                    const playerLastActionIndex = actions.findIndex(
                        a => a.playerId === player.address && a.action === lastAction.action && a.index === lastAction.index
                    );

                    // If player acted before the last bet/raise, they still need to act
                    if (playerLastActionIndex < lastBetOrRaiseIndex) {
                        return false;
                    }
                }
                continue;
            }

            // If the player has posted blinds but hasn't acted in the betting round yet
            if (lastAction.action === PlayerActionType.SMALL_BLIND || lastAction.action === PlayerActionType.BIG_BLIND) {
                return false;
            }

            // Get the player's current bet amount
            const totalWagered = this.getPlayerTotalBets(player.address);

            // If the player has not matched the highest bet, round is not over
            if (totalWagered < largestBet) {
                return false;
            }

            // If the last action was a bet or raise, other players need to respond
            if (lastAction.action === PlayerActionType.BET || lastAction.action === PlayerActionType.RAISE) {
                const actionIndex = actions.findIndex(a => a.playerId === player.address && a.action === lastAction.action && a.index === lastAction.index);

                if (actionIndex >= 0) {
                    // Check if all other active players have acted after this bet/raise
                    for (const otherPlayer of livePlayers) {
                        if (otherPlayer.address === player.address) continue;

                        // Get this player's actions after the bet/raise
                        const otherPlayerActionsAfterBet = actions.filter(a => a.playerId === otherPlayer.address && actions.indexOf(a) > actionIndex);

                        // If no actions after the bet/raise, round is not over
                        if (otherPlayerActionsAfterBet.length === 0) {
                            return false;
                        }
                    }
                }
            }
        }

        // If we've made it here, all players have acted appropriately
        return true;
    }

    // ==================== ACTION HANDLING METHODS ====================

    /**
     * Returns the current turn index
     */
    getTurnIndex(): number {
        return this.getPreviousActions().length;
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
                    index: this.getTurnIndex()
                };
            } catch {
                return undefined;
            }
        };

        // Get all valid actions for this player
        const actions = this._actions.map(verifyAction).filter((a): a is LegalActionDTO => !!a);
        return actions;
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
    performAction(address: string, action: PlayerActionType | NonPlayerActionType, index: number, amount?: bigint, data?: any): void {
        // Check action index for replay protection
        const turnIndex = this.getTurnIndex();
        if (index !== turnIndex && action !== NonPlayerActionType.JOIN && action !== NonPlayerActionType.LEAVE && action !== PlayerActionType.SIT_OUT) {
            throw new Error("Invalid action index.");
        }

        // Convert amount to BigInt if provided
        const _amount = amount ? BigInt(amount) : 0n;

        // Handle non-player actions first
        switch (action) {
            case NonPlayerActionType.JOIN:
                const player = new Player(address, undefined, _amount, undefined, PlayerStatus.SITTING_OUT);
                new JoinAction(this, this._update).execute(player, index, _amount, data);
                return;
            case NonPlayerActionType.LEAVE:
                new LeaveAction(this, this._update).execute(this.getPlayer(address), index);
                return;
            case NonPlayerActionType.DEAL:
                new DealAction(this, this._update).execute(this.getPlayer(address), index);
                this.setNextRound();
                return;
        }

        // Verify player exists in the game
        if (!this.exists(address)) {
            throw new Error("Player not found.");
        }

        // Get player and seat information
        const player = this.getPlayer(address);
        const seat = this.getPlayerSeatNumber(address);

        // Execute the specific player action
        switch (action) {
            case PlayerActionType.SMALL_BLIND:
                new SmallBlindAction(this, this._update).execute(player, index, this.smallBlind);
                break;
            case PlayerActionType.BIG_BLIND:
                new BigBlindAction(this, this._update).execute(player, index, this.bigBlind);
                break;
            case PlayerActionType.FOLD:
                new FoldAction(this, this._update).execute(player, index);
                break;
            case PlayerActionType.CHECK:
                new CheckAction(this, this._update).execute(player, index, 0n);
                break;
            case PlayerActionType.BET:
                new BetAction(this, this._update).execute(player, index, _amount);
                break;
            case PlayerActionType.CALL:
                new CallAction(this, this._update).execute(player, index);
                break;
            case PlayerActionType.RAISE:
                new RaiseAction(this, this._update).execute(player, index, _amount);
                break;
            case PlayerActionType.MUCK:
                new MuckAction(this, this._update).execute(player, index, _amount);
                break;
            case PlayerActionType.SHOW:
                new ShowAction(this, this._update).execute(player, index, _amount);
                break;
            case PlayerActionType.SIT_OUT:
                player.updateStatus(PlayerStatus.SITTING_OUT);
                break;
            case PlayerActionType.SIT_IN:
                player.updateStatus(PlayerStatus.ACTIVE);
                break;
        }

        // Record the action in the player's history
        const timestamp = Date.now();
        player.addAction({ playerId: address, action, amount, index }, timestamp);

        // Update the last player to act
        this._lastActedSeat = seat;

        // Check if the round has ended and advance if needed
        if (this.hasRoundEnded(this.currentRound)) {
            this.nextRound();
        }
    }

    /**
     * Adds a player action to the game state
     */
    addAction(turn: Turn, round: TexasHoldemRound = this.currentRound): void {
        const seat = this.getPlayerSeatNumber(turn.playerId);
        const timestamp = Date.now();
        const turnWithSeat: TurnWithSeat = { ...turn, seat, timestamp };

        this.setAction(turnWithSeat, round);
    }

    /**
     * Adds a non-player action to the game state
     */
    addNonPlayerAction(turn: Turn, data?: string): void {
        // For LEAVE action, we still want to record it before the player is removed
        const isLeaveAction = turn.action === NonPlayerActionType.LEAVE;

        // Only check if player exists for non-LEAVE actions
        if (!isLeaveAction) {
            const playerExists = this.exists(turn.playerId);
            if (!playerExists) {
                console.log(`Skipping non-player action for player ${turn.playerId} who has left the game`);
                return;
            }
        }

        const timestamp = Date.now();
        const seat = data ? Number(data) : this.getPlayerSeatNumber(turn.playerId);
        const turnWithSeat: TurnWithSeat = { ...turn, seat, timestamp };

        this.setAction(turnWithSeat, this.currentRound);
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

        // If this is a LEAVE action, remove the player from the game
        if (turn.action === NonPlayerActionType.LEAVE) {
            console.log(`Removing player ${turn.playerId} from seat ${turn.seat}`);
            this._playersMap.delete(turn.seat);
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
        return this._rounds.get(round) || [];
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
     * Gets all bets for a specific round
     */
    getBets(round: TexasHoldemRound = this.currentRound): Map<string, bigint> {
        const bets = new Map<string, bigint>();
        const actions = this._rounds.get(round);

        if (!actions || actions.length === 0) {
            return bets;
        }

        for (const action of actions) {
            // Skip actions without an amount or JOIN actions
            if (action.amount === undefined || action.action === NonPlayerActionType.JOIN) {
                continue;
            }

            const currentTotal = bets.get(action.playerId) || 0n;
            bets.set(action.playerId, currentTotal + action.amount);
        }

        return bets;
    }

    /**
     * Gets a player's total bets for a specific round
     */
    getPlayerTotalBets(playerId: string, round: TexasHoldemRound = this.currentRound): bigint {
        const bets = this.getBets(round);
        return bets.get(playerId) ?? 0n;
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
     * Gets the largest bet in a round
     */
    private getLargestBet(round: TexasHoldemRound = this.currentRound): bigint {
        const bets = this.getBets(round);
        let highestBet: bigint = 0n;

        for (const [_, amount] of bets) {
            if (amount > highestBet) {
                highestBet = amount;
            }
        }

        return highestBet;
    }

    /**
     * Calculates side pots for all-in situations
     */
    private calculateSidePots(): void {
        // Placeholder for side pot calculation logic
        // This would handle multiple all-in players with different stack sizes
    }

    /**
     * Calculates the winner(s) at showdown
     */
    private calculateWinner(): void {
        const players = this.getSeatedPlayers();

        // Prepare hands for poker solver
        function toPokerSolverMnemonic(card: Card): string {
            return card.mnemonic.replace("10", "T");
        }

        const hands = new Map<string, any>(
            players.map(p => [p.id, PokerSolver.Hand.solve(this._communityCards.concat(p.holeCards!).map(toPokerSolverMnemonic))])
        );

        const activePlayers = this.findLivePlayers();

        // If only one player is active, they win the pot
        if (activePlayers.length === 1) {
            const _winner: Winner = {
                amount: this.getPot(),
                cards: activePlayers[0].holeCards?.map(card => card.mnemonic),
                name: undefined,
                description: undefined // Roll these back when description is available from PokerSolver
            };

            this._winners = new Map<string, Winner>();
            const winner = activePlayers[0];
            this._winners.set(winner.address, _winner);
            winner.chips += this.getPot();
            return;
        }

        // Calculate winners for multiple active players
        this._winners = new Map<string, Winner>();
        const showingPlayers = players.filter(p => this.getPlayerStatus(p.address) === PlayerStatus.SHOWING);
        const pot: bigint = this.getPot();

        const winningHands = PokerSolver.Hand.winners(showingPlayers.map(a => hands.get(a.id)));

        // Convert winners count to BigInt for division
        const winnersCount = BigInt(winningHands.length);

        for (const player of showingPlayers) {
            if (winningHands.includes(hands.get(player.id))) {
                const hand = hands.get(player.id);
                const _winner: Winner = {
                    amount: this.getPot(),
                    cards: activePlayers[0].holeCards?.map(card => card.mnemonic),
                    name: hand.name,
                    description: hand.description
                };

                const winAmount = pot / winnersCount;
                player.chips += winAmount;
                this._winners.set(player.address, _winner);
            }
        }
    }

    // ==================== SERIALIZATION METHODS ====================

    /**
     * Converts the game state to a DTO for serialization
     */
    toJson(caller?: string): TexasHoldemStateDTO {
        const nextPlayerToAct = this.findNextPlayerToAct();

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
                let holeCardsDto: string[] | undefined = undefined;
                if (
                    (caller && _player.address.toLowerCase() === caller.toLowerCase()) ||
                    caller === ethers.ZeroAddress ||
                    _player.status === PlayerStatus.SHOWING
                ) {
                    if (_player.holeCards) {
                        holeCardsDto = _player.holeCards.map(card => card.mnemonic);
                    }
                } else {
                    if (_player.holeCards) {
                        holeCardsDto = _player.holeCards.map(() => "??");
                    }
                }

                // Handle timeout
                if (_player.status === PlayerStatus.ACTIVE && this.expired(_player.address)) {
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
                    sumOfBets: this.getPlayerTotalBets(_player.address).toString(),
                    timeout: 0,
                    signature: ethers.ZeroHash
                };
            });

        // Prepare winners array
        const winners: WinnerDTO[] = [];
        if (this._winners) {
            for (const [address, amount] of this._winners.entries()) {
                winners.push({
                    address: address,
                    amount: amount.toString(),
                    cards: undefined,
                    name: undefined,
                    description: undefined // Roll these back when description is available from PokerSolver
                });
            }
        }

        // Create game options DTO
        const gameOptions: GameOptionsDTO = {
            minBuyIn: this._gameOptions.minBuyIn.toString(),
            maxBuyIn: this._gameOptions.maxBuyIn.toString(),
            maxPlayers: this._gameOptions.maxPlayers,
            minPlayers: this._gameOptions.minPlayers,
            smallBlind: this._gameOptions.smallBlind.toString(),
            bigBlind: this._gameOptions.bigBlind.toString(),
            timeout: this._gameOptions.timeout
        };

        // Return the complete state DTO
        return {
            type: "cash",
            address: this._address,
            gameOptions: gameOptions,
            smallBlindPosition: this.smallBlindPosition,
            bigBlindPosition: this.bigBlindPosition,
            dealer: this.dealerPosition,
            players: players,
            communityCards: this._communityCards.map(card => card.mnemonic),
            deck: this._deck.toString(),
            pots: [this.getPot().toString()],
            lastToAct: this._lastActedSeat,
            nextToAct: nextPlayerToAct ? this.getPlayerSeatNumber(nextPlayerToAct.address) : -1,
            previousActions: this.getActionDTOs(),
            round: this.currentRound,
            winners: winners,
            signature: ethers.ZeroHash
        };
    }

    /**
     * Creates a game instance from a JSON object
     */
    public static fromJson(json: any, gameOptions: GameOptions): TexasHoldemGame {
        const players = new Map<number, Player | null>();

        // Parse game options
        if (json?.gameOptions) {
            gameOptions.minBuyIn = BigInt(json.gameOptions?.minBuyIn);
            gameOptions.maxBuyIn = BigInt(json.gameOptions?.maxBuyIn);
            gameOptions.maxPlayers = Number(json.gameOptions?.maxPlayers);
            gameOptions.minPlayers = Number(json.gameOptions?.minPlayers);
            gameOptions.smallBlind = BigInt(json.gameOptions?.smallBlind);
            gameOptions.bigBlind = BigInt(json.gameOptions?.bigBlind);
        }

        // Parse players
        json?.players.map((p: any) => {
            const stack: bigint = BigInt(p.stack);

            // Create hole cards if they exist in the JSON
            let holeCards: [Card, Card] | undefined = undefined;

            if (p.holeCards && Array.isArray(p.holeCards) && p.holeCards.length === 2) {
                try {
                    const card1 = Deck.fromString(p.holeCards[0]);
                    const card2 = Deck.fromString(p.holeCards[1]);
                    holeCards = [card1, card2] as [Card, Card];
                } catch (e) {
                    console.error(`Failed to parse hole cards: ${p.holeCards}`, e);
                }
            }

            const player: Player = new Player(p.address, p.lastAction, stack, holeCards, p.status);
            players.set(p.seat, player);
        });

        // Create positions object
        const positions: Positions = {
            dealer: json.dealer,
            smallBlind: json.smallBlindPosition,
            bigBlind: json.bigBlindPosition
        };

        // Create winners array
        const winners: WinnerDTO[] = json.winners || [];

        // Create and return new game instance
        return new TexasHoldemGame(
            json.address,
            gameOptions,
            positions,
            json.lastToAct as number,
            json.previousActions,
            json.round,
            json.communityCards,
            json.pots,
            players,
            json.deck,
            winners,
            json.now ? json.now : Date.now()
        );
    }
}

export default TexasHoldemGame;
