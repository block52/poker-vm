import {
    ActionDTO,
    LegalActionDTO,
    PlayerActionType,
    PlayerDTO,
    PlayerStatus,
    TexasHoldemRound,
    TexasHoldemStateDTO,
    WinnerDTO
} from "@bitcoinbrisbane/block52";
import { Player } from "../models/game";
import { Card, Deck } from "../models/deck";
import BaseAction from "./actions/baseAction";
import BetAction from "./actions/betAction";
import BigBlindAction from "./actions/bigBlindAction";
import CallAction from "./actions/callAction";
import CheckAction from "./actions/checkAction";
import FoldAction from "./actions/foldAction";
import SmallBlindAction from "./actions/smallBlindAction";
// @ts-ignore
import PokerSolver from "pokersolver";
import { IPoker, IUpdate, LegalAction, PlayerState, Turn } from "./types";
import { ethers } from "ethers";
import { Stack } from "../core/datastructures/stack";
import { FixedCircularList } from "../core/datastructures/linkedList";
import RaiseAction from "./actions/raiseAction";

type Round = {
    type: TexasHoldemRound;
    actions: Turn[];
};

export type GameOptions = {
    minBuyIn: bigint;
    maxBuyIn: bigint;
    minPlayers: number;
    maxPlayers: number;
    smallBlind: bigint;
    bigBlind: bigint;
};

class TexasHoldemGame implements IPoker {
    private readonly _update: IUpdate;

    // Players should be a map of player to seat index
    private readonly _playersMap: Map<number, Player | null>;
    // private readonly _players: FixedCircularList<Player>;

    private _rounds = new Map<TexasHoldemRound, Turn[]>();
    private _deck!: Deck;

    private _pot: bigint;
    private _sidePots!: Map<string, bigint>;
    private _winners?: Map<string, bigint>;

    private _bigBlindPosition: number;
    private _smallBlindPosition: number;
    private _actions: BaseAction[];

    private _lastActedSeat: number;
    private _previousActions = new Stack<Turn>();

    // Table options
    private readonly _minBuyIn: bigint;
    private readonly _maxBuyIn: bigint;
    private readonly _minPlayers: number;
    private readonly _maxPlayers: number;
    private readonly _smallBlind: bigint;
    private readonly _bigBlind: bigint;

    constructor(
        private readonly _address: string,
        private gameOptions: GameOptions,
        private _dealer: number,
        private _lastToAct: number,
        private previousActions: ActionDTO[] = [],
        private _currentRound: TexasHoldemRound = TexasHoldemRound.PREFLOP,
        private _communityCards: Card[] = [],
        private currentPot: bigint = 0n,
        playerStates: Map<number, Player | null>,
        deck?: string
    ) {
        this._playersMap = new Map<number, Player | null>(playerStates);
        deck ? (this._deck = new Deck(deck)) : this._deck = new Deck();
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

    private shuffle(seed: number[] = []): void {
        this._deck.shuffle(seed);
    }

    deal(seed: number[] = []): void {
        // Check minimum players
        if (this.getActivePlayerCount() < this._minPlayers) throw new Error("Not enough active players");

        if (![TexasHoldemRound.PREFLOP, TexasHoldemRound.SHOWDOWN].includes(this.currentRound)) throw new Error("Hand currently in progress.");

        const players = this.getSeatedPlayers();
        players.forEach(p => {
            // todo: get share secret
            const cards = this._deck.deal(2) as [Card, Card];
            p.holeCards = cards;
        });
    }

    join(player: Player) {
        if (this.exists(player.address)) {
            // throw new Error("Player already joined.");
            console.log("Player already joined.");
            return;
        }

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
            console.log("Player already joined.");
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

    leave(address: string) {
        const player = this.getPlayerSeatNumber(address);
        this._playersMap.set(player, null);

        // todo: do transfer
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

        let next = this._lastActedSeat + 1;

        if (next === this._maxPlayers) {
            next = 1;
        }

        for (let i = next; i <= this._maxPlayers; i++) {
            const player = this.getPlayerAtSeat(i);

            if (player && (player.status === PlayerStatus.ACTIVE || player.status === PlayerStatus.NOT_ACTED)) {
                return player;
            }
        }

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

        const actions = this._actions.map(verifyAction).filter(a => a) as LegalActionDTO[];

        // Has the small blind posted?
        const preFlopActions = this._rounds.get(TexasHoldemRound.PREFLOP);
        const hasSmallBlindPosted = preFlopActions?.some(a => a.action === PlayerActionType.SMALL_BLIND);

        if (!hasSmallBlindPosted) {

        }

        // Has the big blind posted?
        const hasBigBlindPosted = preFlopActions?.some(a => a.action === PlayerActionType.BIG_BLIND);

        if (!hasBigBlindPosted) {
            
        }

        // if _previousActions contains small blind post, remove from actions

        // if _previousActions contains big blind post, remove from actions

        // todo: wire this up after playerId has been added to the actionDTO
        // To access it, you would use methods like peek() or toArray():
        // const lastAction = this._previousActions.peek();
        // { playerId: '0x...', action: 'SMALL_BLIND', amount: 1000000000000000000n }

        // const allActions = this._previousActions.toArray();
        // [{ playerId: '0x...', action: 'SMALL_BLIND', amount: 1000000000000000000n }]

        return actions;
    }

    getLastAction(): Turn | undefined {
        return this._previousActions.peek();
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

    private turnAsActionDTO(turn: Turn, round: TexasHoldemRound): ActionDTO {
        return {
            playerId: turn.playerId,
            seat: this.getPlayerSeatNumber(turn.playerId),
            action: turn.action,
            amount: turn.amount ? turn.amount.toString() : "",
            round: round
        };
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

        // Check if player is allowed to act
        // todo: check if player is allowed to act

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
            case PlayerActionType.FOLD:
                player.updateStatus(PlayerStatus.FOLDED);
                const fold = new FoldAction(this, this._update).execute(player);
                break;
            case PlayerActionType.CHECK:
                const check = new CheckAction(this, this._update).execute(player);
                break;
            case PlayerActionType.BET:
                if (!amount) throw new Error("Amount must be provided for bet.");
                const bet = new BetAction(this, this._update).execute(player, amount);
                break;
            case PlayerActionType.CALL:
                const call = new CallAction(this, this._update).execute(player);
                break;
            default:
                // do we need to roll back last acted seat?
                throw new Error("Invalid action.");
        }

        this._lastActedSeat = seat;

        if (this.hasRoundEnded() === true) {
            this.nextRound();
        }
    }

    addAction(turn: Turn, round: TexasHoldemRound = this._currentRound): void {
        this._previousActions.push(turn);

        // Check if the round already exists in the map
        if (this._rounds.has(round)) {
            // Get the existing actions array
            const actions = this._rounds.get(round)!;
            // Push the new turn to it
            actions.push(turn);
        } else {
            // Create a new array with this turn as the first element
            this._rounds.set(round, [turn]);
        }
    }

    getActionDTOs(): ActionDTO[] {
        const actions: ActionDTO[] = [];

        for (const [round, turns] of this._rounds) {
            for (const turn of turns) {
                actions.push(this.turnAsActionDTO(turn, round));
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
            actions.push(this.turnAsActionDTO(turn, round));
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

        return pot + this._pot;
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

    private getSeatedPlayers(): Player[] {
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

    private hasRoundEnded(): boolean {
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

        const largestBet = this.getLargestBet(this._currentRound);

        // Check that all remaining active players have acted and matched the highest bet
        for (const player of activePlayers) {
            const actions = this.getPlayerActions(player, this._currentRound);

            // If a player hasn't acted yet, round is not over
            if (actions.length === 0) {
                return false;
            }

            // Get the player's last action in this round
            const lastAction = actions[actions.length - 1];

            // Skip players who have checked or called
            // Find players who have bet or raised
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
            const player: Player = new Player(p.address, undefined, stack, undefined, p.status);
            players.set(p.seat, player);
        });

        return new TexasHoldemGame(
            json.address,
            gameOptions,
            json.dealer as number,
            json.lastToAct as number,
            json.previousActions,
            json.currentRound,
            json.communityCards,
            json.pots,
            players
        );
    }

    public toJson(): TexasHoldemStateDTO {
        const players: PlayerDTO[] = Array.from(this._playersMap.values()).map((player, i) => {

            if (!player) {
                return {
                    address: ethers.ZeroAddress,
                    seat: i,
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
                    seat: i,
                    action: turn.action,
                    amount: (turn.amount ?? 0n).toString(),
                    round: this._currentRound // todo: check this, it should be the current round but not always
                };
            }

            const legalActions: LegalActionDTO[] = this.getLegalActions(player.address);
            const seat = this.getPlayerSeatNumber(player.address);

            return {
                address: player.address,
                seat: seat,
                stack: player.chips.toString(),
                isSmallBlind: i === this._smallBlindPosition,
                isBigBlind: i === this._bigBlindPosition,
                isDealer: i === this._dealer,
                holeCards: player?.holeCards ? [player.holeCards[0].value, player.holeCards[1].value] : undefined,
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

        const previousTurns: Turn[] = this._previousActions.toArray();
        const previousActions: ActionDTO[] = [];

        for (let i = 0; i < previousTurns.length; i++) {
            const turn: Turn = previousTurns[i];
            const seat = this.getPlayerSeatNumber(turn.playerId);
            const action: ActionDTO = {
                playerId: turn.playerId,
                seat: seat,
                action: turn.action,
                amount: turn.amount ? turn.amount.toString() : "",
                round: this._currentRound // this is wrong
            };

            previousActions.push(action);
        }

        const winners: WinnerDTO[] = [];
        const pot = this.getPot();

        return {
            type: "cash",
            address: this._address,
            smallBlind: this._smallBlind.toString(),
            bigBlind: this._bigBlind.toString(),
            smallBlindPosition: this._smallBlindPosition,
            bigBlindPosition: this._bigBlindPosition,
            dealer: this._dealer,
            players: players,
            communityCards: this._communityCards.map(c => c.value),
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