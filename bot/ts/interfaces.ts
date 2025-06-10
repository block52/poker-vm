export interface IBot {
    tableAddress: string;
    isTurn: boolean;
    joinGame(): Promise<boolean>;
    performAction(): Promise<void>;
}