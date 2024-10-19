export interface ICommand {
    execute(): Promise<string>;
}

export interface ICardDeck {
    shuffleDeck(): void;
    drawCard(): string;
}
