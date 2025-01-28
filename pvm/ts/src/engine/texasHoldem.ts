import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { IUpdate, Turn, Player, PlayerId, TexasHoldemGameState, LegalAction, PlayerState } from "../models/game";
import { Card, Deck, DeckType } from "../models/deck";
import BaseAction from "./actions/baseAction";
import BetAction from "./actions/betAction";
import BigBlindAction from "./actions/bigBlindAction";
import CallAction from "./actions/callAction";
import CheckAction from "./actions/checkAction";
import FoldAction from "./actions/foldAction";
import SmallBlindAction from "./actions/smallBlindAction";
// @ts-ignore
import PokerSolver from "pokersolver";
import { IPoker } from "./types";
import { ethers } from "ethers";

type Round = {
    type: TexasHoldemRound;
    actions: Turn[];
};

class TexasHoldemGame implements IPoker {
    private readonly _update: IUpdate;
    
    // Players should be a map of player to seat index
    // private _players: Map<number, Player>;
    private readonly _players: Player[];
    private _rounds!: Round[];
    private _deck!: Deck;
    private _sidePots!: Map<PlayerId, BigInt>;
    private _winners?: Map<PlayerId, BigInt>;
    // private _currentRound: TexasHoldemRound;
    // private _nextToAct: number;
    private _bigBlindPosition: number;
    private _smallBlindPosition: number;
    private _actions: BaseAction[];

    private _minPlayers: number = 2;
    private _maxPlayers: number = 9;

    // Table limits
    private _minBuyIn: BigInt = ethers.parseEther("10"); // 10000000000000000000n; 10 dollars
    private _maxBuyIn: BigInt = ethers.parseEther("100"); // 10000000000000000000n; 100 dollars

    constructor(
        private _address: string,
        private _smallBlind: BigInt,
        private _bigBlind: BigInt,
        private _dealer: number = 0,
        private _nextToAct: number = 1,
        private _currentRound: TexasHoldemRound = TexasHoldemRound.ANTE,
        private _communityCards: Card[] = [],
        private _pot: BigInt = 0n,
    ) {
        // this._players = new Map<number, Player>();
        // Create an array of players with max size of 9

        this._players = [];
        for (let i = 0; i < this._maxPlayers; i++) {
            this._players.push(new Player(ethers.ZeroAddress, 0n));
        }
        
        this._currentRound = _currentRound;
        this._nextToAct = _nextToAct;
        this._bigBlindPosition = 0;
        this._smallBlindPosition = 0;
        this._rounds = [{ type: TexasHoldemRound.ANTE, actions: [] }];
        this._dealer = _dealer;
        // this._buttonPosition--; // avoid auto-increment on next game for join round

        this._update = new (class implements IUpdate {
            constructor(public game: TexasHoldemGame) { }

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
        return [...this._players];
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
        return this._players[this._nextToAct].id;
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
    get state() {
        // const players: PlayerState[] = this._players.map((p, i) => {
        //     const player = new Player(p.id, p.chips, p.holeCards);
        //     return player.getPlayerState(this, i);
        // });

        const players: PlayerState[] = [];

        for (let i = 0; i < this._players.length; i++) {
            const player = new Player(this._players[i].id, this._players[i].chips, this._players[i].holeCards);
            players.push(player.getPlayerState(this, i));
        }

        return new TexasHoldemGameState(
            this._address,
            this._smallBlind,
            this._bigBlind,
            this._dealer,
            players,
            this._communityCards,
            this.pot,
            0n,
            this._currentRound,
            this._winners
        );
    }

    // return this.currentRound === TexasHoldemRound.ANTE
    //     ? new TexasHoldemJoinState(this._players.map(p => p.id))
    //     : new TexasHoldemGameState(
    //           this._address,
    //           this._smallBlind,
    //           this._bigBlind,
    //           this._dealer,
    //           players,
    //           this._communityCards,
    //           this.pot,
    //           this.getMaxStake(),
    //           this._currentRound,
    //           this._winners
    //       );
    //}

    getPlayerCount() {
        let count = 0;
        for (let i = 0; i < this._players.length; i++) {
            if (this._players[i].id !== ethers.ZeroAddress) {
                count++;
            }
        }

        console.log("Player count: ", count);
        return count;
    }

    deal() {
        if (![TexasHoldemRound.ANTE, TexasHoldemRound.SHOWDOWN].includes(this.currentRound)) throw new Error("Hand currently in progress.");

        this.init(this._update);
    }

    join(player: Player) {
        const seat = this.getNextSeat();
        this._players[seat] = player;

        // Check to see if player is already in the game
        if (this._players.some(p => p.id === player.id)) {
            // throw new Error("Player already in game.");
            console.log("Player already in game.");
            // return;
        }

        // if (player.chips < this._minBuyIn) {
        //     // throw new Error("Player does not have enough chips to join.");
        //     console.log("Player does not have enough chips to join.");
        //     return;
        // }

        if (this.getPlayerCount() >= this._maxPlayers) {
            // throw new Error("Game full.");
            console.log("Game full.");
            return;
        }

        // Auto join the first player
        if (this.getPlayerCount() === 1 && this.currentRound === TexasHoldemRound.ANTE) {
            // post small blind
            console.log("Posting small blind");
            new SmallBlindAction(this, this._update).execute(player, this._smallBlind);
        }

        // Auto join the second player
        if (this._players.length === 2 && this.currentRound === TexasHoldemRound.ANTE) {
            // post big blind
            new BigBlindAction(this, this._update).execute(player, this._bigBlind);
        }

        // // Check if we haven't dealt
        // if (this._players.length === this._minPlayers && this.currentRound === TexasHoldemRound.ANTE) {
        //     this.deal();
        // }
    }

    join2(address: string, stack: BigInt) {
        // This wont work because we fill the array with empty players
        // if (this._players.length >= this._maxPlayers) throw new Error("Game full.");

        const player = new Player(address, stack);
        this.join(player);
    }

    leave(playerId: string) {
        const index = this._players.findIndex(p => p.id === playerId);
        if (index === -1) throw new Error("Player not found.");
        
        this._players.splice(index, 1);
    }

    getValidActions(playerId: string): LegalAction[] {
        const verifyAction = (action: BaseAction) => {
            try {
                const range = action.verify(player);
                return { action: action.type, ...(range ? { minAmount: range.minAmount, maxAmount: range.maxAmount } : {}) };
            } catch {
                return null;
            }
        }

        const player = this.getPlayer(playerId);
        return this._actions.map(verifyAction).filter(a => a) as LegalAction[];
    }

    getLastAction(playerId: string): Turn | undefined {
        const player = this.getPlayer(playerId);
        const status = this.getPlayerStatus(player);

        if (status === PlayerStatus.ACTIVE) return this.getPlayerActions(player).at(-1);
        if (status === PlayerStatus.ALL_IN) return { playerId, action: PlayerActionType.ALL_IN };
        if (status === PlayerStatus.FOLDED) return { playerId, action: PlayerActionType.FOLD };

        return undefined;
    }

    performAction(playerId: string, action: PlayerActionType, amount?: BigInt) {
        if (this.currentRound === TexasHoldemRound.ANTE) {
            if (action !== PlayerActionType.SMALL_BLIND && action !== PlayerActionType.BIG_BLIND) {
                if (this._players.length < this._minPlayers) {
                    throw new Error("Not enough players to start game.");
                }
            }

            // throw new Error(`Cannot perform ${action} until game started.`);
        }

        const player = this.getPlayer(playerId);

        switch (action) {
            case PlayerActionType.FOLD:
                return new FoldAction(this, this._update).execute(player, 0n);
            case PlayerActionType.CHECK:
                return new CheckAction(this, this._update).execute(player, 0n);
            case PlayerActionType.BET:
                if (!amount) throw new Error("Amount must be provided for bet.");
                return new BetAction(this, this._update).execute(player, amount);
            case PlayerActionType.CALL:
                const call: BigInt = 0n;
                return new CallAction(this, this._update).execute(player, call);
            default:
                throw new Error("Invalid action.");
        }

        // return this._actions.find(a => a.type == action)?.execute(this.getPlayer(playerId), amount);
    }

    getPlayer(playerId: string): Player {
        const player = this._players.find(p => p.id === playerId);
        if (!player) throw new Error("Player not found.");
        return player;
    }

    getPlayerStatus(player: Player): PlayerStatus {
        let totalActions: number = 0;

        if (this._currentRound !== TexasHoldemRound.ANTE) {
            // for (const stage = TexasHoldemRound.ANTE; stage <= this._currentRound; this.setNextRound()) {
            //     const actions = this.getPlayerActions(player, stage);
            //     totalActions += actions.length;

            //     if (actions.some(m => m.action === PlayerActionType.FOLD)) return PlayerStatus.FOLDED;

            //     if (actions.some(m => m.action === PlayerActionType.ALL_IN)) return PlayerStatus.ALL_IN;
            // }
        }

        return !totalActions && !player.chips ? PlayerStatus.SITTING_OUT : PlayerStatus.ACTIVE;
    }

    getBets(round: TexasHoldemRound = this._currentRound): Map<string, BigInt> {
        // if (this._currentRound === TexasHoldemRound.ANTE) throw new Error("Cannot retrieve stakes until game started.");

        const i = this.getRoundAsNumber(round);
        // const _round = this._rounds.filter(r => r.type === round);

        const bets = new Map<string, BigInt>();

        this._rounds[i].actions.forEach(m => {
            // const action = m.action;
            const amount = m.amount ?? 0n;
            bets.set(m.playerId, amount);
        });

        // return this._rounds[i].actions.reduce((acc, v) => {
        //     acc.set(v.playerId, (acc.get(v.playerId) ?? 0n) + (v.amount ?? 0n));
        //     return acc;
        // }, new Map<string, BigInt>());

        return bets;
    }

    getPlayerStake(player: Player, stakes = this.getBets()): BigInt {
        return stakes.get(player.id) ?? 0n;
    }

    // I dont understand this?
    getMaxStake(bets = this.getBets()): BigInt {
        // return bets.size ? Math.max(...bets.values()) : 0;
        const max: BigInt = 10000000000000000000n;
        return max;
    }

    getPot(bets = this.getBets()): BigInt {
        // return Array.from(bets.values()).reduce((acc, v) => acc + v, 0);
        // todo: fix
        return 0n;
    }

    // Not sure why we need this
    private getStartingPot(): BigInt {
        const pot: BigInt = 0n;
        // for (let stage = TexasHoldemRound.PREFLOP; stage < this._currentRound; this.setNextRound()) pot += this.getPot(this.getBets(stage));
        return pot;
    }

    private init(update: IUpdate): void {
        // this._rounds = [{ actions: [] }];
        // this._rounds = []; // TODO: add ante stage

        this._deck = new Deck(DeckType.STANDARD_52);
        this._communityCards = [];
        this._sidePots = new Map<PlayerId, BigInt>();
        this._winners = undefined;
        this._currentRound = TexasHoldemRound.PREFLOP;
        this._nextToAct = this._dealer;

        const active = this.getActivePlayers();
        if (active.length <= 1) throw new Error("Not enough active players to start next hand.");

        this._dealer = active[0]; // find the next free player from the previous button position and allocate the button to them
        this._smallBlindPosition = active[1];
        this._bigBlindPosition = active[2 % active.length];
        this._nextToAct = active[3 % active.length];

        // TODO: Handle scenario where position can't cover the blind

        this._deck.shuffle();
        this._players.forEach(p => (p.holeCards = this._deck.deal(2) as [Card, Card]));

        new BigBlindAction(this, update).execute(this._players[this._bigBlindPosition], this._bigBlind);
        new SmallBlindAction(this, update).execute(this._players[this._smallBlindPosition], this._smallBlind);
    }

    private getPlayerActions(player: Player, round: TexasHoldemRound = this._currentRound): Turn[] {
        const i = this.getRoundAsNumber(round);

        if (this._rounds[i] === undefined) return [];

        return this._rounds[i].actions.filter(m => m.playerId === player.id);
    }

    private getActivePlayers(): number[] {
        return [...Array(this._players.length).keys()].reduce((acc, i) => {
            const index = (this._nextToAct + 1 + i) % this._players.length;
            return this.getPlayerStatus(this._players[index]) === PlayerStatus.ACTIVE ? [...acc, index] : acc;
        }, [] as Array<number>);
    }

    private nextPlayer(): void {
        const bets = this.getBets();
        const maxStakes = this.getMaxStake(bets);

        const isPlayerTurnFinished = (p: Player) =>
            this.getPlayerActions(p).filter(m => m.action != PlayerActionType.BIG_BLIND).length && this.getPlayerStake(p, bets) === maxStakes;

        const active = this.getActivePlayers();
        const anyAllIn = this._players.some(p => this.getPlayerStatus(p) == PlayerStatus.ALL_IN);

        if (!active.length || (active.length == 1 && !anyAllIn) || active.map(i => this._players[i]).every(isPlayerTurnFinished)) this.nextHand();
        else this._nextToAct = active[0];
    }

    private getNextSeat(): number {
        for (let i = 0; i < this._maxPlayers; i++) {
            if (this._players[i] === undefined || this._players[i].id === ethers.ZeroAddress) {
                return i;
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
        const numActive = this._players.filter(p => this.getPlayerStatus(p) === PlayerStatus.ACTIVE).length;
        
        // TODO: ROLL BACK

        // // TODO: Check this will work in all cases when multiple side pots in same round
        // this._players
        //     .filter(p => this.getPlayerStatus(p) == PlayerStatus.ALL_IN && !this._sidePots.has(p.id))
        //     .forEach(p => this._sidePots.set(p.id, startingPot + this.getPlayerStake(p) * (1 + numActive)));
    }

    private calculateWinner(): void {
        const hands = new Map<PlayerId, any>(
            this._players.map(p => [p.id, PokerSolver.Hand.solve(this._communityCards.concat(p.holeCards!).map(toPokerSolverMnemonic))])
        );
        const active = this._players.filter(p => this.getPlayerStatus(p) === PlayerStatus.ACTIVE);
        // const orderedPots = Array.from(this._sidePots.entries()).sort(([_k1, v1], [_k2, v2]) => v1 - v2);
        this._winners = new Map<PlayerId, BigInt>();

        let pot: BigInt = this.getStartingPot();
        let winningHands = PokerSolver.Hand.winners(active.map(a => hands.get(a.id)));
        let winningPlayers = this._players.filter(p => winningHands.includes(hands.get(p.id)));

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

        function update(player: Player, portion: BigInt, winners: Map<PlayerId, BigInt>) {
            // player.chips += portion;
            // winners.set(player.id, (winners.get(player.id) ?? 0) + portion);
        }

        function toPokerSolverMnemonic(card: Card) {
            return card.mnemonic.replace("10", "T");
        }
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

    // Rehydrate the game from a DTO
    // NOT SURE THIS GUY IS NEEDED
    public static fromState(state: TexasHoldemGameState): TexasHoldemGame {
        const sb = 10n;
        const bb = 30n;
        const dealer = 0;
        const players: PlayerState[] = [];
        const communityCards: Card[] = [];
        const pot = 0n;
        const currentBet = 0n;
        const round = TexasHoldemRound.PREFLOP;
        const winners = undefined;

        const game = new TexasHoldemGame(ethers.ZeroAddress, sb, bb, dealer);

        // game._players = state.players.map(p => new Player(p.address, p.stack, p.holeCards));
        // game._communityCards = state.communityCards;
        // game._currentRound = state.round;
        // game._winners = state.winners;

        return game;
    }

    public static fromJson(json: any): TexasHoldemGame {
        const players: PlayerState[] = [];
        return new TexasHoldemGame(json.address, BigInt(parseInt(json.smallBlind)), BigInt(parseInt(json.bigBlind)), json.dealer, json.nextToAct, json.round, json.communityCards, json.pots[0]);
    }
}

export default TexasHoldemGame;
