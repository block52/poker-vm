export interface IModel {
    getId(): string;
    toJson(): any;
}

export interface ICryptoModel extends IModel {
    calculateHash(): string;
    verify(): boolean;
}