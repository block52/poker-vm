export interface IJSONModel {
  toJson(): any;
}

export interface IModel extends IJSONModel {
  getId(): string;
}

export interface ICryptoModel extends IModel {
  calculateHash(): string;
  verify(): boolean;
}
