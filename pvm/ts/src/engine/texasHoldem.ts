import {
    ActionDTO,
    LegalActionDTO,
    PlayerActionType,
    PlayerDTO,
    PlayerStatus,
    TexasHoldemRound,
    TexasHoldemStateDTO,
    WinnerDTO,
    Card
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
import { IPoker, IUpdate, LegalAction, PlayerState, Turn } from "./types";
import { ethers } from "ethers";
import { Stack } from "../core/datastructures/stack";
import { FixedCircularList } from "../core/datastructures/linkedList";

export type GameOptions = {
    minBuyIn: bigint;
    maxBuyIn: bigint;
    minPlayers: number;
    maxPlayers: number;
    smallBlind: bigint;
    bigBlind: bigint;
};


type TurnWithRound = Turn & { round: TexasHoldemRound };

class TexasHoldemGame implements IPoker {
    private readonly _update: IUpdate;

    // Players should be a map of player to seat index
    private readonly _playersMap: Map<number, Player | null>;
    // private readonly _players: FixedCircularList<Player>;

    private _rounds = new Map<TexasHoldemRound, Turn[]>();
    private _lastActedSeat: number;
    // private _previousActions = new Stack<TurnWithRound>();

    private _deck!: Deck;

    private _pot: bigint;
    private _sidePots!: Map<string, bigint>;
    private _winners?: Map<string, bigint>;

    private _bigBlindPosition: number;
    private _smallBlindPosition: number;
    private _actions: BaseAction[];

    // Table options
    private readonly _minBuyIn: bigint;
    private readonly _maxBuyIn: bigint;
    private readonly _minPlayers: number;
    private readonly _maxPlayers: number;
    private readonly _smallBlind: bigint;
    private readonly _bigBlind: bigint;

    private seed: number[] = [];
    private readonly _communityCards: Card[] = [];

    constructor(
        private readonly _address: string,
        private gameOptions: GameOptions,
        private _dealer: number,
        private _lastToAct: number,
        private previousActions: ActionDTO[] = [],
        private _currentRound: TexasHoldemRound = TexasHoldemRound.PREFLOP,
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
            // console.log("Deck shuffled successfully");
        };

        // TODO: Make this a map
        for (let i = 0; i < communityCards.length; i++) {
            const card: Card = Deck.fromString(communityCards[i]);
            this._communityCards.push(card);
        }

        // this._players = new FixedCircularList<Player>(this._maxPlayers, null);

        this._pot = BigInt(currentPot);
        this._currentRound = _currentRound;

        this._minBuyIn = gameOptions.minBuyIn;
        this._maxBuyIn = gameOptions.maxBuyIn;
        this._minPlayers = gameOptions.minPlayers;
        this._maxPlayers = gameOptions.maxPlayers;
        this._smallBlind = gameOptions.smallBlind;
        this._bigBlind = gameOptions.bigBlind;

        // this was is causing the 10 & 11
        this._smallBlindPosition = this._dealer === 9 ? 1 : this._dealer + 1;
        this._bigBlindPosition = this._dealer === 9 ? 2 : this._dealer + 2;

        this._rounds.set(TexasHoldemRound.PREFLOP, []);
        this._dealer = _dealer === 0 ? this._maxPlayers : _dealer;
        this._lastActedSeat = _lastToAct; // Need to recalculate this

        for (const action of previousActions) {
            const turn = {
                playerId: action.playerId,
                action: action.action,
                amount: BigInt(action.amount)
            };

            this.addAction(turn, action.round);
        }

        this._update = new (class implements IUpdate {
            constructor(public game: TexasHoldemGame) { }

            addAction(action: Turn): void {
            }
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
        return this._bigBlind;
    }
    get smallBlind() {
        return this._smallBlind;
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

    exists(playerId: string): boolean {
        for (const [seat, player] of this._playersMap.entries()) {
            if (player?.address === playerId) {
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
        if (this.getActivePlayerCount() < this._minPlayers) throw new Error("Not enough active players");

        if (![TexasHoldemRound.PREFLOP, TexasHoldemRound.SHOWDOWN].includes(this.currentRound)) throw new Error("Hand currently in progress.");

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
        const hasDealt = preFlopActions.some(a => a.action === PlayerActionType.DEAL);
        const anyPlayerHasCards = Array.from(this._playersMap.values())
            .some(p => p !== null && p.holeCards !== undefined);
        
        if (hasDealt || anyPlayerHasCards) {
            throw new Error("Cards have already been dealt for this hand.");
        }

        // Reset the deck and shuffle
        this.shuffle(seed);
        
        // Deal 2 cards to each player
        const players = this.getSeatedPlayers();
        players.forEach(p => {
            const cards = this._deck.deal(2) as [Card, Card];
            p.holeCards = cards;
        });

        console.log("Cards dealt successfully");
    }

    join(player: Player) {
        const seat = this.findNextSeat();
        this.joinAtSeat(player, seat);
    }

    join2(address: string, chips: bigint) {
        const player = new Player(address, undefined, chips, undefined, PlayerStatus.SITTING_OUT);
        const seat = this.findNextSeat();
        this.joinAtSeat(player, seat);
    }

    joinAtSeat(player: Player, seat: number) {
        // Check if the player is already in the game
        if (this.exists(player.address)) {
            throw new Error("Player already joined.");
        }

        // ensure the seat is valid
        if (seat === -1) {
            console.log(`Table full. Current players: ${this.getPlayerCount()}, Max players: ${this._maxPlayers}`);
            throw new Error("Table full."); // This must be thrown
        }

        console.log(`Player ${player.address} joined at seat ${seat}`);
        this._playersMap.set(seat, player);

        // TODO: Need to consider the work flow here, but make active for now
        player.updateStatus(PlayerStatus.ACTIVE);

        // if (player.chips < this._minBuyIn) {
        //     // throw new Error("Player does not have enough chips to join.");
        //     console.log("Player does not have enough chips to join.");
        //     return;
        // }

        const autoPostBlinds = false;
        if (autoPostBlinds) {
            // Auto join the first player
            if (this.getPlayerCount() === 1 && this.currentRound === TexasHoldemRound.PREFLOP) {
                // post small blind
                new SmallBlindAction(this, this._update).execute(player, this._smallBlind);

                // This is the last player to act
                this._lastActedSeat = seat;

                // Add to bets to preflop round
                const turn: Turn = { playerId: player.address, action: PlayerActionType.SMALL_BLIND, amount: this._smallBlind };

                player.addAction(turn);
                player.updateStatus(PlayerStatus.ACTIVE);
            }

            // Auto join the second player
            if (this.getPlayerCount() === 2 && this.currentRound === TexasHoldemRound.PREFLOP) {
                // post big blind
                new BigBlindAction(this, this._update).execute(player, this._bigBlind);

                // This is the last player to act
                this._lastActedSeat = seat;

                // Add to bets to pre-flop round
                const turn: Turn = { playerId: player.address, action: PlayerActionType.BIG_BLIND, amount: this._bigBlind };

                player.addAction(turn);
                player.updateStatus(PlayerStatus.ACTIVE);
            }
        }

        // Check if we haven't dealt
        if (autoPostBlinds) {
            if (this.getPlayerCount() === this._minPlayers && this.currentRound === TexasHoldemRound.PREFLOP) {
                this.shuffle();
                this.deal();
            }
        }
    }

    leave(address: string): bigint {
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
        const hasDealt = preFlopActions?.some(a => a.action === PlayerActionType.DEAL);
        const anyPlayerHasCards = Array.from(this._playersMap.values())
            .some(p => p !== null && p.holeCards !== undefined);

        // If blinds are posted but cards haven't been dealt yet,
        // then next is the player who posted the small blind (SB player acts first in 2-player game)
        if (!hasDealt && !anyPlayerHasCards) {
            return this.getPlayerAtSeat(this._smallBlindPosition);
        }

        // If cards have been dealt but no betting actions yet, betting starts with small blind in 2-player game
        if (hasDealt || anyPlayerHasCards) {
            const bettingActionsCount = preFlopActions?.filter(a => 
                a.action !== PlayerActionType.SMALL_BLIND && 
                a.action !== PlayerActionType.BIG_BLIND &&
                a.action !== PlayerActionType.DEAL
            ).length || 0;

            if (bettingActionsCount === 0) {
                return this.getPlayerAtSeat(this._smallBlindPosition);
            }
        }

        // For subsequent actions in the round, find the next player after the last acted player
        let next = this._lastActedSeat + 1;

        if (next > this._maxPlayers) {
            next = 1;
        }

        // Search from current position to end
        for (let i = next; i <= this._maxPlayers; i++) {
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
        const nextToAct = this.getNextPlayerToAct();
        
        // Check if player is active
        const isActive = player.status === PlayerStatus.ACTIVE;
        
        // If it's not this player's turn, they can only fold if they are active
        if (nextToAct && nextToAct.address !== player.address) {
            // Even if it's not their turn, active players can fold
            if (isActive) {
                return [{
                    action: PlayerActionType.FOLD,
                    min: "0",
                    max: "0"
                }];
            }
            return [];
        }

        const verifyAction = (action: BaseAction): LegalActionDTO | undefined => {
            try {
                const range = action.verify(player);
                return {
                    action: action.type,
                    min: range ? range.minAmount.toString() : "0",
                    max: range ? range.maxAmount.toString() : "0"
                }
            } catch {
                return undefined;
            }
        };

        // Get all valid actions for this player
        const actions = this._actions.map(verifyAction).filter(a => a) as LegalActionDTO[];
        
        // Check if cards have been dealt already (any player has hole cards)
        const anyPlayerHasCards = Array.from(this._playersMap.values())
            .some(p => p !== null && p.holeCards !== undefined);
            
        // If cards have been dealt, remove the deal action
        if (anyPlayerHasCards) {
            return actions.filter(a => a.action !== PlayerActionType.DEAL);
        }
        
        return actions;
    }

    getLastRoundAction(): Turn | undefined {
        const round = this._currentRound; // or previous round?
        const actions = this._rounds.get(round);

        if (!actions || actions.length === 0) {
            return undefined;
        }

        return actions.at(-1);
    }

    // Should be get last players action
    getPlayersLastAction(address: string): Turn | undefined {
        const player = this.getPlayer(address);
        const status = this.getPlayerStatus(address);

        if (status === PlayerStatus.ACTIVE) return this.getPlayerActions(player).at(-1);
        if (status === PlayerStatus.ALL_IN) return { playerId: address, action: PlayerActionType.ALL_IN };
        if (status === PlayerStatus.FOLDED) return { playerId: address, action: PlayerActionType.FOLD };

        return undefined;
    }

    performAction(address: string, action: PlayerActionType, amount?: bigint): void {
        if (this.currentRound === TexasHoldemRound.ANTE) {
            if (action !== PlayerActionType.SMALL_BLIND && action !== PlayerActionType.BIG_BLIND) {
                if (this.getActivePlayerCount() < this._minPlayers) {
                    throw new Error("Not enough players to start game.");
                }
            }
        }

        if (!this.exists(address)) {
            throw new Error("Player not found.");
        }

        const player = this.getPlayer(address);
        const nextToAct = this.getNextPlayerToAct();
        
        // Allow folding even if it's not the player's turn
        if (action === PlayerActionType.FOLD) {
            // No status checks - allow any player to fold
        } else if (nextToAct !== player) {
            // For all other actions, it must be the player's turn
            throw new Error("Not player's turn.");
        }

        player.addAction({ playerId: address, action, amount });
        const seat = this.getPlayerSeatNumber(address);

        // TODO: ROLL BACK TO FUNCTIONALITY
        switch (action) {
            // todo: ante
            case PlayerActionType.SMALL_BLIND:
                const smallBlind = new SmallBlindAction(this, this._update).execute(player, this._smallBlind);
                break;
            case PlayerActionType.BIG_BLIND:
                const bigBlind = new BigBlindAction(this, this._update).execute(player, this._bigBlind);
                break;
            case PlayerActionType.DEAL:
                // First verify the deal is valid via the DealAction
                try {
                    const dealAction = new DealAction(this, this._update).execute(player);
                    
                    // After verifying the deal is valid, actually deal the cards to all players
                    this.deal();
                    
                    // Add the deal action to the round actions
                    this.addAction({ playerId: address, action: PlayerActionType.DEAL });
                    
                    // After dealing, the next player to act is the small blind position
                    // In a 2-player game, SB player acts first after the cards are dealt
                    this._lastActedSeat = seat;
                } catch (error) {
                    console.error("Error performing deal action:", error);
                    // Don't rethrow the error - this prevents the server from crashing
                    // Just log it and continue
                }
                break;
            case PlayerActionType.FOLD:
                // Don't update player status before executing fold
                const fold = new FoldAction(this, this._update).execute(player);
                break;
            case PlayerActionType.CHECK:
                const check = new CheckAction(this, this._update).execute(player);
                break;
            case PlayerActionType.BET:
                if (!amount) throw new Error("Amount must be provided for bet.");
                // Check if we're in a post-flop round before executing bet
                if (this._currentRound !== TexasHoldemRound.PREFLOP || this._communityCards.length > 0) {
                    // We're past preflop, directly execute bet without trying to deal cards
                    const bet = new BetAction(this, this._update).execute(player, amount);
                } else {
                    // We're in preflop, check if cards have been dealt
                    const preFlopActions = this._rounds.get(TexasHoldemRound.PREFLOP);
                    const hasDealt = preFlopActions?.some(a => a.action === PlayerActionType.DEAL);
                    const anyPlayerHasCards = Array.from(this._playersMap.values())
                        .some(p => p !== null && p.holeCards !== undefined);
                        
                    // Only try to deal if cards haven't been dealt yet
                    if (!hasDealt && !anyPlayerHasCards) {
                        // Deal cards before executing bet
                        this.deal();
                    }
                    
                    // Now execute the bet action
                    const bet = new BetAction(this, this._update).execute(player, amount);
                }
                break;
            case PlayerActionType.CALL:
                const call = new CallAction(this, this._update).execute(player);
                break;
            default:
                // do we need to roll back last acted seat?
                throw new Error("Invalid action.");
        }

        this._lastActedSeat = seat;

        if (this.hasRoundEnded(this._currentRound) === true) {
            this.nextRound();
        }
    }

    addAction(turn: Turn, round: TexasHoldemRound = this._currentRound): void {
        // Check if the round already exists in the map
        if (this._rounds.has(round)) {
            // Get the existing actions array
            const actions = this._rounds.get(round)!;
            // Push the new turn to it
            actions.push(turn);
            console.log("Added action to existing round");
            console.log(actions);

            this._rounds.set(round, actions);
        } else {
            // Create a new array with this turn as the first element
            this._rounds.set(round, [turn]);
        }

        console.log("Added action to round");
        console.log(this._rounds);
    }

    getActionDTOs(): ActionDTO[] {
        const actions: ActionDTO[] = [];

        for (const [round, turns] of this._rounds) {

            for (const turn of turns) {
                const action: ActionDTO = {
                    playerId: turn.playerId,
                    seat: this.getPlayerSeatNumber(turn.playerId),
                    action: turn.action,
                    amount: turn.amount ? turn.amount.toString() : "",
                    round
                };

                actions.push(action);
            }

            // const roundActions: ActionDTO[] = this.getActionsForRound(round);

            // for (const action of roundActions) {
            //     actions.push(action);
            // }
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
                round
            };

            actions.push(action);
        }

        return actions;
    }

    getPlayer(address: string): Player {
        if (!this.exists(address)) {
            throw new Error("Player not found.");
        }

        for (const [seat, player] of this._playersMap.entries()) {
            if (player?.address === address) {
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

        for (const [seat, player] of this._playersMap.entries()) {
            if (player?.address === address) {
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
    };

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

        // return pot + this._pot;
        return pot;
    }

    private getPlayerActions(player: Player, round: TexasHoldemRound = this._currentRound): Turn[] {
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
        const maxSeats = this._maxPlayers;

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

        const active = players.filter(p => this.getPlayerStatus(p.address) === PlayerStatus.ACTIVE);
        // const orderedPots = Array.from(this._sidePots.entries()).sort(([_k1, v1], [_k2, v2]) => v1 - v2);
        this._winners = new Map<string, bigint>();

        let pot: bigint = this.getPot();
        let winningHands = PokerSolver.Hand.winners(active.map(a => hands.get(a.id)));
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

        function update(player: Player, portion: bigint, winners: Map<string, bigint>) {
            // player.chips += portion;
            // winners.set(player.id, (winners.get(player.id) ?? 0) + portion);
        }

        function toPokerSolverMnemonic(card: Card) {
            return card.mnemonic.replace("10", "T");
        }
    }

    hasRoundEnded(round: TexasHoldemRound): boolean {
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
        const hasDealt = actions.some(a => a.action === PlayerActionType.DEAL);
        const anyPlayerHasCards = Array.from(this._playersMap.values())
            .some(p => p !== null && p.holeCards !== undefined);
            
        // In preflop round, make sure cards have been dealt before we can end the round
        if (round === TexasHoldemRound.PREFLOP && !hasDealt && !anyPlayerHasCards) {
            return false;
        }

        // Check if there's betting action yet
        const bettingActions = actions.filter(a => 
            a.action !== PlayerActionType.SMALL_BLIND && 
            a.action !== PlayerActionType.BIG_BLIND &&
            a.action !== PlayerActionType.DEAL
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
            const playerBettingActions = playerActions.filter(a => 
                a.action !== PlayerActionType.SMALL_BLIND && 
                a.action !== PlayerActionType.BIG_BLIND &&
                a.action !== PlayerActionType.DEAL
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
    };

    private getNextRound(): TexasHoldemRound {
        switch (this._currentRound) {
            // case TexasHoldemRound.ANTE:
            //     return TexasHoldemRound.PREFLOP;
            case TexasHoldemRound.PREFLOP:
                return TexasHoldemRound.FLOP;
            case TexasHoldemRound.FLOP:
                return TexasHoldemRound.TURN;
            case TexasHoldemRound.TURN:
                return TexasHoldemRound.RIVER;
            case TexasHoldemRound.RIVER:
                return TexasHoldemRound.SHOWDOWN;
            default:
                return TexasHoldemRound.PREFLOP;
        }
    }

    private setNextRound(): void {
        this._currentRound = this.getNextRound();
    }

    public static fromJson(json: any, gameOptions: GameOptions): TexasHoldemGame {
        const players = new Map<number, Player | null>();

        json.players.map((p: any) => {
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
                    round: this._currentRound // todo: check this, it should be the current round but not always
                };
            }

            const legalActions: LegalActionDTO[] = this.getLegalActions(player.address);

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
        // Iterate through each previous round and get each turn / action


        const previousActions: ActionDTO[] = this.getActionDTOs();
        const winners: WinnerDTO[] = [];
        const pot = this.getPot();

        const deckAsString = this._deck.toString();
        // const communityCards : string[] = this._communityCards.map(c => c.mnemonic);
        const communityCards: string[] = [];
        for (let i = 0; i < this._communityCards.length; i++) {
            communityCards.push(this._communityCards[i].mnemonic);
        }

        return {
            type: "cash",
            address: this._address,
            smallBlind: this._smallBlind.toString(),
            bigBlind: this._bigBlind.toString(),
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
}

export default TexasHoldemGame;