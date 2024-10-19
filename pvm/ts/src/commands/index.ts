export interface ICommand {
    execute(): Promise<string>;
}