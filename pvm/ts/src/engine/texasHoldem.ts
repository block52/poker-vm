import { ActionType, IUpdate, Move, Player, PlayerStatus } from "./types";
import { Card, Deck, DeckType } from "../models/deck";
import AllInAction from "./actions/allInAction";
import BaseAction from "./actions/baseAction";
import BetAction from "./actions/betAction";
import CallAction from "./actions/callAction";
import CheckAction from "./actions/checkAction";
import FoldAction from "./actions/foldAction";
import RaiseAction from "./actions/raiseAction";

type Stage = {
  moves: Move[];
}

enum StageType {
  PRE_FLOP = 0,
  FLOP = 1,
  TURN = 2,
  RIVER = 3,
  SHOWDOWN = 4
}

class TexasHoldemGame {
  private _stages: Stage[];
  private _currentStage: StageType;
  private _communityCards: Card[];
  private _currentPlayer: number;
  private _deck: Deck;
  private _actions: BaseAction[];

  constructor(private _players: Player[], private smallBlind: number, private _buttonPosition: number) {
    this._stages = [{ moves: [] }];
    this._currentStage = StageType.PRE_FLOP;
    this._deck = new Deck(DeckType.STANDARD_52);
    this._communityCards = [];
    this._currentPlayer = (this.smallBlindPosition + 1) % _players.length;

    const update = new class implements IUpdate {
      constructor(public game: TexasHoldemGame) { }
      addMove(move: Move): void { this.game._stages[this.game._currentStage].moves.push(move); }
    }(this);
    this._actions = [
      new FoldAction(this, update),
      new CheckAction(this, update),
      new BetAction(this, update),
      new CallAction(this, update),
      new RaiseAction(this, update),
      new AllInAction(this, update)
    ];

    this.start();
  }

  get bigBlind() { return 2 * this.smallBlind }
  get bigBlindPosition() { return (this._buttonPosition + 2) % this._players.length }
  get smallBlindPosition() { return (this._buttonPosition + 1) % this._players.length }

  private start() {
    /* !!
    this._deck.shuffle([]);
    this.placeBet(this.smallBlindPosition, this.smallBlind);
    this.placeBet(this.bigBlindPosition, this.bigBlind); */
  }

  /* !!
  nextPlayer() {
    do {
      this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
    } while (this.players[this.currentPlayer].status !== "active");
  }

  isRoundComplete() {
    const activePlayers = this.players.filter((p) => p.status === "active");
    return (
      activePlayers.every(
        (p) => p.currentBet === this.currentBet || p.chipStack === 0
      ) && this.currentPlayer === this.lastRaiseIndex
    );
  }
  */

  performAction(playerId: string, action: ActionType, amount?: number) {
    return this._actions.find(a => a.action == action)?.execute(this.getPlayer(playerId), amount);
  }

  private nextStage() {
    if (this._currentStage < StageType.SHOWDOWN)
      this._currentStage++;
    this._stages.push({ moves: [] });
    if (this._currentStage == StageType.FLOP)
      this._communityCards.push(...this._deck.deal(3));
    else if ((this._currentStage == StageType.TURN) || (this._currentStage == StageType.RIVER))
      this._communityCards.push(...this._deck.deal(1));
    this._currentPlayer = this.smallBlindPosition;
  }

  getPlayer(playerId: string): Player {
    const player = this._players.find(p => p.id === playerId);
    if (!player)
      throw new Error("Player not found.");
    return player;
  }

  getPlayerStatus(player: Player) {
    // !! need to handle earlier stages
    if (this._stages[this._currentStage].moves.some(m => m.playerId == player.id && m.action == ActionType.FOLD))
      return PlayerStatus.FOLD;
    if (this._stages[this._currentStage].moves.some(m => m.playerId == player.id && m.action == ActionType.ALL_IN))
      return PlayerStatus.ALL_IN;
    return PlayerStatus.ACTIVE;
  }

  getStakes(): Map<string, number> {
    return this._stages[this._currentStage].moves.reduce(
      (acc, v) => { acc.set(v.playerId, (acc.get(v.playerId) ?? 0) + (v.amount ?? 0)); return acc; },
      new Map<string, number>());
  }

  getPlayerStake(player: Player): number {
    return this.getStakes().get(player.id) ?? 0;
  }

  getMaxStake() {
    const stakes = this.getStakes();
    return stakes.size ? Math.max(...stakes.values()) : 0;
  }
}

export default TexasHoldemGame;