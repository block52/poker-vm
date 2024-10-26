export interface ICommand<T> {
  execute(): Promise<T>;
}

export interface ISignedCommand<T> extends ICommand<ISignedResponse<T>> {
  execute(): Promise<ISignedResponse<T>>;
}

export interface ISignedResponse<T> {
  data: T;
  signature: string;
}
