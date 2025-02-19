import { ActionDTO, LegalActionDTO, PlayerActionType, PlayerDTO, PlayerStatus, TexasHoldemGameStateDTO, TexasHoldemRound, WinnerDTO } from "@bitcoinbrisbane/block52";
import { IUpdate, Turn, Player, PlayerId, TexasHoldemGameState, LegalAction, PlayerState } from "../models/game";
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
import { IPoker } from "./types";
import { ethers } from "ethers";
// import { FixedCircularList } from "./linkedList";

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

export type PlayerStateType = {
    address: string;
    chips: bigint;
    playerStatus: PlayerStatus;
    cards: [Card, Card];
};


class TexasHoldemGame implements IPoker {
    private readonly _update: IUpdate;

    // Players should be a map of player to seat index

    private readonly _playersMap: Map<number, Player | null>;

    // private readonly _players: Player[];
    // private readonly _players: (Player | null)[];
    // private readonly _seats: FixedCircularList<Player>;

    private _rounds!: Round[];
    private _deck!: Deck;
    private _sidePots!: Map<PlayerId, bigint>;
    private _winners?: Map<PlayerId, bigint>;

    private _bigBlindPosition: number;
    private _smallBlindPosition: number;
    private _actions: BaseAction[];

    constructor(
        private _address: string,
        private _minBuyIn: bigint,
        private _maxBuyIn: bigint,
        private _minPlayers: number,
        private _maxPlayers: number,
        private _smallBlind: bigint,
        private _bigBlind: bigint,
        private _dealer: number = 0,
        private _nextToAct: number = 1,
        private _currentRound: TexasHoldemRound = TexasHoldemRound.ANTE,
        private _communityCards: Card[] = [],
        private _pot: bigint = 0n,
        private playerStates: Map<number, Player>
    ) {
        // this._players = new Map<number, Player>();
        // Create an array of players with max size of 9

        // const args = schema.split(",");

        // this._minPlayers = Number(args[0]);
        // this._maxPlayers = Number(args[1]);
        // this._smallBlind = BigInt(args[2]);
        // this._bigBlind = BigInt(args[3]);

        // this._players = [];
        this._playersMap = new Map<number, Player>();

        // // Do this functionally
        // for (let i = 0; i < playerStates.length; i++) {
        //     const { seat, chips, cards } = playerStates[i];
        //     // const player = new Player(this._address, chips, cards);
        //     this._players[seat] = player;
        //     this._playersMap.set(seat, player);
        // }

        // for (let i = 0; i < this._maxPlayers; i++) {
        //     const playerState = playerStates.find(p => p.seat === i);

        //     if (playerState) {
        //         const { seat, chips, cards } = playerState;
        //         // const player = new Player(this._address, chips, cards);
        //         this._players[seat] = player;
        //         this._playersMap.set(seat, player);
        //     } else {
        //         this._players.push(null);
        //     }
        // }

        // this._seats = new FixedCircularList<Player>(this._maxPlayers, null);

        this._currentRound = _currentRound;
        this._nextToAct = _nextToAct;

        this._smallBlindPosition = _dealer + 1;
        this._bigBlindPosition = _dealer + 2;

        this._rounds = [{ type: TexasHoldemRound.ANTE, actions: [] }];
        this._dealer = _dealer;
        // this._buttonPosition--; // avoid auto-increment on next game for join round

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
        // return [...this._players];

        // return player or nullable player in an array
        // return this._players.map(p => p.id === ethers.ZeroAddress ? null : p);

        // for (let i = 0; i < this._players.length; i++) {
        //     const player = this._playersMap.get(i);
        //     players.push(player);
        // }

        // return players;

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
        // return this._players[this._nextToAct].id;
        // return this._players[this._nextToAct].id ?? ethers.ZeroAddress;
        // return this._players[this._nextToAct]?.address ?? ethers.ZeroAddress;

        return this._playersMap.get(this._nextToAct)?.address ?? ethers.ZeroAddress;
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
    // get state() {
    //     // const players: PlayerState[] = this._players.map((p, i) => {
    //     //     const player = new Player(p.id, p.chips, p.holeCards);
    //     //     return player.getPlayerState(this, i);
    //     // });

    //     const playerStates: PlayerState[] | null = [];
    //     const _players = this.players;

    //     // // TODO: DO WITH A MAP
    //     // for (let i = 0; i < this._players.length; i++) {
    //     //     const player = _players[i];
    //     //     if (player) {
    //     //         // playerStates.push(player.getPlayerState(this, i));
    //     //     }
    //     // }

    //     return new TexasHoldemGameState(
    //         this._address,
    //         this._smallBlind,
    //         this._bigBlind,
    //         this._smallBlindPosition,
    //         this._bigBlindPosition,
    //         this._dealer,
    //         playerStates,
    //         this._communityCards,
    //         this.pot,
    //         0n,
    //         this._currentRound,
    //         this._winners
    //     );
    // }

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

    exists(playerId: string): boolean {
        for (const [seat, player] of this._playersMap.entries()) {
            if (player?.address === playerId) {
                return true;
            }
        }

        return false;
    }

    getPlayerCount() {
        return Array.from(this._playersMap.values()).filter((player): player is Player => player !== null).length;
    }

    deal(seed: number[] = []): void {
        if (![TexasHoldemRound.ANTE, TexasHoldemRound.SHOWDOWN].includes(this.currentRound)) throw new Error("Hand currently in progress.");

        // this.init(this._update);
        this._deck = new Deck();
        this._deck.shuffle(seed);

        const players = this.getSeatedPlayers();
        players.forEach(p => {
            // todo: get share secret
            const cards = this._deck.deal(2) as [Card, Card];
            // p.holeCards = cards;
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

    join2(address: string, stack: bigint) {
        // This wont work because we fill the array with empty players
        // if (this._players.length >= this._maxPlayers) throw new Error("Game full.");

        const player = new Player(address, stack);
        this.join(player);
    }

    joinAtSeat(player: Player, seat: number) {
        if (this._players[seat] !== null) {
            throw new Error("Seat already taken.");
        }

        if (this.getPlayerCount() + 1 >= this._maxPlayers) {
            // throw new Error("Game full.");
            console.log("Table full.");
            return;
        }

        this._players[seat] = player;

        // if (player.chips < this._minBuyIn) {
        //     // throw new Error("Player does not have enough chips to join.");
        //     console.log("Player does not have enough chips to join.");
        //     return;
        // }

        // Auto join the first player
        if (this.getPlayerCount() === 1 && this.currentRound === TexasHoldemRound.ANTE) {
            // post small blind
            console.log("Posting small blind");
            new SmallBlindAction(this, this._update).execute(player, this._smallBlind);
        }

        // Auto join the second player
        if (this.getPlayerCount() === 2 && this.currentRound === TexasHoldemRound.ANTE) {
            // post big blind
            new BigBlindAction(this, this._update).execute(player, this._bigBlind);
        }

        // Check if we haven't dealt
        if (this.getPlayerCount() === this._minPlayers && this.currentRound === TexasHoldemRound.ANTE) {
            this.deal();
        }
    }

    leave(address: string) {
        const player = this.getPlayerSeatNumber(address);
        this._playersMap.set(player, null);
    }

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

    getLastAction(address: string): Turn | undefined {
        const player = this.getPlayer(address);
        const status = this.getPlayerStatus(player);

        if (status === PlayerStatus.ACTIVE) return this.getPlayerActions(player).at(-1);
        if (status === PlayerStatus.ALL_IN) return { playerId: address, action: PlayerActionType.ALL_IN };
        if (status === PlayerStatus.FOLDED) return { playerId: address, action: PlayerActionType.FOLD };

        return undefined;
    }

    performAction(address: string, action: PlayerActionType, amount?: bigint) {
        if (this.currentRound === TexasHoldemRound.ANTE) {
            if (action !== PlayerActionType.SMALL_BLIND && action !== PlayerActionType.BIG_BLIND) {
                if (this._.length < this._minPlayers) {
                    throw new Error("Not enough players to start game.");
                }
            }

            // throw new Error(`Cannot perform ${action} until game started.`);
        }

        const player = this.getPlayer(address);

        switch (action) {
            case PlayerActionType.FOLD:
                return new FoldAction(this, this._update).execute(player, 0n);
            case PlayerActionType.CHECK:
                return new CheckAction(this, this._update).execute(player, 0n);
            case PlayerActionType.BET:
                if (!amount) throw new Error("Amount must be provided for bet.");
                return new BetAction(this, this._update).execute(player, amount);
            case PlayerActionType.CALL:
                const call: bigint = 0n;
                return new CallAction(this, this._update).execute(player, call);
            default:
                throw new Error("Invalid action.");
        }

        // return this._actions.find(a => a.type == action)?.execute(this.getPlayer(playerId), amount);
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

    getPlayerAtSeat(seat: number): Player {
        const player = this._playersMap.get(seat);
        if (!player) throw new Error("Player not found.");
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

        // return !totalActions && !player.chips ? PlayerStatus.SITTING_OUT : PlayerStatus.ACTIVE;

        return PlayerStatus.ACTIVE;
    }

    /**
     * Gets the number of active players in the game
     * @returns The number of players with status "active"
     */
    getActivePlayerCount(): number {
        //return Array.from(this._playersMap.values()).filter((player): player is Player => player !== null && player.s === "active").length;
        
        return 0;
    }

    getBets(round: TexasHoldemRound = this._currentRound): Map<string, bigint> {
        // if (this._currentRound === TexasHoldemRound.ANTE) throw new Error("Cannot retrieve stakes until game started.");

        const i = this.getRoundAsNumber(round);
        // const _round = this._rounds.filter(r => r.type === round);

        const bets = new Map<string, bigint>();

        this._rounds[i].actions.forEach(m => {
            const amount = m.amount ?? 0n;
            bets.set(m.playerId, amount);
        });

        // return this._rounds[i].actions.reduce((acc, v) => {
        //     acc.set(v.playerId, (acc.get(v.playerId) ?? 0n) + (v.amount ?? 0n));
        //     return acc;
        // }, new Map<string, BigInt>());

        return bets;
    }

    getPlayerStake(player: Player, bets = this.getBets()): bigint {
        return bets.get(player.address) ?? 0n;
    }

    // I dont understand this?
    getMaxStake(bets = this.getBets()): bigint {
        // return bets.size ? Math.max(...bets.values()) : 0;
        const max: bigint = 10000000000000000000n;
        return max;
    }

    getPot(bets = this.getBets()): bigint {
        // todo: check this

        let pot: bigint = 0n;

        for (let [key, value] of bets) {
            // console.log(key, value);
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

    // private init(update: IUpdate): void {
    //     // this._rounds = [{ actions: [] }];
    //     // this._rounds = []; // TODO: add ante stage

    //     this._deck = new Deck(DeckType.STANDARD_52);
    //     this._communityCards = [];
    //     this._sidePots = new Map<PlayerId, bigint>();
    //     this._winners = undefined;
    //     this._currentRound = TexasHoldemRound.PREFLOP;
    //     this._nextToAct = this._dealer; // this is wrong

    //     const active = this.getActivePlayers();
    //     if (active.length <= 1) throw new Error("Not enough active players to start next hand.");

    //     this._dealer = active[0]; // find the next free player from the previous button position and allocate the button to them
    //     this._smallBlindPosition = active[1];
    //     this._bigBlindPosition = active[2 % active.length];
    //     this._nextToAct = active[3 % active.length];

    //     // TODO: Handle scenario where position can't cover the blind

    //     this._deck.shuffle();
    //     this._players.forEach(p => (p.holeCards = this._deck.deal(2) as [Card, Card]));

    //     new BigBlindAction(this, update).execute(this._players[this._bigBlindPosition], this._bigBlind);
    //     new SmallBlindAction(this, update).execute(this._players[this._smallBlindPosition], this._smallBlind);
    // }

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

    // private nextPlayer(): void {
    //     const bets = this.getBets();
    //     const maxStakes = this.getMaxStake(bets);

    //     const isPlayerTurnFinished = (p: Player) =>
    //         this.getPlayerActions(p).filter(m => m.action != PlayerActionType.BIG_BLIND).length && this.getPlayerStake(p, bets) === maxStakes;

    //     const active = this.getActivePlayers();
    //     const anyAllIn = this.getSeatedPlayers().some(p => this.getPlayerStatus(p) == PlayerStatus.ALL_IN);

    //     if (!active.length || (active.length == 1 && !anyAllIn) || active.map(i => this._players[i]).every(isPlayerTurnFinished)) this.nextHand();
    //     else this._nextToAct = active[0];
    // }

    private nextPlayer(): void {}

    findNextSeat(): number {
        const maxSeats = this._maxPlayers; //this._playersMap.size;

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
        const numActive = this.getSeatedPlayers().filter(p => this.getPlayerStatus(p) === PlayerStatus.ACTIVE).length;

        // TODO: ROLL BACK

        // // TODO: Check this will work in all cases when multiple side pots in same round
        // this._players
        //     .filter(p => this.getPlayerStatus(p) == PlayerStatus.ALL_IN && !this._sidePots.has(p.id))
        //     .forEach(p => this._sidePots.set(p.id, startingPot + this.getPlayerStake(p) * (1 + numActive)));
    }

    private calculateWinner(): void {
        const players = this.getSeatedPlayers();

        const hands = new Map<PlayerId, any>(
            players.map(p => [p.id, PokerSolver.Hand.solve(this._communityCards.concat(p.holeCards!).map(toPokerSolverMnemonic))])
        );

        const active = players.filter(p => this.getPlayerStatus(p) === PlayerStatus.ACTIVE);
        // const orderedPots = Array.from(this._sidePots.entries()).sort(([_k1, v1], [_k2, v2]) => v1 - v2);
        this._winners = new Map<PlayerId, bigint>();

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

        function update(player: Player, portion: bigint, winners: Map<PlayerId, bigint>) {
            // player.chips += portion;
            // winners.set(player.id, (winners.get(player.id) ?? 0) + portion);
        }

        function toPokerSolverMnemonic(card: Card) {
            return card.mnemonic.replace("10", "T");
        }
    }

    private updatePlayer(addres: string, amount: bigint): void {
        const player = this.getPlayer(addres);
        player.chips += amount;
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
        const playerStates: PlayerStateType[] = json.players.map((p: any) => {
            return {
                address: p.id,
                seat: p.seat,
                chips: p.chips,
                cards: [p.holeCards[0], p.holeCards[1]]
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
            json.round,
            json.communityCards,
            json.pots[0],
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

        // minBuyIn: this._minBuyIn,
        // maxBuyIn: this._maxBuyIn,
        // minPlayers: this._minPlayers,
        // maxPlayers: this._maxPlayers,
        // dealer: this._dealer,
        // nextToAct: this._nextToAct,
        // round: this._currentRound,
        // communityCards: this._communityCards,
        // pots: [this._pot],
        // players: Array.from(this._playersMap.values())
    }
}

export default TexasHoldemGame;
