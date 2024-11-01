import { Card, Deck, DeckType } from "../models/deck";

type PlayerId = string;

type Player = {
  id: string;
  name: string;
  chips: number;
  status: string;
  holeCards?: [Card, Card]; // Each player has 2 cards, represented as strings like 'As' (Ace of spades)
};

enum PlayerStatus {
  ACTIVE,
  FOLD,
  ALL_IN
}

enum ActionType {
  BLIND,
  FOLD,
  CHECK,
  BET,
  CALL,
  RAISE,
  ALL_IN
}

type Move = {
  playerId: string;
  action: ActionType;
  amount?: number;
};

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

  constructor(private _players: Player[], private smallBlind: number, private _buttonPosition: number) {
    this._stages = [];
    this._currentStage = StageType.PRE_FLOP;
    this._deck = new Deck(DeckType.STANDARD_52);
    this._communityCards = [];
    this._currentPlayer = (this.smallBlindPosition + 1) % _players.length;
    this.start();
  }

  private get bigBlind() { return 2 * this.smallBlind }
  private get bigBlindPosition() { return (this._buttonPosition + 2) % this._players.length }
  private get smallBlindPosition() { return (this._buttonPosition + 1) % this._players.length }

  private start() {
    this._deck.shuffle([]);
    /* !!
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

  private getPlayer(playerId: string): Player {
    const player = this._players.find(p => p.id === playerId);
    if (!player)
      throw new Error("Player not found.");
    return player;
  }

  private getPlayerStatus(player: Player) {
    // !! need to handle earlier stages
    if (this._stages[this._currentStage].moves.some(m => m.playerId == player.id && m.action == ActionType.FOLD))
      return PlayerStatus.FOLD;
    if (this._stages[this._currentStage].moves.some(m => m.playerId == player.id && m.action == ActionType.ALL_IN))
      return PlayerStatus.ALL_IN;
    return PlayerStatus.ACTIVE;
  }

  private getStakes(): Map<string, number> {
    return this._stages[this._currentStage].moves.reduce(
      (acc, v) => { acc.set(v.playerId, (acc.get(v.playerId) ?? 0) + (v.amount ?? 0)); return acc; },
      new Map<string, number>());
  }

  private getPlayerStake(player: Player): number {
    return this.getStakes().get(player.id) ?? 0;
  }

  private getMaxStake() {
    const stakes = this.getStakes();
    return stakes.size ? Math.max(...stakes.values()) : 0;
  }

  verifyFold(player: Player) {
    if (this.getPlayerStatus(player) != PlayerStatus.ACTIVE)
      throw new Error("Only active player can fold.");
  }

  fold(player: Player) {
    this._stages[this._currentStage].moves.push({ playerId: player.id, action: ActionType.FOLD });
  }

  verifyCheck(player: Player) {
    // !! need to check every time to make sure they are the current player also
    if (this.getPlayerStatus(player) != PlayerStatus.ACTIVE)
      throw new Error("Only active player can check.");
    if (this.getPlayerStake(player) < this.getMaxStake())
      throw new Error("Player has insufficient stake to check.")
  }

  check(player: Player) {
    this.verifyCheck(player);
    this._stages[this._currentStage].moves.push({ playerId: player.id, action: ActionType.BET, amount: 0 });
  }

  verifyBet(player: Player, amount: number) {
    if (this.getPlayerStatus(player) != PlayerStatus.ACTIVE)
      throw new Error("Only active player can bet.");
    if (player.chips < amount)
      throw new Error("Player has insufficient chips to bet.");
    if (this.getMaxStake() > 0)
      throw new Error("A bet has already been made.")
  }

  bet(player: Player, amount: number) {
    this.verifyBet(player, amount);
    player.chips -= amount;
    this._stages[this._currentStage].moves.push({ playerId: player.id, action: ActionType.BET, amount });
  }

  verifyCall(player: Player): number {
    if (this.getPlayerStatus(player) != PlayerStatus.ACTIVE)
      throw new Error("Only active player can call.");
    if (this.getMaxStake() == 0)
      throw new Error("A bet must be made before it can be called.")
    const amount = this.getMaxStake() - this.getPlayerStake(player);
    if (player.chips < amount)
      throw new Error("Player has insufficient chips to call.");
    return amount;
  }

  call(player: Player) {
    const amount = this.verifyCall(player);
    player.chips -= amount;
    this._stages[this._currentStage].moves.push({ playerId: player.id, action: ActionType.BET, amount });
  }

  verifyRaise(player: Player, amount: number) { // !! is amount here just that over the max or includes the difference
    if (this.getPlayerStatus(player) != PlayerStatus.ACTIVE)
      throw new Error("Only active player can raise.");
    if (this.getMaxStake() == 0)
      throw new Error("A bet must be made before it can be raised.")
    if (player.chips < amount)
      throw new Error("Player has insufficient chips to raise.");
    if ((amount + this.getPlayerStake(player)) < (this.getMaxStake() + this.bigBlind))
      throw new Error("Raise is not large enough.");
  }

  raise(player: Player, amount: number) {
    this.verifyRaise(player, amount);
    player.chips -= amount;
    this._stages[this._currentStage].moves.push({ playerId: player.id, action: ActionType.BET, amount });
  }

  verifyAllIn(player: Player) {
    if (this.getPlayerStatus(player) != PlayerStatus.ACTIVE)
      throw new Error("Only active player can go all-in.");
    if (player.chips == 0) // !! check this as what happens if run out of chips in middle of game
      throw new Error("Player has no chips so can't go all-in.")
  }

  allIn(player: Player) {
    this.verifyAllIn(player);
    this._stages[this._currentStage].moves.push({ playerId: player.id, action: ActionType.ALL_IN, amount: player.chips });
    player.chips = 0;
  }
}