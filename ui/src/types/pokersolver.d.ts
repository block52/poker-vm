declare module "pokersolver" {
    export interface SolvedHand {
        name: string;
        descr: string;
        rank: number;
        cards: string[];
    }

    export class Hand {
        static solve(cards: string[], game?: string, canDisqualify?: boolean): SolvedHand;
        static winners(hands: SolvedHand[]): SolvedHand[];
        toString(): string;
    }
}
