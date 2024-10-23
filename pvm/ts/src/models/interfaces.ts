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

export interface IBlockDocument {
  index: number;
  version: number;
  hash: string;
  merkle_root: string;
  previous_block_hash: string;
  timestamp: number;
  validator: string;
  signature: string;
  transactions?: any[];
  tx_count?: number;
}

export interface IAccountDocument {
  address: string;
  balance: number;
  nonce: number;
}

export interface ITransactionDocument {
  to: string;
  from?: string;
  value: string;
  signature: string;
  timestamp: string;
  index?: string;
  hash: string;
}
