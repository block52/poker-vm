import {
    ActionDTO,
    LegalActionDTO,
    PlayerActionType,
    PlayerDTO,
    PlayerStatus,
    TexasHoldemGameStateDTO,
    TexasHoldemRound,
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

type Round = {
    type: TexasHoldemRound;
    actions: Turn[];
};

type GameOptions = {
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
    private readonly _players: FixedCircularList<Player>;

    private _rounds!: Round[];
    private _deck!: Deck;
    private _sidePots!: Map<string, bigint>;
    private _winners?: Map<string, bigint>;

    private _bigBlindPosition: number;
    private _smallBlindPosition: number;
    private _actions: BaseAction[];

    private _lastActedSeat: number;
    private _previousActions = new Stack<Turn>();

    constructor(
        private readonly _address: string,
        private readonly _minBuyIn: bigint,
        private readonly _maxBuyIn: bigint,
        private readonly _minPlayers: number,
        private readonly _maxPlayers: number,
        private readonly _smallBlind: bigint,
        private readonly _bigBlind: bigint,
        private _dealer: number,
        private _nextToAct: number,
        private _currentRound: TexasHoldemRound = TexasHoldemRound.ANTE,
        private _communityCards: Card[] = [],
        private _pot: bigint = 0n,
        playerStates: Map<number, Player | null>
    ) {
        this._playersMap = new Map<number, Player | null>(playerStates);
        this._players = new FixedCircularList<Player>(this._maxPlayers, null);

        this._currentRound = _currentRound;

        this._smallBlindPosition = _dealer + 1;
        this._bigBlindPosition = _dealer + 2;

        this._rounds = [{ type: TexasHoldemRound.ANTE, actions: [] }];
        this._dealer = _dealer === 0 ? _maxPlayers : _dealer;

        // remove this
        this._nextToAct = _nextToAct;
        this._lastActedSeat = _nextToAct; // Need to recalculate this

        this._update = new (class implements IUpdate {
            constructor(public game: TexasHoldemGame) {}

            addAction(action: Turn): void {
                const ante_round: Round = {
                    type: TexasHoldemRound.ANTE,
                    actions: []
                };

                this.game._rounds.push(ante_round);

                // this.game._rounds[this.game._currentRound].moves.push(move);
                // if (![PlayerAction.SMALL_BLIND, PlayerAction.BIG_BLIND].includes(move.action)) this.game.nextPlayer();
            }
        })(this);

        this._actions = [
            new FoldAction(this, this._update),
            new CheckAction(this, this._update),
            new BetAction(this, this._update),
            new CallAction(this, this._update)
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
        // return this.getPlayerAtSeat(this._lastActedSeat)?.address ?? ethers.ZeroAddress;
    }
    get currentRound() {
        return this._currentRound;
    }
    get pot() {
        return this._pot;
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

    deal(seed: number[] = []): void {
        // Check minimum players
        if (this.getActivePlayerCount() < this._minPlayers) throw new Error("Not enough active players");

        if (![TexasHoldemRound.ANTE, TexasHoldemRound.SHOWDOWN].includes(this.currentRound)) throw new Error("Hand currently in progress.");

        this._deck = new Deck();
        this._deck.shuffle(seed);

        const players = this.getSeatedPlayers();
        players.forEach(p => {
            // todo: get share secret
            const cards = this._deck.deal(2) as [Card, Card];
            // p.holeCards = cards;
        });

        this.setNextRound();
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
        if (this.exists(player.address)) {
            console.log("Player already joined.");
            throw new Error("Player already joined.");
        }

        if (this.getPlayerCount() + 1 >= this._maxPlayers) {
            // throw new Error("Game full.");
            console.log("Table full.");
            return;
        }

        this._playersMap.set(seat, player);

        // if (player.chips < this._minBuyIn) {
        //     // throw new Error("Player does not have enough chips to join.");
        //     console.log("Player does not have enough chips to join.");
        //     return;
        // }

        // Auto join the first player
        if (this.getPlayerCount() === 1 && this.currentRound === TexasHoldemRound.ANTE) {
            // post small blind
            new SmallBlindAction(this, this._update).execute(player, this._smallBlind);

            // This is the last player to act
            this._lastActedSeat = seat;

            // Add to bets to preflop round
            const turn: Turn = { playerId: player.address, action: PlayerActionType.SMALL_BLIND, amount: this._smallBlind };
            this._rounds[1].actions.push(turn);
            this._previousActions.push(turn);

            player.addAction(turn);
            player.updateStatus(PlayerStatus.ACTIVE);
        }

        // Auto join the second player
        if (this.getPlayerCount() === 2 && this.currentRound === TexasHoldemRound.ANTE) {
            // post big blind
            new BigBlindAction(this, this._update).execute(player, this._bigBlind);

            // This is the last player to act
            this._lastActedSeat = seat;

            // Add to bets to preflop round
            const turn: Turn = { playerId: player.address, action: PlayerActionType.BIG_BLIND, amount: this._bigBlind };
            this._rounds[1].actions.push(turn);
            this._previousActions.push(turn);

            player.addAction(turn);
            player.updateStatus(PlayerStatus.ACTIVE);
        }

        // Check if we haven't dealt
        if (this.getPlayerCount() === this._minPlayers && this.currentRound === TexasHoldemRound.ANTE) {
            this.deal();
        }
    }

    leave(address: string) {
        const player = this.getPlayerSeatNumber(address);
        this._playersMap.set(player, null);

        // todo: do transfer
    }

    getNextPlayerToAct(): Player {
        const player = this.findNextPlayerToAct();

        if (!player) {
            throw new Error("Player not found.");
        }

        return player;
    }

    private findNextPlayerToAct(): Player | undefined {
        let next = this._lastActedSeat + 1;

        if (next === this._maxPlayers) {
            next = 1;
        }

        for (let i = next; i <= this._maxPlayers; i++) {
            const player = this.getPlayerAtSeat(i);

            if (player && (this.getPlayerStatus(player.address) === PlayerStatus.ACTIVE || this.getPlayerStatus(player.address) === PlayerStatus.NOT_ACTED)) {
                return player;
            }
        }

        for (let i = 1; i < next; i++) {
            const player = this.getPlayerAtSeat(i);

            if (player && (this.getPlayerStatus(player.address) === PlayerStatus.ACTIVE || this.getPlayerStatus(player.address) === PlayerStatus.NOT_ACTED)) {
                return player;
            }
        }

        return undefined;
    }

    // Should be get valid players actions
    getValidActions(address: string): LegalAction[] {
        const verifyAction = (action: BaseAction) => {
            try {
                const range = action.verify(player);
                return { action: action.type, ...(range ? { minAmount: range.minAmount, maxAmount: range.maxAmount } : {}) };
            } catch {
                return null;
            }
        };

        const player = this.getPlayer(address);
        return this._actions.map(verifyAction).filter(a => a) as LegalAction[];
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

    performAction(address: string, action: PlayerActionType, amount?: bigint) {
        if (this.currentRound === TexasHoldemRound.ANTE) {
            if (action !== PlayerActionType.SMALL_BLIND && action !== PlayerActionType.BIG_BLIND) {
                if (this.getActivePlayerCount() < this._minPlayers) {
                    throw new Error("Not enough players to start game.");
                }
            }

            // throw new Error(`Cannot perform ${action} until game started.`);
        }

        if (!this.exists(address)) {
            throw new Error("Player not found.");
        }

        const player = this.getPlayer(address);
        player.addAction({ playerId: address, action, amount });
        const seat = this.getPlayerSeatNumber(address);

        // TODO: ROLL BACK TO FUNCTIONALITY
        switch (action) {
            // todo: bb, sb, ante
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

        if (this.hasRoundEnded()) {
            this.setNextRound();
        }
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

    getBets(round: TexasHoldemRound = this._currentRound): Map<string, bigint> {
        const i = this.getRoundAsNumber(round);
        const bets = new Map<string, bigint>();

        this._rounds[i].actions.forEach(m => {
            const amount = m.amount ?? 0n;
            bets.set(m.playerId, amount);
        });

        return bets;
    }

    getPlayerStake(player: Player, bets = this.getBets()): bigint {
        return bets.get(player.address) ?? 0n;
    }

    // // I dont understand this?
    // getMaxStake(bets = this.getBets()): bigint {
    //     // return bets.size ? Math.max(...bets.values()) : 0;
    //     const max: bigint = 10000000000000000000n;
    //     return max;
    // }

    getPot(bets = this.getBets()): bigint {
        // todo: check this
        let pot: bigint = 0n;

        for (let [key, value] of bets) {
            pot += value;
        }

        return pot;
    }

    // Not sure why we need this
    private getStartingPot(): bigint {
        const pot: bigint = 0n;
        // for (let stage = TexasHoldemRound.PREFLOP; stage < this._currentRound; this.setNextRound()) pot += this.getPot(this.getBets(stage));
        return pot;
    }

    private getPlayerActions(player: Player, round: TexasHoldemRound = this._currentRound): Turn[] {
        const i = this.getRoundAsNumber(round);
        if (this._rounds[i] === undefined) return [];

        return this._rounds[i].actions.filter(m => m.playerId === player.address);
    }

    // private getActivePlayers(): number[] {
    //     // return [...Array(this._players.length).keys()].reduce((acc, i) => {
    //     //     const index = (this._nextToAct + 1 + i) % this._players.length;
    //     //     const player = this._players[index];
    //     //     return player && this.getPlayerStatus(player) === PlayerStatus.ACTIVE ? [...acc, index] : acc;
    //     // }, [] as Array<number>);

    //     const activePlayers: number[] = [];

    //     for (let i = 0; i < this._players.length; i++) {
    //         const player = this._players[i];
    //         if (player && this.getPlayerStatus(player) === PlayerStatus.ACTIVE) {
    //             activePlayers.push(i);
    //         }
    //     }

    //     return activePlayers;
    // }

    private getSeatedPlayers(): Player[] {
        return Array.from(this._playersMap.values()).filter((player): player is Player => player !== null);
    }

    private nextPlayer(): void {
        // this is find next to act
    }

    findNextSeat(): number {
        const maxSeats = this._maxPlayers;

        for (let seatNumber = 1; seatNumber <= maxSeats; seatNumber++) {
            // Check if seat is empty (null) or doesn't exist in the map
            if (!this._playersMap.has(seatNumber) || this._playersMap.get(seatNumber) === null) {
                return seatNumber;
            }
        }

        throw new Error("No available seats.");
    }

    // complete round maybe?
    private nextHand(): void {
        this.calculateSidePots();

        // TODO?
        // this._rounds.push({ actions: [] });

        if (this.getRoundAsNumber(this._currentRound) < this.getRoundAsNumber(TexasHoldemRound.SHOWDOWN)) {
            this.setNextRound();
        }

        if (this._currentRound !== TexasHoldemRound.SHOWDOWN) {
            if (this._currentRound === TexasHoldemRound.FLOP) this._communityCards.push(...this._deck.deal(3));
            else if (this._currentRound === TexasHoldemRound.TURN || this._currentRound == TexasHoldemRound.RIVER)
                this._communityCards.push(...this._deck.deal(1));
            this._nextToAct = this._dealer;
            this.nextPlayer();
        } else this.calculateWinner();
    }

    private calculateSidePots(): void {
        const startingPot = this.getStartingPot();
        const numActive = this.getSeatedPlayers().filter(p => this.getPlayerStatus(p.address) === PlayerStatus.ACTIVE).length;

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

        let pot: bigint = this.getStartingPot();
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

    hasRoundEnded(): boolean {
        const players = this.getSeatedPlayers();

        for (const player of players) {
            const last = player.lastAction;
            if (!last) return false;
            if (
                last.action !== PlayerActionType.FOLD &&
                last.action !== PlayerActionType.ALL_IN &&
                last.action !== PlayerActionType.CALL &&
                last.action !== PlayerActionType.CHECK
            )
                return false;
        }

        return true;
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

    private getRoundAsNumber(round: TexasHoldemRound): number {
        switch (round) {
            case TexasHoldemRound.ANTE:
                return 0;
            case TexasHoldemRound.PREFLOP:
                return 1;
            case TexasHoldemRound.FLOP:
                return 2;
            case TexasHoldemRound.TURN:
                return 3;
            case TexasHoldemRound.RIVER:
                return 4;
            case TexasHoldemRound.SHOWDOWN:
                return 5;
            default:
                throw new Error("Invalid round.");
        }
    }

    public static fromJson(json: any): TexasHoldemGame {
        // const schema = `${json.minPlayers},${json.maxPlayers},${json.smallBlind},${json.bigBlind}`;

        // todo: add all the players
        const playerStates: PlayerState[] = json.players.map((p: any) => {
            return {
                address: p.id || p.address, // TODO: check this
                seat: p.seat,
                chips: p.chips,
                cards: p.cards // ? holeCards : undefined
            };
        });

        return new TexasHoldemGame(
            json.address,
            json.minBuyIn,
            json.maxBuyIn,
            json.minPlayers,
            json.maxPlayers,
            json.smallBlind,
            json.bigBlind,
            json.dealer,
            json.nextToAct,
            json.currentRound,
            json.communityCards,
            json.pots,
            json.players
        );
    }

    public toJson(): TexasHoldemGameStateDTO {
        const players: PlayerDTO[] = Array.from(this._playersMap.values()).map((player, i) => {
            const lastAction: ActionDTO = {
                action: PlayerActionType.CHECK,
                amount: "0"
            };

            const actions: LegalActionDTO[] = [];

            return {
                address: player?.address ?? ethers.ZeroAddress,
                seat: i,
                stack: player?.chips.toString() ?? "0",
                isSmallBlind: i === this._smallBlindPosition,
                isBigBlind: i === this._bigBlindPosition,
                isDealer: i === this._dealer,
                holeCards: player?.holeCards ? [player.holeCards[0].value, player.holeCards[1].value] : undefined,
                status: player?.status ?? PlayerStatus.SITTING_OUT,
                lastAction,
                actions: actions,
                timeout: 0,
                signature: ethers.ZeroHash
            };
        });

        const winners: WinnerDTO[] = [];

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
            pots: [this._pot.toString()],
            nextToAct: this._nextToAct,
            round: this._currentRound,
            winners: winners,
            signature: ethers.ZeroHash
        };
    }
}

export default TexasHoldemGame;
