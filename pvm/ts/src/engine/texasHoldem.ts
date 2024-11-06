import { ActionType, IUpdate, Move, Player, PlayerStatus } from "./types";
import { Card, Deck, DeckType } from "../models/deck";
import AllInAction from "./actions/allInAction";
import BaseAction from "./actions/baseAction";
import BetAction from "./actions/betAction";
import BigBlindAction from "./actions/bigBlindAction";
import CallAction from "./actions/callAction";
import CheckAction from "./actions/checkAction";
import FoldAction from "./actions/foldAction";
import RaiseAction from "./actions/raiseAction";
import SmallBlindAction from "./actions/smallBlindAction";

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

  constructor(private _players: Player[], private _smallBlind: number, private _bigBlind: number, private _buttonPosition: number) {
    this._stages = [{ moves: [] }];
    this._currentStage = StageType.PRE_FLOP;
    this._deck = new Deck(DeckType.STANDARD_52);
    this._communityCards = [];
    this._currentPlayer = (this._buttonPosition + 3) % _players.length;

    const update = new class implements IUpdate {
      constructor(public game: TexasHoldemGame) { }
      addMove(move: Move): void {
        this.game._stages[this.game._currentStage].moves.push(move);
        this.game.nextPlayer();
      }
    }(this);
    this._actions = [
      new FoldAction(this, update),
      new CheckAction(this, update),
      new BetAction(this, update),
      new CallAction(this, update),
      new RaiseAction(this, update),
      new AllInAction(this, update)
    ];

    this.start(update);
  }

  get bigBlind() { return this._bigBlind; }
  get smallBlind() { return this._smallBlind; }
  get bigBlindPosition() { return (this._buttonPosition + 2) % this._players.length; }
  get smallBlindPosition() { return (this._buttonPosition + 1) % this._players.length; }
  get currentPlayerId() { return this._players[this._currentPlayer].id; }
  get currentStage() { return this._currentStage; }

  private start(update: IUpdate) {
    // !! this._deck.shuffle([]);
    this._players.forEach(p => p.holeCards = this._deck.deal(2) as [Card, Card]);
    new BigBlindAction(this, update).execute(this._players[this.bigBlindPosition]);
    new SmallBlindAction(this, update).execute(this._players[this.smallBlindPosition]);
  }

  getValidActions(playerId: string) {
    const player = this.getPlayer(playerId);
    return this._actions.map(verifyAction).filter(a => a);

    function verifyAction(action: BaseAction) {
      try {
        const minAmount = action.verify(player);
        return { action: action.type, ...minAmount ? { minAmount } : {} };
      } catch {
        return null;
      }
    }
  }

  performAction(playerId: string, action: ActionType, amount?: number) {
    return this._actions.find(a => a.type == action)?.execute(this.getPlayer(playerId), amount);
  }

  getPlayer(playerId: string): Player {
    const player = this._players.find(p => p.id === playerId);
    if (!player)
      throw new Error("Player not found.");
    return player;
  }

  getPlayerStatus(player: Player) {
    for (let stage = StageType.PRE_FLOP; stage <= this._currentStage; stage++) {
      if (this._stages[stage].moves.some(m => (m.playerId == player.id) && (m.action == ActionType.FOLD)))
        return PlayerStatus.FOLD;
      if (this._stages[stage].moves.some(m => (m.playerId == player.id) && (m.action == ActionType.ALL_IN)))
        return PlayerStatus.ALL_IN;
    }
    return PlayerStatus.ACTIVE;
  }

  getStakes(stage: StageType = this._currentStage): Map<string, number> {
    return this._stages[stage].moves.reduce(
      (acc, v) => { acc.set(v.playerId, (acc.get(v.playerId) ?? 0) + (v.amount ?? 0)); return acc; },
      new Map<string, number>());
  }

  getPlayerStake(player: Player, stage: StageType = this._currentStage): number {
    return this.getStakes(stage).get(player.id) ?? 0;
  }

  getMaxStake(stage: StageType = this._currentStage) {
    const stakes = this.getStakes(stage);
    return stakes.size ? Math.max(...stakes.values()) : 0;
  }

  getPot() {
    let pot = 0;
    for (let stage = StageType.PRE_FLOP; stage <= this._currentStage; stage++)
      pot += Array.from(this.getStakes(stage).values()).reduce((acc, v) => acc + v, 0);
    return pot;
  }

  private isPlayerTurnFinished(player: Player, maxStake: number) {
    return this._stages[this._currentStage].moves.some(m => (m.playerId == player.id)) && (this.getPlayerStake(player) == maxStake);
  }

  private nextPlayer() {
    const active = [...Array(this._players.length).keys()].reduce((acc, i) => {
      const index = (this._currentPlayer + 1 + i) % this._players.length;
      return this.getPlayerStatus(this._players[index]) === PlayerStatus.ACTIVE ? [...acc, index] : acc;
    }, [] as Array<number>);
    const maxStake = this.getMaxStake();
    if ((active.length <= 1) || active.every(i => this.isPlayerTurnFinished(this._players[i], maxStake)))
      this.nextStage();
    else
      this._currentPlayer = active[0];
  }

  private nextStage() {
    if (this._currentStage < StageType.SHOWDOWN)
      this._currentStage++;
    if (this._currentStage != StageType.SHOWDOWN) {
      this._stages.push({ moves: [] });
      if (this._currentStage == StageType.FLOP)
        this._communityCards.push(...this._deck.deal(3));
      else if ((this._currentStage == StageType.TURN) || (this._currentStage == StageType.RIVER))
        this._communityCards.push(...this._deck.deal(1));
      this._currentPlayer = this._buttonPosition;
      this.nextPlayer();
    }
    else
      this.calculateWinner();
  }

  private calculateWinner() {
  }
}

export default TexasHoldemGame;