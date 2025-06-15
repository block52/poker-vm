export interface IBot {
    tableAddress: string;
    isTurn: boolean;
    hasJoined(): Promise<boolean>;
    joinGame(): Promise<boolean>;
    performAction(): Promise<void>;
}