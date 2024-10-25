export interface ICommand<T> {
  execute(): Promise<ISignedResponse<T>>;
  executeCommand(): Promise<T>;
}

export interface ISignedResponse<T> {
  result: T;
  signature: string;
}
