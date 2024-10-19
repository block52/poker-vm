export interface IModel {
    getId(): string;
    toJson(): any;
}

export interface ICryptoModel extends IModel {
    getHash(): string;
    isValid(): boolean;
}