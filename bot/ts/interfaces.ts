export interface IBot {
    joinGame(): Promise<boolean>;
    performAction(): Promise<void>;
}