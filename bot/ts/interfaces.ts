export interface IBot {
    me: string;
    tableAddress: string;
    isTurn: boolean;
    hasJoined(): Promise<boolean>;
    joinGame(): Promise<boolean>;
    performAction(): Promise<void>;
}