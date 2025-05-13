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

class TexasHoldemGame implements IPoker, IUpdate {
    private readonly _update: IUpdate;

    // Players should be a map of player to seat index
    private readonly _playersMap: Map<number, Player | null>;
    // private readonly _players: FixedCircularList<Player>;

    private _rounds = new Map<TexasHoldemRound, TurnWithSeat[]>();
    private _lastActedSeat: number;
    private _deck!: Deck;

    private _pots: [bigint] = [0n];
    private _sidePots!: Map<string, bigint>;
    private _winners?: Map<string, bigint>;

    private _dealer: number;
    private _bigBlindPosition: number;
    private _smallBlindPosition: number;
    private _actions: IAction[];
    private readonly _gameOptions: GameOptions;

    private seed: number[] = [];
    private readonly _communityCards: Card[] = [];
    private _handNumber: number = 0;
    // private _turnIndex: number = 0;

    constructor(
        private readonly _address: string,
        private gameOptions: GameOptions,
        private positions: Positions,
        private _lastToAct: number,
        private previousActions: ActionDTO[] = [],
        private _currentRound: TexasHoldemRound = TexasHoldemRound.ANTE,
        private communityCards: string[],
        private pots: bigint[] = [0n],
        playerStates: Map<number, Player | null>,
        deck: string,
        winners: WinnerDTO[] = [],
        private readonly caller?: string,
        private readonly _now: number = Date.now()
    ) {
        this._playersMap = new Map<number, Player | null>(playerStates);
        this._deck = new Deck(deck);

        this._winners = new Map<string, bigint>();
        for (const winner of winners) {
            this._winners.set(winner.address, BigInt(winner.amount));
        }

        // TODO: Make this a map
        for (let i = 0; i < communityCards.length; i++) {
            const card: Card = Deck.fromString(communityCards[i]);
            this._communityCards.push(card);
        }

        // this._players = new FixedCircularList<Player>(this._maxPlayers, null);

        for (let i = 0; i < pots.length; i++) {
            this._pots[i] = BigInt(pots[i]);
        }

        this._currentRound = _currentRound;
        this._gameOptions = gameOptions;
        this._smallBlindPosition = this.positions.smallBlind ?? 1;
        this._bigBlindPosition = this.positions.bigBlind ?? 2;
        this._dealer = this.positions.dealer ?? 9;

        this._rounds.set(TexasHoldemRound.ANTE, []);
        this._lastActedSeat = _lastToAct; // Need to recalculate this

        for (const action of previousActions) {
            const timestamp = Date.now();
            // Create TurnWithSeat directly, preserving the original seat number
            const turnWithSeat: TurnWithSeat = {
                playerId: action.playerId,
                action: action.action,
                amount: action.amount ? BigInt(action.amount) : undefined,
                index: action.index,
                seat: action.seat, // Use the stored seat value from the DTO
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

            // Increment turn index
            // this._turnIndex = Math.max(this._turnIndex, action.index + 1);
        }

        this._update = new (class implements IUpdate {
            constructor(public game: TexasHoldemGame) {}
            addAction(action: Turn): void {}
        })(this);

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
       
        ];
    }

    get players() {
        return this._playersMap;
    }
    get bigBlind() {
        return this._gameOptions.bigBlind;
    }
    get smallBlind() {
        return this._gameOptions.smallBlind;
    }
    get bigBlindPosition() {
        return this._bigBlindPosition;
    }
    get smallBlindPosition() {
        return this._smallBlindPosition;
    }
    get dealerPosition() {
        return this._dealer;
    }
    get currentPlayerId() {
        const player = this.getPlayerAtSeat(this._lastActedSeat);
        return player?.address ?? ethers.ZeroAddress;
    }
    get currentRound() {
        return this._currentRound;
    }
    get pot() {
        return this.getPot();
    }
    get winners() {
        return this._winners;
    }
    get handNumber() {
        return this._handNumber;
    }

    // Add getters for buy-in limits
    get minBuyIn() {
        return this._gameOptions.minBuyIn;
    }

    get maxBuyIn() {
        return this._gameOptions.maxBuyIn;
    }

    // Add getter for max players
    get maxPlayers() {
        return this._gameOptions.maxPlayers;
    }

    // Returns the current turn index without incrementing it
    getTurnIndex(): number {
        // return this._turnIndex;
        return this.previousActions.length;
    }

    exists(playerId: string): boolean {
        const normalizedPlayerId = playerId.toLowerCase();
        for (const [seat, player] of this._playersMap.entries()) {
            if (player?.address.toLowerCase() === normalizedPlayerId) {
                return true;
            }
        }

        return false;
    }

    getPlayerCount() {
        const count = Array.from(this._playersMap.values()).filter((player): player is Player => player !== null).length;
        return count;
    }

    deal(): void {
        // Check minimum players
        if (this.getActivePlayerCount() < this._gameOptions.minPlayers) throw new Error("Not enough active players");

        // if (![TexasHoldemRound.PREFLOP, TexasHoldemRound.SHOWDOWN].includes(this.currentRound)) throw new Error("Hand currently in progress.");
        if (this._currentRound !== TexasHoldemRound.ANTE) throw new Error("Can only deal in preflop round.");

        // Check if cards have already been dealt
        const anyPlayerHasCards = Array.from(this._playersMap.values()).some(p => p !== null && p.holeCards !== undefined);

        if (anyPlayerHasCards) {
            throw new Error("Cards have already been dealt for this hand.");
        }

        // Deal 2 cards to each player
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

    private join(address: string, chips: bigint) {
        const player = new Player(address, undefined, chips, undefined, PlayerStatus.SITTING_OUT);
        const seat = this.findNextEmptySeat();
        this.joinAtSeat(player, seat);
    }

    joinAtSeat(player: Player, seat: number) {
        // Check if the player is already in the game
        if (this.exists(player.address)) {
            throw new Error("Player already joined.");
        }

        // ensure the seat is valid
        if (seat === -1) {
            console.log(`Table full. Current players: ${this.getPlayerCount()}, Max players: ${this._gameOptions.maxPlayers}`);
            throw new Error("Table full."); // This must be thrown
        }

        if (player.chips < this._gameOptions.minBuyIn || player.chips > this._gameOptions.maxBuyIn) {
            throw new Error("Player does not have enough or too many chips to join.");
        }

        this._playersMap.set(seat, player);

        // TODO: Need to consider the work flow here, but make active for now
        player.updateStatus(PlayerStatus.ACTIVE);

        const autoPostBlinds = false;
        // These should be done via the add action function
        if (autoPostBlinds) {
            // Auto join the first player
            if (this.getPlayerCount() === 1 && this.currentRound === TexasHoldemRound.PREFLOP) {
                // post small blind
                new SmallBlindAction(this, this._update).execute(player, 0, this._gameOptions.smallBlind);

                // This is the last player to act
                this._lastActedSeat = seat;

                // Add to bets to preflop round
                const turn: Turn = {
                    playerId: player.address,
                    action: PlayerActionType.SMALL_BLIND,
                    amount: this._gameOptions.smallBlind,
                    index: this.getTurnIndex()
                };

                player.addAction(turn, this._now);
                player.updateStatus(PlayerStatus.ACTIVE);
            }

            // Auto join the second player
            if (this.getPlayerCount() === 2 && this.currentRound === TexasHoldemRound.PREFLOP) {
                // post big blind
                new BigBlindAction(this, this._update).execute(player, 0, this._gameOptions.bigBlind);

                // This is the last player to act
                this._lastActedSeat = seat;

                // Add to bets to pre-flop round
                const turn: Turn = { playerId: player.address, action: PlayerActionType.BIG_BLIND, amount: this._gameOptions.bigBlind, index: this.getTurnIndex() };

                player.addAction(turn, this._now);
                player.updateStatus(PlayerStatus.ACTIVE);
            }
        }

        // Check if we haven't dealt
        if (autoPostBlinds) {
            if (this.getPlayerCount() === this._gameOptions.minPlayers && this.currentRound === TexasHoldemRound.PREFLOP) {
                this.deal();
            }
        }
    }

    private incrementTurnIndex(): void {
        // this._turnIndex++;
    }

    getNextPlayerToAct(): Player | undefined {
        const player = this.findNextPlayerToAct();
        return player;
    }

    private findNextPlayerToAct(): Player | undefined {
        // Has the small blind posted?
        const anteActions = this._rounds.get(TexasHoldemRound.ANTE);
        const hasSmallBlindPosted = anteActions?.some(a => a.action === PlayerActionType.SMALL_BLIND);

        if (!hasSmallBlindPosted) {
            return this.getPlayerAtSeat(this._smallBlindPosition);
        }

        // Has the big blind posted?
        const hasBigBlindPosted = anteActions?.some(a => a.action === PlayerActionType.BIG_BLIND);
        if (!hasBigBlindPosted) {
            return this.getPlayerAtSeat(this._bigBlindPosition);
        }

        // For subsequent actions in the round, find the next player after the last acted player
        let next = this._lastActedSeat + 1;

        if (next > this._gameOptions.maxPlayers) {
            next = 1;
        }

        // Search from current position to end
        for (let i = next; i <= this._gameOptions.maxPlayers; i++) {
            const player = this.getPlayerAtSeat(i);

            if (player && (player.status === PlayerStatus.ACTIVE || player.status === PlayerStatus.NOT_ACTED)) {
                return player;
            }
        }

        // Wrap around and search from beginning to current position
        for (let i = 1; i < next; i++) {
            const player = this.getPlayerAtSeat(i);

            if (player && (player.status === PlayerStatus.ACTIVE || player.status === PlayerStatus.NOT_ACTED)) {
                return player;
            }
        }

        return undefined;
    }

    // Should be get valid players actions
    getLegalActions(address: string): LegalActionDTO[] {
        const player = this.getPlayer(address);

        // Check if player is active
        const isActive = player.status === PlayerStatus.ACTIVE;
        if (!isActive) {
            return [];
        }

        const nextToAct = this.getNextPlayerToAct();

        // If it's not this player's turn, they can only fold if they are active
        if (nextToAct && nextToAct.address !== player.address) {
            // Even if it's not their turn, active players can fold
            return [
                {
                    action: PlayerActionType.FOLD,
                    min: "0",
                    max: "0",
                    index: this.getTurnIndex()
                }
            ];
        }

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
        const actions = this._actions.map(verifyAction).filter(a => a) as LegalActionDTO[];

        // Check if cards have been dealt already (any player has hole cards)
        const anyPlayerHasCards = Array.from(this._playersMap.values()).some(p => p !== null && p.holeCards !== undefined);

        // If cards have been dealt, remove the deal action
        if (anyPlayerHasCards) {
            return actions.filter(a => a.action !== NonPlayerActionType.DEAL);
        }

        return actions;
    }

    /*
     * Gets the last action taken in the current round
     * @returns The last action taken in the current round, or undefined if no actions exist
     */
    getLastRoundAction(): TurnWithSeat | undefined {
        const round = this._currentRound;
        const actions = this._rounds.get(round);

        if (!actions || actions.length === 0) {
            return undefined;
        }

        return actions.at(-1);
    }

    getPlayersLastAction(address: string): TurnWithSeat | undefined {
        const player = this.getPlayer(address);
        return this.getPlayerActions(player).at(-1);

        // if (status === PlayerStatus.ACTIVE) return this.getPlayerActions(player).at(-1);
        // if (status === PlayerStatus.ALL_IN) return { playerId: address, action: PlayerActionType.ALL_IN, index: 0 }; // Todo: fix this
        // if (status === PlayerStatus.FOLDED) return { playerId: address, action: PlayerActionType.FOLD, index: 0 }; // Todo: fix this

        // return undefined;
    }

    private getPlayerActions(player: Player, round: TexasHoldemRound = this._currentRound): TurnWithSeat[] {
        // Get the actions for the specified round
        const actions = this._rounds.get(round);

        // If no actions exist for this round, return empty array
        if (!actions) {
            return [];
        }

        // Filter the actions to only include those made by the specified player
        return actions.filter(action => action.playerId === player.address);
    }

    /**
     * Performs a poker action for a specific player
     *
     * This is the main entry point for all game actions and controls the game flow:
     * 1. Validates the action index to prevent replay attacks
     * 2. Handles non-player actions like JOIN, LEAVE, and DEAL
     * 3. Verifies the player exists in the game
     * 4. Executes the appropriate action via the corresponding Action class
     * 5. Updates the game state to reflect the action
     * 6. Checks if the round has ended and advances to the next round if needed
     *
     * @param address The player's address
     * @param action The action type to perform (bet, call, fold, etc.)
     * @param index The sequential action index to prevent replay attacks
     * @param amount Optional bet/raise amount if applicable
     * @param data Additional optional data for the action
     * @throws Error if the action cannot be performed
     */
    performAction(address: string, action: PlayerActionType | NonPlayerActionType, index: number, amount?: bigint, data?: any): void {
        // Check if the provided index matches the current turn index (without incrementing)
        const _turnIndex = this.getTurnIndex();
        if (index !== _turnIndex && action !== NonPlayerActionType.JOIN && action !== NonPlayerActionType.LEAVE) {
            // hack, to roll back
            throw new Error("Invalid action index.");
        }

        // Convert amount to BigInt if provided
        const _amount = amount ? BigInt(amount) : 0n;

        // Handle non-player actions first (JOIN, LEAVE, DEAL)
        switch (action) {
            case NonPlayerActionType.JOIN: {
                // Get seat number from data using a Regex
                const player = new Player(address, undefined, _amount, undefined, PlayerStatus.SITTING_OUT);
                new JoinAction(this, this._update).execute(player, index, _amount, data);
                
                // `execute` already logged the action & incremented the index
                return; // EARLY EXIT – nothing else to do for non-player action
            }

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

        // In ANTE round, only allow specific actions until minimum players joined
        if (this.currentRound === TexasHoldemRound.ANTE) {
            // Fix type error by checking whether action is in a set of allowed values
            const allowedActions = [
                PlayerActionType.SMALL_BLIND,
                PlayerActionType.BIG_BLIND,
                NonPlayerActionType.JOIN
            ];
            
            if (!allowedActions.includes(action as any)) {
                if (this.getActivePlayerCount() < this._gameOptions.minPlayers) {
                    throw new Error("Not enough players to start game.");
                }
            }
        }

        // Get player and seat information
        const player = this.getPlayer(address);
        const seat = this.getPlayerSeatNumber(address);

        // Execute the specific player action
        switch (action) {
            case PlayerActionType.SMALL_BLIND:
                new SmallBlindAction(this, this._update).execute(player, index, this._gameOptions.smallBlind);
                break;
            case PlayerActionType.BIG_BLIND:
                new BigBlindAction(this, this._update).execute(player, index, this._gameOptions.bigBlind);
                break;
            case PlayerActionType.FOLD:
                // Don't update player status before executing fold
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
            default:
                // do we need to roll back last acted seat?
                break;
        }

        // Record the action in the player's history
        const timestamp = Date.now();
        player.addAction({ playerId: address, action, amount, index }, timestamp);

        // Update the last player to act
        this._lastActedSeat = seat;

        // Check if the round has ended and advance to the next round if needed
        if (this.hasRoundEnded(this._currentRound) === true) {
            this.nextRound();
        }
    }

    addAction(turn: Turn, round: TexasHoldemRound = this._currentRound): void {
        // We already validated the index in performAction, so no need to check again here
        // This prevents the double incrementing problem

        const seat = this.getPlayerSeatNumber(turn.playerId);
        const timestamp = Date.now();
        const turnWithSeat: TurnWithSeat = { ...turn, seat, timestamp };

        // Set the action for the current round
        this.setAction(turnWithSeat, round);
    }

    addNonPlayerAction(turn: Turn, data?: string): void {
        // For LEAVE action, we still want to record it but then the player will be removed
        const isLeaveAction = turn.action === NonPlayerActionType.LEAVE;

        // Only check if player exists for non-LEAVE actions
        if (!isLeaveAction) {
            const playerExists = this.exists(turn.playerId);
            if (!playerExists) {
                console.log(`Skipping non-player action for player ${turn.playerId} who has left the game`);
                this.incrementTurnIndex(); // Still increment turn index to maintain sequence
                return;
            }
        }

        if (turn.action === NonPlayerActionType.JOIN) {
            this.incrementTurnIndex(); // Increment turn index for JOIN action
        }

        const timestamp = Date.now();
        // Always get the actual seat number for the player
        const seat = data ? Number(data) : this.getPlayerSeatNumber(turn.playerId);
        const turnWithSeat: TurnWithSeat = { ...turn, seat, timestamp };

        this.setAction(turnWithSeat, this._currentRound);
    }

    private setAction(turn: TurnWithSeat, round: TexasHoldemRound): void {
        // Check if the round already exists in the map
        if (this._rounds.has(round)) {
            // Get the existing actions array
            const actions = this._rounds.get(round)!;
            // Push the new turn to it
            actions.push(turn);
            this._rounds.set(round, actions);
        } else {
            // Create a new array with this turn as the first element
            this._rounds.set(round, [turn]);
        }

        // If this is a LEAVE action, remove the player from the game
        if (turn.action === NonPlayerActionType.LEAVE) {
            console.log(`Removing player ${turn.playerId} from seat ${turn.seat}`);
            this._playersMap.delete(turn.seat);
        }

        // Now explicitly increment the turn index once
        this.incrementTurnIndex(); // TODO: check if this is needed as we don't count joins and leave as actions howeer we do increment the turn indes for deal action  see issue 552
    }

    getActionDTOs(): ActionDTO[] {
        const actions: ActionDTO[] = [];

        for (const [round, turns] of this._rounds) {
            for (const turn of turns) {
                const action: ActionDTO = {
                    playerId: turn.playerId,
                    seat: turn.seat,
                    action: turn.action,
                    amount: turn.amount ? turn.amount.toString() : "",
                    round,
                    index: turn.index,
                    timestamp: turn.timestamp
                };

                actions.push(action);
            }
        }

        return actions;
    }

    getActionsForRound(round: TexasHoldemRound): ActionDTO[] {
        const actions: ActionDTO[] = [];
        const turns = this._rounds.get(round);

        if (!turns) {
            return actions;
        }

        for (const turn of turns) {
            const action: ActionDTO = {
                playerId: turn.playerId,
                seat: turn.seat,
                action: turn.action,
                amount: turn.amount ? turn.amount.toString() : "",
                round,
                index: turn.index,
                timestamp: turn.timestamp
            };

            actions.push(action);
        }

        return actions;
    }

    getPlayer(address: string): Player {
        if (!this.exists(address)) {
            throw new Error("Player not found.");
        }

        const normalizedAddress = address.toLowerCase();
        for (const [seat, player] of this._playersMap.entries()) {
            if (player?.address.toLowerCase() === normalizedAddress) {
                return player;
            }
        }

        throw new Error("Player not found.");
    }

    getPlayerAtSeat(seat: number): Player | undefined {
        const player = this._playersMap.get(seat);

        if (!player) {
            return undefined;
        }

        return player;
    }

    getPlayerSeatNumber(playerId: string): number {
        for (const [seat, player] of this._playersMap.entries()) {
            if (player && player.address === playerId) {
                return seat;
            }
        }

        // For actions in history that refer to players who have left,
        // return -1 instead of throwing an error
        return -1;
    }

    getPlayerStatus(address: string): PlayerStatus {
        const player = this.getPlayer(address);
        return player.status;
    }

    /**
     * Gets the number of active players in the game
     * @returns The number of players with status "active"
     */
    getActivePlayerCount(): number {
        const players = this.getSeatedPlayers();
        const activePlayers = players.filter(p => this.getPlayerStatus(p.address) === PlayerStatus.ACTIVE);
        return activePlayers.length;
    }

    getAllBets(): Map<string, bigint> {
        const bets = new Map<string, bigint>();

        // Get all rounds bets
        for (const round of this._rounds.keys()) {
            const roundBets = this.getBets(round);

            for (const [playerId, amount] of roundBets) {
                const currentTotal = bets.get(playerId) || 0n;
                bets.set(playerId, currentTotal + amount);
            }
        }

        return bets;
    }

    getBets(round: TexasHoldemRound = this._currentRound): Map<string, bigint> {
        const bets = new Map<string, bigint>();

        // Get the actions for the specified round
        const actions = this._rounds.get(round);

        if (!actions || actions.length === 0) {
            return bets; // Return empty map if no actions in this round
        }

        // Process each action in the round
        for (const action of actions) {
            // Skip actions without an amount
            if (action.amount === undefined) {
                continue;
            }

            // Skip JOIN actions when calculating bets for the pot
            if (action.action === NonPlayerActionType.JOIN) {
                continue;
            }

            // Get current total for this player
            const currentTotal = bets.get(action.playerId) || 0n;

            // Add the new amount to the player's total
            bets.set(action.playerId, currentTotal + action.amount);
        }

        return bets;
    }

    getPlayerTotalBets(playerId: string, round: TexasHoldemRound = this._currentRound): bigint {
        const bets = this.getBets(round);
        return bets.get(playerId) ?? 0n;
    }

    getPot(): bigint {
        // todo: check this
        const bets = this.getAllBets();
        let pot: bigint = 0n;

        for (let [key, value] of bets) {
            pot += value;
        }

        return pot;
    }

    private findActivePlayers(): Player[] {
        return Array.from(this._playersMap.values()).filter((player): player is Player => player !== null && player.status === PlayerStatus.ACTIVE);
    }

    private findLivePlayers(): Player[] {
        const livePlayers: Player[] = [];

        // Iterate through all players and check their status
        for (const player of this._playersMap.values()) {
            if (player) {
                const status = this.getPlayerStatus(player.address);
                if (status === PlayerStatus.SHOWING || status === PlayerStatus.ACTIVE || status === PlayerStatus.ALL_IN) {
                    livePlayers.push(player);
                }
            }
        }

        return livePlayers;
    }

    getSeatedPlayers(): Player[] {
        // Return all non-null player objects from the players map
        return Array.from(this._playersMap.values()).filter((player): player is Player => player !== null);
    }

    findNextEmptySeat(start: number = 1): number {
        const maxSeats = this._gameOptions.maxPlayers;

        // Iterate through all seat numbers to find next available (empty) seat
        for (let seatNumber = start; seatNumber <= maxSeats; seatNumber++) {
            // Check if seat is empty (null) or doesn't exist in the map
            if (!this._playersMap.has(seatNumber) || this._playersMap.get(seatNumber) === null) {
                return seatNumber; // return first available seat.
            }
        }

        // Do the other half
        for (let seatNumber = 1; seatNumber < start; seatNumber++) {
            // Check if seat is empty (null) or doesn't exist in the map
            if (!this._playersMap.has(seatNumber) || this._playersMap.get(seatNumber) === null) {
                return seatNumber; // return first available seat.
            }
        }

        // If no seats available, return -1 instead of throwing error
        // This allows `joinAtSeat` to handle full-table scenario.
        return -1;
    }

    // complete round maybe?
    private nextRound(): void {
        this.calculateSidePots();

        // Deal community cards based on the CURRENT round
        // before advancing to the next round
        if (this._currentRound === TexasHoldemRound.PREFLOP) {
            // Moving to FLOP - deal 3 community cards
            this._communityCards.push(...this._deck.deal(3));
        } else if (this._currentRound === TexasHoldemRound.FLOP) {
            // Moving to TURN - deal 1 card
            this._communityCards.push(...this._deck.deal(1));
        } else if (this._currentRound === TexasHoldemRound.TURN) {
            // Moving to RIVER - deal 1 card
            this._communityCards.push(...this._deck.deal(1));
        } else if (this._currentRound === TexasHoldemRound.RIVER) {
            // Moving to SHOWDOWN - calculate winner
            //this.calculateWinner();
        } else if (this._currentRound === TexasHoldemRound.SHOWDOWN) {
            // this.calculateWinner();
            // Moving to ANTE - reset the game
            // this.reInit(this._deck.toString());
        }

        // Advance to next round
        this.setNextRound();

        // Initialize the new round's action list if needed
        if (!this._rounds.has(this._currentRound)) {
            this._rounds.set(this._currentRound, []);
        }
    }

    reInit(deck: string): void {
        // if (!this._playersMap.size) throw new Error("No players in game.");
        // if (this._currentRound !== TexasHoldemRound.END) throw new Error("Hand currently in progress.");

        // Iterate through all players and reset their status
        for (const player of this.getSeatedPlayers()) {
            player.reinit();
        }

        // Cache the values
        const sb = this._smallBlindPosition;
        const bb = this._bigBlindPosition;

        const activePlayers = this.findActivePlayers();
        const activePlayerCount = activePlayers.length;

        // if (activePlayerCount < this._gameOptions.minPlayers) {
        //     throw new Error("Not enough active players to reinitialize the game.");
        // }

        // Heads up
        if (activePlayerCount === 2) {
            // Swap the small blind and big blind positions
            this._smallBlindPosition = bb;
            this._bigBlindPosition = sb;
            this._dealer = sb;
        }

        if (activePlayerCount > 2) {
            for (let i = sb; i <= this._gameOptions.maxPlayers; i++) {
                const player = this.getPlayerAtSeat(i);
                if (player && player.status !== PlayerStatus.SITTING_OUT) {
                    this._smallBlindPosition = i;
                    break;
                }
            }

            for (let i = bb; i <= this._gameOptions.maxPlayers; i++) {
                const player = this.getPlayerAtSeat(i);
                if (player && player.status !== PlayerStatus.SITTING_OUT) {
                    this._bigBlindPosition = i;
                    break;
                }
            }
        }

        this.previousActions.length = 0;

        this._rounds.clear();
        this._rounds.set(TexasHoldemRound.ANTE, []);

        this._lastActedSeat = this._dealer;
        this._deck = new Deck(deck);
        this._pots = [0n];
        this._communityCards.length = 0;
        this._currentRound = TexasHoldemRound.ANTE;
        this._winners?.clear();

        this._handNumber += 1;
    }

    private calculateSidePots(): void {
        // const startingPot = this.getStartingPot();
        // const numActive = this.getSeatedPlayers().filter(p => this.getPlayerStatus(p.address) === PlayerStatus.ACTIVE).length;
        // TODO: ROLL BACK
        // // TODO: Check this will work in all cases when multiple side pots in same round
        // this._players
        //     .filter(p => this.getPlayerStatus(p) == PlayerStatus.ALL_IN && !this._sidePots.has(p.id))
        //     .forEach(p => this._sidePots.set(p.id, startingPot + this.getPlayerStake(p) * (1 + numActive)));
    }

    private calculateWinner(): void {
        const players = this.getSeatedPlayers();

        const hands = new Map<string, any>(
            players.map(p => [p.id, PokerSolver.Hand.solve(this._communityCards.concat(p.holeCards!).map(toPokerSolverMnemonic))])
        );

        const activePlayers = this.findLivePlayers();

        // If only one player is active, they win the pot
        if (activePlayers.length === 1) {
            this._winners = new Map<string, bigint>();
            const winner = activePlayers[0];
            this._winners.set(winner.address, this.getPot());
            winner.chips += this.getPot();
            return;
        }

        this._winners = new Map<string, bigint>();
        const showingPlayers = players.filter(p => this.getPlayerStatus(p.address) === PlayerStatus.SHOWING);
        // const orderedPots = Array.from(this._sidePots.entries()).sort(([_k1, v1], [_k2, v2]) => v1 - v2);

        const pot: bigint = this.getPot();
        const winningHands = PokerSolver.Hand.winners(showingPlayers.map(a => hands.get(a.id)));

        // Convert winningHands.length to BigInt to avoid type mismatch
        const winnersCount = BigInt(winningHands.length);

        for (const player of showingPlayers) {
            if (winningHands.includes(hands.get(player.id))) {
                // Use BigInt division with the converted count
                const winAmount = pot / winnersCount;
                player.chips += winAmount;
                this._winners.set(player.address, winAmount);
            }
        }

        // let winningPlayers = this._players.filter(p => winningHands.includes(hands.get(p.id)));

        // while (orderedPots.length) {
        //     const [playerId, sidePot] = orderedPots[0];
        //     // const remainder: BigInt = pot - sidePot;
        //     // winningPlayers.forEach(p => update(p, remainder / winningPlayers.length, this._winners!));
        //     // winningHands = PokerSolver.Hand.winners(winningHands.concat(hands.get(playerId)));
        //     // winningPlayers = this._players.filter(p => winningHands.includes(hands.get(p.id)));
        //     // pot = sidePot;
        //     // orderedPots.shift();
        // }

        // winningPlayers.forEach(p => update(p, pot / winningPlayers.length, this._winners!));

        // function update(player: Player, portion: bigint, winners: Map<string, bigint>) {
        //     // player.chips += portion;
        //     // winners.set(player.id, (winners.get(player.id) ?? 0) + portion);
        // }

        function toPokerSolverMnemonic(card: Card) {
            return card.mnemonic.replace("10", "T");
        }
    }

    /**
     * Determines if the current betting round has ended
     *
     * A round ends when all of these conditions are met:
     * 1. For ANTE round: small blind, big blind are posted AND cards are dealt
     * 2. For betting rounds: all non-folded, non-all-in players have acted
     * 3. All active players have either matched the highest bet or folded
     * 4. The last player to raise has been called by all remaining players
     *
     * Edge cases handled:
     * - If all players are folded or all-in, the round ends immediately
     * - Players who folded or are all-in don't need to act again
     * - Players must act after a bet/raise made after their last action
     *
     * @param round The round to check
     * @returns True if the round has ended, false otherwise
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
            // Not sure if we ever reach this point
            return true;
        }

        // Get the live players for this round
        const livePlayers = this.findLivePlayers();

        // If all players are folded or all-in, the round ends, or if only one player is left to act
        if (livePlayers.length === 1 && this.currentRound !== TexasHoldemRound.ANTE) {
            // Set the round to SHOWDOWN
            this._currentRound = TexasHoldemRound.SHOWDOWN;
        }

        // Get actions for this round
        const actions = this._rounds.get(round);
        if (!actions) {
            return false;
        }

        // Special case for ANTE round: need small blind, big blind, and deal
        if (round === TexasHoldemRound.ANTE) {
            const hasSmallBlind = actions.some(a => a.action === PlayerActionType.SMALL_BLIND);
            const hasBigBlind = actions.some(a => a.action === PlayerActionType.BIG_BLIND);
            const hasDealt = actions.some(a => a.action === NonPlayerActionType.DEAL);

            // Round is not over if blinds haven't been posted
            if (!hasSmallBlind || !hasBigBlind) {
                return false;
            }

            // ANTE round is only over when blinds are posted AND cards are dealt
            if (!hasDealt) {
                return false;
            }

            return true; // Round over after blinds are posted and cards are dealt
        }

        if (round === TexasHoldemRound.SHOWDOWN) {
            // If everyone else has folded, the round is over and payout the winner
            const livePlayers = this.findLivePlayers();
            if (livePlayers.length === 1) {
                this.calculateWinner();
                return true; // Round is over if only one player is active
            }

            const players = this.getSeatedPlayers();
            const showingPlayers = players.filter(p => this.getPlayerStatus(p.address) === PlayerStatus.SHOWING);
            if (showingPlayers.length === players.length) {
                this.calculateWinner();
                return true; // Round is over if only one player is active
            }
        }

        // Check if cards have been dealt, which is required before ending the round
        const hasDealt = actions.some(a => a.action === NonPlayerActionType.DEAL);
        const anyPlayerHasCards = Array.from(this._playersMap.values()).some(p => p !== null && p.holeCards !== undefined);

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
                // For these players, check if they acted AFTER the last bet/raise
                if (lastBetOrRaiseIndex >= 0) {
                    // Find the index of this player's last action
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
                // There is still action to be had
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
                // Check if all other active players have acted after this bet/raise
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

    private getLargestBet(round: TexasHoldemRound = this._currentRound): bigint {
        // Get the highest bet amount for the current round
        const bets = this.getBets(round);
        let highestBet: bigint = 0n;
        for (const [_, amount] of bets) {
            if (amount > highestBet) {
                highestBet = amount;
            }
        }

        return highestBet;
    }

    private getNextRound(): TexasHoldemRound {
        switch (this._currentRound) {
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

    private setNextRound(): void {
        this._currentRound = this.getNextRound();
    }

    private expired(address: string): boolean {
        const nextToAct = this.findNextPlayerToAct();
        if (!nextToAct || nextToAct.address !== address) {
            return false;
        }

        const lastAction = this.getPlayersLastAction(address);
        if (!lastAction) {
            return false;
        }
        const expired = this._now - lastAction.timestamp > this._now + 60 * 1000; // 60 seconds
        return expired;
    }

    public static fromJson(json: any, gameOptions: GameOptions): TexasHoldemGame {
        const players = new Map<number, Player | null>();

        if (json?.gameOptions) {
            gameOptions.minBuyIn = BigInt(json.gameOptions?.minBuyIn);
            gameOptions.maxBuyIn = BigInt(json.gameOptions?.maxBuyIn);
            gameOptions.maxPlayers = Number(json.gameOptions?.maxPlayers);
            gameOptions.minPlayers = Number(json.gameOptions?.minPlayers);
            gameOptions.smallBlind = BigInt(json.gameOptions?.smallBlind);
            gameOptions.bigBlind = BigInt(json.gameOptions?.bigBlind);
        }

        json?.players.map((p: any) => {
            const stack: bigint = BigInt(p.stack);

            // Create hole cards if they exist in the JSON
            let holeCards: [Card, Card] | undefined = undefined;

            if (p.holeCards && Array.isArray(p.holeCards) && p.holeCards.length === 2) {
                try {
                    // Use Deck.fromString to create Card objects
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

        const positions: Positions = {
            dealer: json.dealer,
            smallBlind: json.smallBlindPosition,
            bigBlind: json.bigBlindPosition
        };

        return new TexasHoldemGame(
            json.address,
            gameOptions,
            positions,
            json.lastToAct as number,
            json.previousActions,
            json.round, // todo: this should be the "current round"
            json.communityCards,
            json.pots,
            players,
            json.deck,
            json.winners,
            undefined,
            json.now ? json.now : Date.now(),
        );
    }

    public toJson(caller?: string): TexasHoldemStateDTO {

        const nextPlayerToAct = this.findNextPlayerToAct();

        // Create an array of player DTOs, filtering out any empty seats or removed players
        const players: PlayerDTO[] = Array.from(this._playersMap.entries())
            .filter(([_, player]) => player !== null) // Filter out null players (removed/empty seats)
            .map(([seat, player]) => {
                // After filtering, we know player is not null



                const _player: Player = player!;


                let lastAction: ActionDTO | undefined;
                const turn = this.getPlayersLastAction(_player.address);

                if (turn) {
                    lastAction = {
                        playerId: turn.playerId,
                        seat: seat,
                        action: turn.action,
                        amount: (turn.amount ?? 0n).toString(),
                        round: this._currentRound,
                        index: turn.index,
                        timestamp: turn.timestamp
                    };
                }

                const legalActions: LegalActionDTO[] = this.getLegalActions(_player.address);
                console.log("Legal actions:", legalActions);

                // Ensure hole cards are properly included if they exist
                let holeCardsDto: string[] | undefined = undefined;
                if (caller && _player.address.toLowerCase() === caller.toLowerCase() ||
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

                // If the next player has expired, set status to SITTING_OUT and remove hole cards
                if (_player.status === PlayerStatus.ACTIVE && this.expired(_player.address)) {
                    _player.updateStatus(PlayerStatus.SITTING_OUT);
                    _player.holeCards = undefined;
                }

                const dto: PlayerDTO = {
                    address: _player.address,
                    seat: seat,
                    stack: _player.chips.toString(),
                    isSmallBlind: seat === this._smallBlindPosition,
                    isBigBlind: seat === this._bigBlindPosition,
                    isDealer: seat === this._dealer,
                    holeCards: holeCardsDto,
                    status: _player.status,
                    lastAction: lastAction,
                    legalActions: legalActions,
                    sumOfBets: this.getPlayerTotalBets(_player.address).toString(),
                    timeout: 0,
                    signature: ethers.ZeroHash
                };

                return dto;
            });

        
        const nextToAct = nextPlayerToAct ? this.getPlayerSeatNumber(nextPlayerToAct.address) : -1;
        const previousActions: ActionDTO[] = this.getActionDTOs();
        const winners: WinnerDTO[] = [];

        // Populate winners array from _winners Map if in showdown
        if (this._winners) {
            for (const [address, amount] of this._winners.entries()) {
                winners.push({
                    address: address,
                    amount: Number(amount)
                });
            }
        }

        const pot = this.getPot();
        const deckAsString = this._deck.toString();

        // Do this as a map
        const communityCards: string[] = this._communityCards.map(card => card.mnemonic);

        const gameOptions: GameOptionsDTO = {
            minBuyIn: this._gameOptions.minBuyIn.toString(),
            maxBuyIn: this._gameOptions.maxBuyIn.toString(),
            maxPlayers: this._gameOptions.maxPlayers,
            minPlayers: this._gameOptions.minPlayers,
            smallBlind: this._gameOptions.smallBlind.toString(),
            bigBlind: this._gameOptions.bigBlind.toString(),
            timeout: this._gameOptions.timeout
        };

        const state: TexasHoldemStateDTO = {
            type: "cash",
            address: this._address,
            gameOptions: gameOptions,
            smallBlindPosition: this._smallBlindPosition,
            bigBlindPosition: this._bigBlindPosition,
            dealer: this._dealer,
            players: players,
            communityCards: communityCards,
            deck: deckAsString,
            pots: [pot.toString()],
            lastToAct: this._lastActedSeat,
            nextToAct: nextToAct, // Show the caller the next player to act, but save the last to act
            previousActions: previousActions,
            round: this._currentRound,
            winners: winners,
            signature: ethers.ZeroHash
        };

        return state;
    }
}

export default TexasHoldemGame;
