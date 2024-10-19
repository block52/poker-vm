export interface IModel {
    getId(): string;
    isValid(): boolean;
    toJson(): any;
}