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
    TexasHoldemRound,
    TexasHoldemStateDTO,
    WinnerDTO
} from "@bitcoinbrisbane/block52";
import { Player } from "../models/player";
import { Deck } from "../models/deck";
import BaseAction from "./actions/baseAction";
import BetAction from "./actions/betAction";
import BigBlindAction from "./actions/bigBlindAction";
import CallAction from "./actions/callAction";
import CheckAction from "./actions/checkAction";
import DealAction from "./actions/dealAction";
import FoldAction from "./actions/foldAction";
import RaiseAction from "./actions/raiseAction";
import SmallBlindAction from "./actions/smallBlindAction";
// @ts-ignore
import PokerSolver from "pokersolver";
import { IPoker, IUpdate, Turn, TurnWithSeat } from "./types";
import { ethers, N } from "ethers";

class TexasHoldemGame implements IPoker, IUpdate {
    private readonly _update: IUpdate;

    // Players should be a map of player to seat index
    private readonly _playersMap: Map<number, Player | null>;
    // private readonly _players: FixedCircularList<Player>;

    private _rounds = new Map<TexasHoldemRound, TurnWithSeat[]>();
    private _lastActedSeat: number;
    private _deck!: Deck;

    private _pot: bigint;
    private _sidePots!: Map<string, bigint>;
    private _winners?: Map<string, bigint>;

    private _bigBlindPosition: number;
    private _smallBlindPosition: number;
    private _actions: BaseAction[];
    private readonly _gameOptions: GameOptions;

    private seed: number[] = [];
    private readonly _communityCards: Card[] = [];
    private _handNumber: number = 0;
    private _turnIndex: number = 0;

    constructor(
        private readonly _address: string,
        private gameOptions: GameOptions,
        private _dealer: number,
        private _lastToAct: number,
        private previousActions: ActionDTO[] = [],
        private _currentRound: TexasHoldemRound = TexasHoldemRound.ANTE,
        private communityCards: string[],
        private currentPot: bigint = 0n, // todo: this can be removed
        playerStates: Map<number, Player | null>,
        deck?: string
    ) {
        this._playersMap = new Map<number, Player | null>(playerStates);

        if (deck) {
            this._deck = new Deck(deck);
        } else {
            this._deck = new Deck();

            // Create a seed number for the deck
            // this.seed = Array.from({ length: 52 }, () => crypto.randomInt(0, 1000000));
            this.seed = Array.from({ length: 52 }, () => Math.floor(1000000 * Math.random()));

            // Shuffle the deck
            // console.log("About to shuffle deck with seed array:", this.seed);
            this._deck.shuffle(this.seed);
        }

        // TODO: Make this a map
        for (let i = 0; i < communityCards.length; i++) {
            const card: Card = Deck.fromString(communityCards[i]);
            this._communityCards.push(card);
        }

        // this._players = new FixedCircularList<Player>(this._maxPlayers, null);

        this._pot = BigInt(currentPot);
        this._currentRound = _currentRound;
        this._gameOptions = gameOptions;

        this._smallBlindPosition = this._dealer === gameOptions.maxPlayers ? 1 : this._dealer + 1;
        this._bigBlindPosition = this._dealer === gameOptions.maxPlayers ? 2 : this._dealer + 2;
        this._dealer = _dealer === 0 ? this._gameOptions.maxPlayers : _dealer;

        this._rounds.set(TexasHoldemRound.ANTE, []);
        this._rounds.set(TexasHoldemRound.PREFLOP, []);
        this._lastActedSeat = _lastToAct; // Need to recalculate this
        
        // Initialize turnIndex to 0
        this._turnIndex = 0;

        // Process previous actions to set the correct turnIndex
        // This is crucial for proper synchronization when loading from JSON
        if (previousActions && previousActions.length > 0) {
            console.log(`Initializing from ${previousActions.length} previous actions`);
            
            // Get the highest index from previous actions
            let highestIndex = -1;
            for (const action of previousActions) {
                if (action.index > highestIndex) {
                    highestIndex = action.index;
                }
                
                const turn: Turn = {
                    playerId: action.playerId,
                    action: action.action,
                    amount: action.amount ? BigInt(action.amount) : undefined,
                    index: action.index
                };
                
                this.addAction(turn, action.round);
            }
            
            // Set turnIndex to next available index
            this._turnIndex = highestIndex + 1;
            console.log(`Initialized _turnIndex to ${this._turnIndex} based on previous action indices`);
        }

        this._update = new (class implements IUpdate {
            constructor(public game: TexasHoldemGame) { }
            addAction(action: Turn): void { }
        })(this);

        this._actions = [
            new DealAction(this, this._update),
            new SmallBlindAction(this, this._update),
            new BigBlindAction(this, this._update),
            new FoldAction(this, this._update),
            new CheckAction(this, this._update),
            new BetAction(this, this._update),
            new CallAction(this, this._update),
            new RaiseAction(this, this._update)
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

    turnIndex(): number {
        // Return the current value and THEN increment
        return this._turnIndex++;
    }

    // Returns the current turn index without incrementing it
    currentTurnIndex(): number {
        console.log(`[DEBUG] Getting currentTurnIndex: ${this._turnIndex}`);
        return this._turnIndex;
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

    shuffle(seed: number[] = []): void {
        this._deck.shuffle(seed);
    }

    deal(seed: number[] = []): void {
        // Check minimum players
        if (this.getActivePlayerCount() < this._gameOptions.minPlayers) throw new Error("Not enough active players");

        if (![TexasHoldemRound.ANTE, TexasHoldemRound.PREFLOP, TexasHoldemRound.SHOWDOWN].includes(this.currentRound)) 
            throw new Error("Hand currently in progress.");

        // Make sure small blind and big blind have been posted
        const preFlopActions = this._rounds.get(TexasHoldemRound.PREFLOP);
        if (!preFlopActions || preFlopActions.length < 2) {
            throw new Error("Blinds must be posted before dealing.");
        }

        const hasSmallBlind = preFlopActions.some(a => a.action === PlayerActionType.SMALL_BLIND);
        const hasBigBlind = preFlopActions.some(a => a.action === PlayerActionType.BIG_BLIND);

        if (!hasSmallBlind || !hasBigBlind) {
            throw new Error("Both small and big blinds must be posted before dealing.");
        }

        // Check if cards have already been dealt
        const hasDealt = preFlopActions.some(a => a.action === NonPlayerActionType.DEAL);
        const anyPlayerHasCards = Array.from(this._playersMap.values()).some(p => p !== null && p.holeCards !== undefined);

        if (hasDealt || anyPlayerHasCards) {
            throw new Error("Cards have already been dealt for this hand.");
        }

        // Reset the deck and shuffle
        this.shuffle(seed);

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

        console.log("Cards dealt successfully");
    }

    private join(address: string, chips: bigint) {
        const player = new Player(address, undefined, chips, undefined, PlayerStatus.SITTING_OUT);
        const seat = this.findNextSeat();
        this.joinAtSeat(player, seat);
    }

    private joinAtSeat(player: Player, seat: number) {
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
    }

    private incrementHandNumber(): void {
        this._handNumber++;
    }

    private incrementTurnIndex(): void {
        console.log(`[DEBUG] Incrementing _turnIndex from ${this._turnIndex} to ${this._turnIndex + 1}`);
        this._turnIndex++;
    }

    private leave(address: string): bigint {
        const player = this.getPlayer(address);
        const seat = this.getPlayerSeatNumber(address);

        // Check if player has folded
        if (player.status !== PlayerStatus.FOLDED && player.status !== PlayerStatus.SITTING_OUT) {
            throw new Error("Player must fold before leaving the table");
        }

        // Get their current stack before removing them
        const currentStack = player.chips;

        // Remove player from seat
        this._playersMap.set(seat, null);

        // Return their stack amount
        return currentStack;
    }

    getNextPlayerToAct(): Player | undefined {
        const player = this.findNextPlayerToAct();
        return player;
    }

    private findNextPlayerToAct(): Player | undefined {
        // Special case for ANTE round - first player to act is small blind
        if (this._currentRound === TexasHoldemRound.ANTE) {
            const anteActions = this._rounds.get(TexasHoldemRound.ANTE);
            const hasSmallBlindPosted = anteActions?.some(a => a.action === PlayerActionType.SMALL_BLIND);
            
            if (!hasSmallBlindPosted) {
                return this.getPlayerAtSeat(this._smallBlindPosition);
            }
            
            const hasBigBlindPosted = anteActions?.some(a => a.action === PlayerActionType.BIG_BLIND);
            if (!hasBigBlindPosted) {
                // After small blind posts, big blind player is next to act
                return this.getPlayerAtSeat(this._bigBlindPosition);
            }
            
            // After both blinds, small blind acts again for deal
            return this.getPlayerAtSeat(this._smallBlindPosition);
        }

        // Has the small blind posted?
        const preFlopActions = this._rounds.get(TexasHoldemRound.PREFLOP);
        const hasSmallBlindPosted = preFlopActions?.some(a => a.action === PlayerActionType.SMALL_BLIND);

        if (!hasSmallBlindPosted) {
            return this.getPlayerAtSeat(this._smallBlindPosition);
        }

        // Has the big blind posted?
        const hasBigBlindPosted = preFlopActions?.some(a => a.action === PlayerActionType.BIG_BLIND);
        if (!hasBigBlindPosted) {
            return this.getPlayerAtSeat(this._bigBlindPosition);
        }

        // Check if cards have been dealt
        const hasDealt = preFlopActions?.some(a => a.action === NonPlayerActionType.DEAL);
        const anyPlayerHasCards = Array.from(this._playersMap.values()).some(p => p !== null && p.holeCards !== undefined);

        // If blinds are posted but cards haven't been dealt yet,
        // then deal action is next - small blind player typically does this
        if (!hasDealt && !anyPlayerHasCards) {
            return this.getPlayerAtSeat(this._smallBlindPosition);
        }

        // If cards have been dealt, determine who acts first in the betting round
        if (anyPlayerHasCards) {
            // Check if there have been any betting actions yet
            const bettingActionsCount =
                preFlopActions?.filter(
                    a => a.action !== PlayerActionType.SMALL_BLIND && a.action !== PlayerActionType.BIG_BLIND && a.action !== NonPlayerActionType.DEAL
                ).length || 0;

            if (bettingActionsCount === 0) {
                // Count active players
                const activePlayerCount = this.getActivePlayerCount();

                if (activePlayerCount === 2) {
                    // In 2-player games, small blind acts first
                    return this.getPlayerAtSeat(this._smallBlindPosition);
                } else {
                    // In 3+ player games, player after big blind acts first
                    // Find the next active player after the big blind position
                    let nextSeat = this._bigBlindPosition + 1;
                    if (nextSeat > this._gameOptions.maxPlayers) {
                        nextSeat = 1;
                    }

                    // First look specifically for seat 3 (common case) for efficiency
                    if (nextSeat === 3) {
                        const player = this.getPlayerAtSeat(3);
                        if (player && player.status === PlayerStatus.ACTIVE) {
                            return player;
                        }
                    }

                    // Search for the next active player, starting from the seat after big blind
                    for (let i = 0; i < this._gameOptions.maxPlayers; i++) {
                        const seatToCheck = ((nextSeat + i - 1) % this._gameOptions.maxPlayers) + 1;

                        // Skip checking seat 3 again if we already did
                        if (seatToCheck === 3 && nextSeat === 3) continue;

                        const player = this.getPlayerAtSeat(seatToCheck);
                        if (player && player.status === PlayerStatus.ACTIVE) {
                            return player;
                        }
                    }

                    // If no active players found after big blind, return small blind
                    return this.getPlayerAtSeat(this._smallBlindPosition);
                }
            }
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
                    index: this.currentTurnIndex()
                }
            ];
        }

        const verifyAction = (action: BaseAction): LegalActionDTO | undefined => {
            try {
                const range = action.verify(player);
                return {
                    action: action.type,
                    min: range ? range.minAmount.toString() : "0",
                    max: range ? range.maxAmount.toString() : "0",
                    index: this.currentTurnIndex()
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

    getLastRoundAction(): TurnWithSeat | undefined {
        const round = this._currentRound; // or previous round?
        const actions = this._rounds.get(round);

        if (!actions || actions.length === 0) {
            return undefined;
        }

        return actions.at(-1);
    }

    getPlayersLastAction(address: string): Turn | undefined {
        const player = this.getPlayer(address);
        const status = this.getPlayerStatus(address);

        if (status === PlayerStatus.ACTIVE) return this.getPlayerActions(player).at(-1);
        if (status === PlayerStatus.ALL_IN) return { playerId: address, action: PlayerActionType.ALL_IN, index: 0 }; // Todo: fix this
        if (status === PlayerStatus.FOLDED) return { playerId: address, action: PlayerActionType.FOLD, index: 0 }; // Todo: fix this

        return undefined;
    }

    performAction(address: string, action: PlayerActionType | NonPlayerActionType, index: number, amount?: bigint, data?: any): void {
        console.log(`[DEBUG] performAction called: address=${address}, action=${action}, index=${index}, _turnIndex=${this._turnIndex}`);

        // Check if the provided index matches the current turn index (without incrementing)
        if (index !== this.currentTurnIndex()) {
            console.error(`[DEBUG] Invalid action index. Expected ${this.currentTurnIndex()}, got ${index}`);
            throw new Error("Invalid action index.");
        }

        // Store the addAction method in a variable so we can temporarily override it
        const originalAddAction = this.addAction.bind(this);
        
        // Override the addAction method to do nothing when called from the action classes
        this.addAction = (turn: Turn, round: TexasHoldemRound = this._currentRound) => {
            console.log(`[DEBUG] Skipping internal addAction call for ${turn.action}`);
            // Do nothing, we'll add the action ourselves at the end
        };

        try {
            // Handle non-player actions that don't require the player to exist
            if (action === NonPlayerActionType.JOIN) {
                console.log(`[DEBUG] Processing JOIN action with index ${index}`);
                this.join(address, amount!);
                // Restore the original addAction method
                this.addAction = originalAddAction;
                // Add the join action to history
                this.addAction({ playerId: address, action, amount, index }, this._currentRound);
                return; // Exit early, don't need further processing
            }
    
            if (action === NonPlayerActionType.LEAVE) {
                console.log(`[DEBUG] Processing LEAVE action with index ${index}`);
                this.leave(address);
                // Restore the original addAction method
                this.addAction = originalAddAction;
                // Add the leave action to history
                this.addAction({ playerId: address, action, amount, index }, this._currentRound);
                return; // Exit early, don't need further processing
            }
    
            // Check if player exists for all other actions
            if (!this.exists(address)) {
                throw new Error("Player not found.");
            }
    
            // Log the current player's legal actions for debugging
            const player = this.getPlayer(address);
            const legalActions = this.getLegalActions(address);
            console.log(`[DEBUG] Legal actions for ${address}: ${JSON.stringify(legalActions)}`);
    
            if (this.currentRound === TexasHoldemRound.ANTE) {
                if (action !== PlayerActionType.SMALL_BLIND && action !== PlayerActionType.BIG_BLIND) {
                    if (this.getActivePlayerCount() < this._gameOptions.minPlayers) {
                        throw new Error("Not enough players to start game.");
                    }
                }
            }
    
            const seat = this.getPlayerSeatNumber(address);
    
            // Process the action
            console.log(`[DEBUG] Processing action ${action} for player at seat ${seat} with index ${index}`);
            switch (action) {
                case NonPlayerActionType.DEAL:
                    this.deal(data);
                    // First verify the deal is valid via the DealAction
                    try {
                        new DealAction(this, this._update).execute(player, index);
    
                        // For 3+ player games, set the last acted seat to the big blind position
                        // so that the next player to act will be the one after the big blind
                        const activePlayerCount = this.getActivePlayerCount();
                        if (activePlayerCount > 2) {
                            console.log("Deal action: Setting last acted seat to big blind position:", this._bigBlindPosition);
                            this._lastActedSeat = this._bigBlindPosition;
                        } else {
                            // For 2-player games, set to dealer position so small blind acts next
                            console.log("Deal action: Setting last acted seat to dealer position:", this._dealer);
                            this._lastActedSeat = this._dealer;
                        }
                    } catch (error) {
                        console.error("Error performing deal action:", error);
                    }
                    break;
                // todo: ante
                case PlayerActionType.SMALL_BLIND:
                    console.log(`[DEBUG] Executing small blind action for ${address} with index ${index}`);
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
                    new CheckAction(this, this._update).execute(player, index);
                    break;
                case PlayerActionType.BET:
                    new BetAction(this, this._update).execute(player, index, amount);
                    break;
                case PlayerActionType.CALL:
                    new CallAction(this, this._update).execute(player, index);
                    break;
                case PlayerActionType.RAISE:
                    new RaiseAction(this, this._update).execute(player, index, amount);
                    break;
                default:
                    // do we need to roll back last acted seat?
                    break;
            }
    
            // Restore the original addAction method
            this.addAction = originalAddAction;
    
            // Update player's actions and the game state
            console.log(`[DEBUG] Updating player actions and game state for ${action}`);
            player.addAction({ playerId: address, action, amount, index });
            this._lastActedSeat = seat;
            this.addAction({ playerId: address, action, amount, index }, this._currentRound);
            
            if (this.hasRoundEnded(this._currentRound) === true) {
                // Special handling for transition from ANTE to PREFLOP
                // When we transition from ANTE to PREFLOP after small blind is posted,
                // copy the blind action to the PREFLOP round as well
                if (this._currentRound === TexasHoldemRound.ANTE && action === PlayerActionType.SMALL_BLIND) {
                    console.log(`[DEBUG] Transitioning from ANTE to PREFLOP, copying small blind action`);
                    // Make sure the PREFLOP round exists
                    if (!this._rounds.has(TexasHoldemRound.PREFLOP)) {
                        this._rounds.set(TexasHoldemRound.PREFLOP, []);
                    }
                    
                    // Get the current action with seat and timestamp
                    const anteActions = this._rounds.get(TexasHoldemRound.ANTE) || [];
                    const lastAction = anteActions[anteActions.length - 1];
                    
                    // Add it to the PREFLOP round as well without incrementing the turn index
                    const actions = this._rounds.get(TexasHoldemRound.PREFLOP)!;
                    actions.push(lastAction);
                }
                
                this.nextRound();
            }
        } catch (error) {
            // Make sure to restore the original addAction method even if there's an error
            this.addAction = originalAddAction;
            throw error;
        }
    }

    addAction(turn: Turn, round: TexasHoldemRound = this._currentRound): void {
        console.log(`[DEBUG] Adding action: ${turn.action} with index ${turn.index}, current _turnIndex: ${this._turnIndex}`);
        // We already validated the index in performAction, so no need to check again here
        // This prevents the double incrementing problem
        
        const seat = this.getPlayerSeatNumber(turn.playerId);
        const timestamp = Date.now();
        const turnWithSeat: TurnWithSeat = { ...turn, seat, timestamp };
        
        // Now explicitly increment the turn index once
        this.incrementTurnIndex();
        console.log(`[DEBUG] After incrementing, new _turnIndex: ${this._turnIndex}`);

        // Check if the round already exists in the map
        if (this._rounds.has(round)) {
            // Get the existing actions array
            const actions = this._rounds.get(round)!;
            // Push the new turn to it
            actions.push(turnWithSeat);
            this._rounds.set(round, actions);
        } else {
            // Create a new array with this turn as the first element
            this._rounds.set(round, [turnWithSeat]);
        }
    }

    getActionDTOs(): ActionDTO[] {
        const actions: ActionDTO[] = [];

        // Track non-player actions like JOIN, LEAVE that should be included
        // in previousActions even though they might not belong to a specific round
        const nonPlayerActions: TurnWithSeat[] = [];

        for (const [round, turns] of this._rounds) {
            for (const turn of turns) {
                // Handle JOIN and LEAVE actions by collecting them separately
                if (
                    turn.action === NonPlayerActionType.JOIN ||
                    turn.action === NonPlayerActionType.LEAVE
                ) {
                    nonPlayerActions.push(turn);
                    continue;
                }

                const action: ActionDTO = {
                    playerId: turn.playerId,
                    seat: turn.seat,
                    action: turn.action,
                    amount: turn.amount ? turn.amount.toString() : "",
                    round,
                    index: turn.index
                };

                actions.push(action);
            }
        }

        // Add non-player actions at the beginning of the array
        // since they usually happen before the round actions
        for (const turn of nonPlayerActions) {
            actions.unshift({
                playerId: turn.playerId,
                seat: turn.seat,
                action: turn.action,
                amount: turn.amount ? turn.amount.toString() : "",
                round: TexasHoldemRound.PREFLOP, // Non-player actions happen in PREFLOP
                index: turn.index
            });
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
                seat: this.getPlayerSeatNumber(turn.playerId),
                action: turn.action,
                amount: turn.amount ? turn.amount.toString() : "",
                round,
                index: turn.index
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

    getPlayerSeatNumber(address: string): number {
        if (!this.exists(address)) {
            throw new Error("Player not found.");
        }

        const normalizedAddress = address.toLowerCase();
        for (const [seat, player] of this._playersMap.entries()) {
            if (player?.address.toLowerCase() === normalizedAddress) {
                return seat;
            }
        }

        throw new Error("Player not found.");
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
            
            // Skip JOIN actions - they should not be counted in the pot
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

    private getActivePlayers(): Player[] {
        return Array.from(this._playersMap.values()).filter((player): player is Player => player !== null && player.status === PlayerStatus.ACTIVE);
    }

    getSeatedPlayers(): Player[] {
        return Array.from(this._playersMap.values()).filter((player): player is Player => player !== null);
    }

    findNextSeat(): number {
        const maxSeats = this._gameOptions.maxPlayers;

        // Iterate through all seat numbers to find next available (empty) seat
        for (let seatNumber = 1; seatNumber <= maxSeats; seatNumber++) {
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
            // Deal the flop (3 cards)
            this._communityCards.push(...this._deck.deal(3));
        }
        if (this._currentRound === TexasHoldemRound.FLOP || this._currentRound === TexasHoldemRound.TURN) {
            // Deal turn or river (1 card)
            this._communityCards.push(...this._deck.deal(1));
        }
        if (this._currentRound === TexasHoldemRound.RIVER) {
            // Next is showdown, calculate winner
            this.calculateWinner();
        }

        // Advance to next round
        this.setNextRound();
    }

    reInit(seed: number[]): void {
        if (!this._playersMap.size) throw new Error("No players in game.");
        if (this._currentRound !== TexasHoldemRound.ANTE && this._currentRound !== TexasHoldemRound.PREFLOP) 
            throw new Error("Hand currently in progress.");

        this._dealer = this._dealer === 9 ? 1 : this._dealer + 1;
        this._smallBlindPosition = this._dealer === 9 ? 1 : this._dealer + 1;
        this._bigBlindPosition = this._dealer === 9 ? 2 : this._dealer + 2;

        this._rounds.clear();
        this._rounds.set(TexasHoldemRound.ANTE, []);
        this._rounds.set(TexasHoldemRound.PREFLOP, []);

        this._lastActedSeat = 0;
        this._currentRound = TexasHoldemRound.ANTE; // Reset to ANTE round
        this._deck = new Deck();
        // this should come from another source
        this.seed = seed || Array.from({ length: 52 }, () => Math.floor(1000000 * Math.random()));
        this._deck.shuffle(this.seed);
        this._pot = 0n;
        this._communityCards.length = 0;
        this._winners?.clear();
        this._turnIndex = 0; // Reset the turn index to 0 when reinitializing the game

        this._handNumber += 1;
    }

    private calculateSidePots(): void {
        // const startingPot = this.getStartingPot();
        // const numActive = this.getSeatedPlayers().filter(p => this.getPlayerStatus(p.address) === PlayerStatus.ACTIVE).length;
        // TODO: ROLL BACK
        // // TODO: Check this will work in all cases when multiple side pots in same round
        // this._players
        //     .filter(p => this.getPlayerStatus(p.id) == PlayerStatus.ALL_IN && !this._sidePots.has(p.id))
        //     .forEach(p => this._sidePots.set(p.id, startingPot + this.getPlayerStake(p) * (1 + numActive)));
    }

    private calculateWinner(): void {
        const players = this.getSeatedPlayers();

        const hands = new Map<string, any>(
            players.map(p => [p.id, PokerSolver.Hand.solve(this._communityCards.concat(p.holeCards!).map(toPokerSolverMnemonic))])
        );

        const active = players.filter(p => this.getPlayerStatus(p.address) === PlayerStatus.ACTIVE);
        // const orderedPots = Array.from(this._sidePots.entries()).sort(([_k1, v1], [_k2, v2]) => v1 - v2);
        this._winners = new Map<string, bigint>();

        const pot: bigint = this.getPot();
        const winningHands = PokerSolver.Hand.winners(active.map(a => hands.get(a.id)));

        // Convert winningHands.length to BigInt to avoid type mismatch
        const winnersCount = BigInt(winningHands.length);

        for (const player of active) {
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

    hasRoundEnded(round: TexasHoldemRound): boolean {
        // Special case for ANTE round - it transitions to PREFLOP when small blind is posted
        if (round === TexasHoldemRound.ANTE) {
            const anteActions = this._rounds.get(TexasHoldemRound.ANTE);
            if (!anteActions || anteActions.length === 0) {
                return false;
            }
            
            // When small blind is posted, we transition to PREFLOP
            const hasSmallBlindPosted = anteActions.some(a => a.action === PlayerActionType.SMALL_BLIND);
            if (hasSmallBlindPosted) {
                return true;
            }
            
            return false;
        }

        const players = this.getSeatedPlayers();

        // Only consider players who are active and not all-in
        const activePlayers = players.filter(p => {
            const status = this.getPlayerStatus(p.address);
            return status !== PlayerStatus.FOLDED && status !== PlayerStatus.ALL_IN && status !== PlayerStatus.SITTING_OUT;
        });

        // If no active players left (all folded or all-in), the round ends
        if (activePlayers.length === 0) {
            return true;
        }

        // Get actions for this round
        const actions = this._rounds.get(round);
        if (!actions) {
            return false;
        }

        // Check if cards have been dealt, which is required before ending the round
        const hasDealt = actions.some(a => a.action === NonPlayerActionType.DEAL);
        const anyPlayerHasCards = Array.from(this._playersMap.values()).some(p => p !== null && p.holeCards !== undefined);

        // In preflop round, make sure cards have been dealt before we can end the round
        if (round === TexasHoldemRound.PREFLOP && !hasDealt && !anyPlayerHasCards) {
            return false;
        }

        // Check if there's betting action yet
        const bettingActions = actions.filter(
            a => a.action !== PlayerActionType.SMALL_BLIND && a.action !== PlayerActionType.BIG_BLIND && a.action !== NonPlayerActionType.DEAL
        );

        // If cards dealt but no betting actions yet, round is not over
        if ((hasDealt || anyPlayerHasCards) && bettingActions.length === 0) {
            return false;
        }

        const largestBet = this.getLargestBet(round);

        // Check that all remaining active players have acted and matched the highest bet
        for (const player of activePlayers) {
            // Get this player's actions in this round
            const playerActions = actions.filter(a => a.playerId === player.address);

            // Filter to just betting actions (not blinds or deal)
            const playerBettingActions = playerActions.filter(
                a => a.action !== PlayerActionType.SMALL_BLIND && a.action !== PlayerActionType.BIG_BLIND && a.action !== NonPlayerActionType.DEAL
            );

            // If no betting actions yet for this player after cards dealt, round not over
            if ((hasDealt || anyPlayerHasCards) && playerBettingActions.length === 0) {
                return false;
            }

            // If a player hasn't acted yet, round is not over
            if (playerActions.length === 0) {
                return false;
            }

            // Get the player's last action in this round
            const lastAction = playerActions[playerActions.length - 1];

            // Skip players who have checked or called
            if (lastAction.action === PlayerActionType.CALL || lastAction.action === PlayerActionType.CHECK) {
                continue;
            }

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
                // We need to check if this was the most recent betting action
                // If it was, then the round isn't over because others need to respond

                // A simple way to check: if this player was the last to act overall
                if (player.address === this.currentPlayerId) {
                    return false;
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
            default:
                return TexasHoldemRound.ANTE;
        }
    }

    private setNextRound(): void {
        this._currentRound = this.getNextRound();
    }

    public static fromJson(json: any, gameOptions: GameOptions): TexasHoldemGame {
        console.log(`[DEBUG] Creating TexasHoldemGame from JSON with ${json?.previousActions?.length || 0} previous actions`);
        
        const players = new Map<number, Player | null>();

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

        // Print the highest action index from previousActions
        if (json.previousActions && json.previousActions.length > 0) {
            const highestIndex = Math.max(...json.previousActions.map((a: any) => a.index));
            console.log(`[DEBUG] Highest action index in previousActions: ${highestIndex}, next index will be ${highestIndex + 1}`);
        } else {
            console.log(`[DEBUG] No previous actions, starting with index 0`);
        }

        return new TexasHoldemGame(
            json.address,
            gameOptions,
            json.dealer as number,
            json.lastToAct as number,
            json.previousActions,
            json.round, // todo: this should be the "currentround"
            json.communityCards,
            json.pots,
            players,
            json.deck
        );
    }

    public toJson(): TexasHoldemStateDTO {
        const players: PlayerDTO[] = Array.from(this._playersMap.entries()).map(([seat, player]) => {
            if (!player) {
                return {
                    address: ethers.ZeroAddress,
                    seat: seat,
                    stack: "",
                    isSmallBlind: false,
                    isBigBlind: false,
                    isDealer: false,
                    holeCards: undefined,
                    status: PlayerStatus.SITTING_OUT,
                    lastAction: undefined,
                    legalActions: [],
                    sumOfBets: "",
                    timeout: 0,
                    signature: ethers.ZeroHash
                };
            }

            let lastAction: ActionDTO | undefined;

            const turn = this.getPlayersLastAction(player.address);
            if (turn) {
                lastAction = {
                    playerId: turn.playerId,
                    seat: seat,
                    action: turn.action,
                    amount: (turn.amount ?? 0n).toString(),
                    round: this._currentRound, // todo: check this, it should be the current round but not always
                    index: turn.index
                };
            }

            const legalActions: LegalActionDTO[] = this.getLegalActions(player.address);
            console.log("Legal actions:", legalActions);

            // Ensure hole cards are properly included if they exist
            let holeCardsDto: string[] | undefined = undefined;
            if (player.holeCards) {
                holeCardsDto = player.holeCards.map(card => card.mnemonic);
            }

            return {
                address: player.address,
                seat: seat,
                stack: player.chips.toString(),
                isSmallBlind: seat === this._smallBlindPosition,
                isBigBlind: seat === this._bigBlindPosition,
                isDealer: seat === this._dealer,
                holeCards: holeCardsDto,
                status: player.status,
                lastAction: lastAction,
                legalActions: legalActions,
                sumOfBets: this.getPlayerTotalBets(player.address).toString(),
                timeout: 0,
                signature: ethers.ZeroHash
            };
        });

        const nextPlayerToAct = this.findNextPlayerToAct();
        const nextToAct = nextPlayerToAct ? this.getPlayerSeatNumber(nextPlayerToAct.address) : -1;

        const previousActions: ActionDTO[] = this.getActionDTOs();
        const winners: WinnerDTO[] = [];

        // If we're in showdown and winners haven't been calculated yet, calculate them now
        if (this._currentRound === TexasHoldemRound.SHOWDOWN && (!this._winners || this._winners.size === 0)) {
            this.calculateWinner();
        }

        // Populate winners array from _winners Map if in showdown
        if (this._currentRound === TexasHoldemRound.SHOWDOWN && this._winners) {
            for (const [address, amount] of this._winners.entries()) {
                winners.push({
                    address: address,
                    amount: Number(amount)
                });
            }
        }

        const pot = this.getPot();
        const deckAsString = this._deck.toString();
        const communityCards: string[] = [];
        for (let i = 0; i < this._communityCards.length; i++) {
            communityCards.push(this._communityCards[i].mnemonic);
        }

        const gameOptions: GameOptionsDTO = {
            minBuyIn: this._gameOptions.minBuyIn.toString(),
            maxBuyIn: this._gameOptions.maxBuyIn.toString(),
            maxPlayers: this._gameOptions.maxPlayers,
            minPlayers: this._gameOptions.minPlayers,
            smallBlind: this._gameOptions.smallBlind.toString(),
            bigBlind: this._gameOptions.bigBlind.toString(),
            timeout: this._gameOptions.timeout
        };

        return {
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
    }

    // Handle parsing transaction data that might come in different formats
    // This helps ensure backward compatibility with different formats
    static parseTransactionData(data: string): { action: string, index: number } {
        console.log(`[DEBUG] Parsing transaction data: ${data}`);
        
        // Check if it uses the new pipe format: "action|index"
        if (data.includes('|')) {
            const [action, indexStr] = data.split('|');
            return { 
                action, 
                index: parseInt(indexStr) 
            };
        }
        
        // Check if it uses the old dash format: "action-index"
        if (data.includes('-')) {
            // Extract the action and index from format like "post-small-blind-1"
            const parts = data.split('-');
            
            // If it's a multi-part action name like "post-small-blind"
            if (parts.length > 2) {
                // The last part is the index, join the rest as the action
                const index = parseInt(parts[parts.length - 1]);
                const action = parts.slice(0, parts.length - 1).join('-');
                return { action, index };
            } else {
                // Simple action-index format
                return { 
                    action: parts[0], 
                    index: parseInt(parts[1]) 
                };
            }
        }
        
        // If no separators found, assume it's just an action with no index
        return { action: data, index: 0 };
    }
}

export default TexasHoldemGame;
