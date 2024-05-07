import { Deck, Player } from "./types";

class Holdem {
  private readonly deck: Deck;
  public readonly: Player[] = [];

  constructor() {
    this.deck = new Deck();
  }

  public shuffle(seed: number[]): string {
    return "";
  }
}

export { Holdem };
