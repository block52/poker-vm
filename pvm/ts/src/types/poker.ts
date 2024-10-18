export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

export type Card = {
  suit: Suit;
  rank: Rank;
};

export class Deck {
    private cards: Card[] = [];
}

export type Player = {
    address: string;
    public_key: string[];
}

export type Transaction = {
    from: string;
    to: string;
    amount: number;
}