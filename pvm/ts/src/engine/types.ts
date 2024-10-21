export type TexasHoldemState = {
    smallBlind: number;
    bigBlind: number;
    players: string[];
    deck: string[];
    communityCards?: string[];
    turn?: string; // Card
    river?: string; // Card
    pot: number;
    currentBet: number;
    dealer: number; // index of dealer
    nextPlayer: number; // index of next player to act
    round: string; // "PREFLOP" | "FLOP" | "TURN" | "RIVER" | "SHOWDOWN"
    winner?: number;
    handNumber: number;
};
