export interface ICommand<T> {
  executeCommand(): Promise<T>;
}

export interface ISignedCommand<T> extends ICommand<T> {
  execute(): Promise<ISignedResponse<T>>;
  // executeCommand(): Promise<T>;
}

export interface ISignedResponse<T> {
  data: T;
  signature: string;
}
